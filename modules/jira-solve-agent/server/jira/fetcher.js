const { fetchAllJqlResults } = require('../../../../shared/server/jira');

const PROJECTS = ['OCPBUGS', 'CNTRLPLANE', 'TRT'];
const AGENT_LABEL = 'issue-for-agent';
const PROCESSED_LABEL = 'agent-processed';
const READY_TO_SOLVE_LABEL = 'ready-to-solve';

const FIELDS = 'summary,status,issuetype,priority,created,updated,labels,components,assignee';

function classifyIssue(statusCategory, labels) {
  const category = (statusCategory || '').toLowerCase();
  const labelSet = new Set(labels);

  if (category === 'done') {
    return 'closed';
  }
  if (category === 'in progress') {
    return 'in-progress';
  }
  if (category === 'to do' || category === 'new') {
    if (labelSet.has(READY_TO_SOLVE_LABEL)) return 'ready-to-solve';
    return 'new';
  }
  return 'other';
}

function processIssue(issue) {
  const labels = issue.fields.labels || [];
  const statusName = issue.fields.status?.name || 'Unknown';
  const statusCategory = issue.fields.status?.statusCategory?.name || '';
  const components = (issue.fields.components || []).map(c => c.name);

  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: statusName,
    issueType: issue.fields.issuetype?.name || 'Unknown',
    priority: issue.fields.priority?.name || 'None',
    created: issue.fields.created,
    updated: issue.fields.updated,
    labels,
    components,
    assignee: issue.fields.assignee?.displayName || null,
    agentState: classifyIssue(statusCategory, labels),
    processed: labels.includes(PROCESSED_LABEL)
  };
}

function computeMetrics(issues) {
  const byState = { new: 0, 'ready-to-solve': 0, 'in-progress': 0, closed: 0, other: 0 };
  let processedCount = 0;

  for (const issue of issues) {
    byState[issue.agentState] = (byState[issue.agentState] || 0) + 1;
    if (issue.processed) processedCount++;
  }

  const totalIssues = issues.length;
  const processedRate = totalIssues > 0
    ? Math.round((processedCount / totalIssues) * 100)
    : 0;

  return {
    totalIssues,
    byState,
    processedCount,
    processedRate
  };
}

async function fetchAgentData(jiraRequest) {
  const projectClause = PROJECTS.map(p => `"${p}"`).join(', ');
  const jql = `project IN (${projectClause}) AND labels = "${AGENT_LABEL}" ORDER BY created DESC`;

  const rawIssues = await fetchAllJqlResults(jiraRequest, jql, FIELDS);
  return rawIssues.map(processIssue);
}

module.exports = {
  fetchAgentData,
  processIssue,
  classifyIssue,
  computeMetrics,
  PROJECTS,
  AGENT_LABEL,
  PROCESSED_LABEL,
  READY_TO_SOLVE_LABEL
};
