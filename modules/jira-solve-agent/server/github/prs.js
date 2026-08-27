/**
 * Fetch pull requests opened by the Jira Solve Agent bot (redhat-chai-bot)
 * across the OpenShift repositories wired up to the periodic agent jobs.
 *
 * The GitHub GraphQL `search` API is used with a per-repo `author:` filter so
 * we count every PR the bot has ever opened (all states). Each PR's leading
 * Jira key is extracted from its title (OpenShift convention: "KEY-123: ...",
 * "Bug KEY-123: ...", "[release-x.y] KEY-123: ...") so the caller can
 * de-duplicate PRs against the Jira `issue-for-agent` set.
 *
 * Requires a GITHUB_TOKEN (classic PAT). This is a lightweight fetch (a handful
 * of repos, cursor-paginated), consistent with the app's display-layer role.
 */

const fetch = require('node-fetch');

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_REST_URL = 'https://api.github.com';
const BOT_LOGIN = 'redhat-chai-bot';
const HYDRATE_CONCURRENCY = 10;

// Repo -> team key. Team keys match the client's TEAMS list in AgentContent.vue.
// This map doubles as the fetch list and the team-attribution filter.
const REPO_TEAMS = [
  { repo: 'openshift/machine-config-operator', team: 'mco' },
  { repo: 'openshift/cluster-ingress-operator', team: 'ingress' },
  { repo: 'openshift/windows-machine-config-operator', team: 'wmco' },
  { repo: 'openshift/installer', team: 'installer' },
  { repo: 'openshift/hypershift', team: 'hypershift' },
  { repo: 'openshift/sippy', team: 'trt' },
  { repo: 'openshift/origin', team: 'trt' }
];

// Leading Jira key in a PR title. Excludes CVE- (not a Jira project).
const JIRA_KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

/**
 * Extract the first Jira-style key from a PR title, ignoring CVE identifiers.
 * @param {string} title
 * @returns {string|null}
 */
function extractJiraKey(title) {
  if (!title) return null;
  const matches = title.match(JIRA_KEY_RE) || [];
  for (const m of matches) {
    if (m.startsWith('CVE-')) continue;
    return m;
  }
  return null;
}

async function graphqlRequest(query, variables, token) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'jira-solve-agent'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors.map(e => e.message).join('; ')}`);
  }
  return json.data;
}

const SEARCH_QUERY = `
  query($q: String!, $cursor: String) {
    search(query: $q, type: ISSUE, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          number
          title
          url
          state
          createdAt
        }
      }
    }
  }
`;

/**
 * Fetch every PR opened by the bot in a single repo (all states, all pages).
 * @param {string} repo - "owner/name"
 * @param {string} token
 * @returns {Promise<Array<{number:number,title:string,url:string,state:string,createdAt:string}>>}
 */
async function fetchRepoPrs(repo, token) {
  const q = `repo:${repo} type:pr author:${BOT_LOGIN}`;
  const prs = [];
  let cursor = null;

  // Safety bound: GitHub search caps at 1000 results; 10 pages of 100 covers it.
  for (let page = 0; page < 10; page++) {
    const data = await graphqlRequest(SEARCH_QUERY, { q, cursor }, token);
    const search = data && data.search;
    if (!search) break;

    for (const node of search.nodes || []) {
      if (!node || typeof node.number !== 'number') continue; // skip non-PR nodes
      prs.push({
        number: node.number,
        title: node.title,
        url: node.url,
        state: node.state,
        createdAt: node.createdAt
      });
    }

    if (!search.pageInfo || !search.pageInfo.hasNextPage) break;
    cursor = search.pageInfo.endCursor;
  }

  return prs;
}

/**
 * Fetch all bot PRs across the wired-up repos.
 * @param {object} [options]
 * @param {string} options.token - GitHub API token
 * @returns {Promise<Array<{repo:string,team:string,number:number,title:string,url:string,state:string,createdAt:string,jiraKey:string|null}>>}
 */
async function fetchAgentPrs(options = {}) {
  const token = options.token;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const all = [];
  for (const { repo, team } of REPO_TEAMS) {
    try {
      const prs = await fetchRepoPrs(repo, token);
      for (const pr of prs) {
        all.push({
          repo,
          team,
          number: pr.number,
          title: pr.title,
          url: pr.url,
          state: pr.state,
          createdAt: pr.createdAt,
          jiraKey: extractJiraKey(pr.title)
        });
      }
    } catch (err) {
      console.warn(`[jira-solve-agent] Failed to fetch PRs for ${repo}: ${err.message}`);
    }
  }

  return all;
}

const AGENT_REPOS = REPO_TEAMS.map(rt => rt.repo);

// Map a repo name back to its team key, so a linked PR can be team-attributed.
const REPO_TEAM_BY_NAME = REPO_TEAMS.reduce((acc, rt) => {
  acc[rt.repo] = rt.team;
  return acc;
}, {});

/**
 * Map a GitHub REST pull object to OPEN | MERGED | CLOSED.
 * @param {{ merged?: boolean, state?: string }} data
 * @returns {string}
 */
function prStateFromRestPull(data) {
  if (data && data.merged) return 'MERGED';
  if (data && data.state === 'open') return 'OPEN';
  return 'CLOSED';
}

/**
 * Fetch live PR state from GitHub REST (merged flag distinguishes MERGED vs CLOSED).
 *
 * @param {string} repo - "owner/name"
 * @param {number} number
 * @param {string} token
 * @param {Function} [fetchImpl]
 * @returns {Promise<string>}
 */
async function hydratePullRequestState(repo, number, token, fetchImpl = fetch) {
  const parts = repo.split('/');
  if (parts.length !== 2) {
    throw new Error(`invalid repo: ${repo}`);
  }
  const [owner, name] = parts;
  const response = await fetchImpl(
    `${GITHUB_REST_URL}/repos/${owner}/${name}/pulls/${number}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'jira-solve-agent'
      }
    }
  );
  if (!response.ok) {
    throw new Error(`GitHub PR API error: ${response.status} ${response.statusText}`);
  }
  return prStateFromRestPull(await response.json());
}

/**
 * Hydrate PR state on linked PR objects discovered via Jira remote links.
 * Jira remotelinks often omit merge status, so we resolve state from GitHub.
 *
 * @param {Map<string, Array<{repo:string,number:number,url:string,state:string}>>} linkedByKey
 * @param {object} options
 * @param {string} options.token - GitHub API token
 * @param {Function} [options.fetchImpl]
 */
async function hydrateLinkedPrStates(linkedByKey, options = {}) {
  const token = options.token;
  if (!token || !linkedByKey || linkedByKey.size === 0) return;

  const fetchImpl = options.fetchImpl || fetch;
  const unique = new Map();
  for (const prs of linkedByKey.values()) {
    for (const pr of prs) {
      if (pr && pr.url) unique.set(pr.url, pr);
    }
  }

  const list = [...unique.values()];
  for (let i = 0; i < list.length; i += HYDRATE_CONCURRENCY) {
    const batch = list.slice(i, i + HYDRATE_CONCURRENCY);
    await Promise.all(batch.map(async (pr) => {
      try {
        pr.state = await hydratePullRequestState(pr.repo, pr.number, token, fetchImpl);
      } catch (err) {
        console.warn(
          `[jira-solve-agent] Failed to hydrate PR state for ${pr.repo}#${pr.number}: ${err.message}`
        );
      }
    }));
  }
}

module.exports = {
  fetchAgentPrs,
  fetchRepoPrs,
  hydrateLinkedPrStates,
  hydratePullRequestState,
  prStateFromRestPull,
  extractJiraKey,
  REPO_TEAMS,
  AGENT_REPOS,
  REPO_TEAM_BY_NAME,
  BOT_LOGIN
};
