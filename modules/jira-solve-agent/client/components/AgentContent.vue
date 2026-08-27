<template>
  <div>
    <LoadingOverlay v-if="loading && !agentData" message="Loading agent data..." />

    <div v-else-if="error" class="p-8 text-center">
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700" @click="$emit('retry')">
        Retry
      </button>
    </div>

    <div v-else-if="!agentData || !agentData.issues || agentData.issues.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
      <p class="text-lg font-medium mb-2">No data available</p>
      <p class="text-sm">Trigger a refresh to fetch issues from Jira.</p>
    </div>

    <template v-else>
      <!-- Team selector with inline stats -->
      <div class="px-6 pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="team in teamOptions"
          :key="team.key"
          :class="[
            'px-4 py-4 rounded-lg border transition-colors text-left',
            selectedTeam === team.key
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="selectedTeam = team.key"
        >
          <div class="text-sm font-semibold mb-2">{{ team.label }}</div>
          <div class="flex items-center gap-3">
            <div class="text-center">
              <div :class="['text-xl font-bold', selectedTeam === team.key ? 'text-white' : 'text-gray-900 dark:text-gray-100']">{{ teamStats(team.key).total }}</div>
              <div :class="['text-[10px] uppercase tracking-wider', selectedTeam === team.key ? 'text-white/60' : 'text-gray-400 dark:text-gray-500']">total</div>
            </div>
            <div :class="['w-px h-8', selectedTeam === team.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700']"></div>
            <div class="text-center">
              <div :class="['text-xl font-bold', selectedTeam === team.key ? 'text-white' : 'text-amber-600 dark:text-amber-400']">{{ teamStats(team.key).inProgress }}</div>
              <div :class="['text-[10px] uppercase tracking-wider', selectedTeam === team.key ? 'text-white/60' : 'text-gray-400 dark:text-gray-500']">wip</div>
            </div>
            <div :class="['w-px h-8', selectedTeam === team.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700']"></div>
            <div class="text-center">
              <div :class="['text-xl font-bold', selectedTeam === team.key ? 'text-white' : 'text-purple-600 dark:text-purple-400']">{{ teamStats(team.key).merged }}</div>
              <div :class="['text-[10px] uppercase tracking-wider', selectedTeam === team.key ? 'text-white/60' : 'text-gray-400 dark:text-gray-500']">merged</div>
            </div>
          </div>
        </button>
      </div>

      <!-- Stat cards -->
      <div class="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ displayMetrics.totalIssues }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Total Issues</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ displayMetrics.byState.new || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">New</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ displayMetrics.byState['ready-to-solve'] || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Ready to Solve</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ displayMetrics.byState['in-progress'] || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">In Progress</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ displayMetrics.byState.closed || 0 }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Closed</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ displayMetrics.processedRate }}%</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Processed</div>
          <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{{ displayMetrics.processedCount }}/{{ displayMetrics.totalIssues }}</div>
        </div>
      </div>

      <!-- Issue table -->
      <div class="px-6 pb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Table header bar -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Issues
              <span class="text-gray-400 dark:text-gray-500 font-normal ml-1">({{ filteredIssues.length }})</span>
            </h3>
            <div class="flex items-center gap-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search issues..."
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-48"
              />
              <select
                v-model="stateFilter"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All States</option>
                <option value="new">New</option>
                <option value="ready-to-solve">Ready to Solve</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="other">Other</option>
              </select>
              <select
                v-model="processedFilter"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="processed">Processed</option>
                <option value="unprocessed">Not Processed</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Key</th>
                  <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Summary</th>
                  <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">PR Status</th>
                  <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">PR</th>
                  <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Jira Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredIssues.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No issues match your filters.
                  </td>
                </tr>
                <tr
                  v-for="issue in filteredIssues"
                  :key="issue.key + (issue.prUrl || '')"
                  class="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td class="px-4 py-2">
                    <a
                      v-if="issue.key !== 'NO-JIRA'"
                      :href="`${jiraHost}/browse/${issue.key}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {{ issue.key }}
                    </a>
                    <span v-else class="text-gray-400 dark:text-gray-500 font-medium">{{ issue.key }}</span>
                  </td>
                  <td class="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-md truncate">
                    {{ issue.summary }}
                  </td>
                  <td class="px-4 py-2">
                    <a
                      v-if="prLink(issue)"
                      :href="prLink(issue)"
                      target="_blank"
                      rel="noopener noreferrer"
                      :class="prStatusClasses(prStatus(issue))"
                      class="hover:underline"
                    >
                      {{ prStatusLabel(prStatus(issue)) }}
                    </a>
                    <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                  </td>
                  <td class="px-4 py-2 align-top">
                    <template v-if="prList(issue).length">
                      <div v-for="pr in prList(issue)" :key="pr.url" class="whitespace-nowrap">
                        <a
                          :href="pr.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          :class="prStateTextClasses(pr.state)"
                          class="hover:underline"
                        >
                          {{ pr.label }}
                        </a>
                      </div>
                    </template>
                    <span v-else class="text-gray-400 dark:text-gray-500">—</span>
                  </td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {{ issue.status || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Fetched-at footer -->
          <div v-if="agentData.fetchedAt" class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            Last updated: {{ formatDate(agentData.fetchedAt) }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import LoadingOverlay from '@shared/client/components/LoadingOverlay.vue';

const props = defineProps({
  agentData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
});

defineEmits(['retry']);

const TEAMS = [
  { key: 'hypershift', label: 'HyperShift', components: ['HyperShift', 'Hosted Control Planes'] },
  { key: 'installer', label: 'Installer', components: ['Installer / openshift-installer'] },
  { key: 'trt', label: 'TRT', projectPrefix: 'TRT' },
  { key: 'wmco', label: 'Windows Containers', components: ['Windows Containers'], projectPrefixes: ['WINC'] },
  { key: 'mco', label: 'MCO', components: ['Machine Config Operator'], projectPrefixes: ['MCO'] },
  { key: 'ingress', label: 'Ingress Operator', components: ['Networking / router'], projectPrefixes: ['NE'] },
  { key: 'edge-ecosystem', label: 'Edge & Ecosystem', components: [] },
];

const selectedTeam = ref('all');
const searchQuery = ref('');
const stateFilter = ref('all');
const processedFilter = ref('all');

const teamOptions = computed(() => [
  { key: 'all', label: 'All Teams', components: [] },
  ...TEAMS
]);

const jiraHost = computed(() => props.agentData?.jiraHost || 'https://redhat.atlassian.net');

function issueMatchesTeam(issue, team) {
  // Rows sourced from a chai-bot PR carry an authoritative team (derived from
  // the PR's repo). Trust it directly — their Jira key prefix/component often
  // won't map to the repo's team (e.g. an OCPBUGS-* PR in the ingress repo).
  if (issue.team) {
    return issue.team === team.key;
  }
  const prefixes = team.projectPrefixes || (team.projectPrefix ? [team.projectPrefix] : []);
  if (prefixes.some(prefix => issue.key.startsWith(prefix + '-'))) {
    return true;
  }
  if (team.components?.length && issue.components.some(c => team.components.includes(c))) {
    return true;
  }
  return false;
}

function filterByTeam(issues, teamKey) {
  if (teamKey === 'all') return issues;
  const team = TEAMS.find(t => t.key === teamKey);
  if (!team) return issues;
  return issues.filter(i => issueMatchesTeam(i, team));
}

const teamFilteredIssues = computed(() => {
  if (!props.agentData?.issues) return [];
  return filterByTeam(props.agentData.issues, selectedTeam.value);
});

function teamStats(teamKey) {
  if (!props.agentData?.issues) return { total: 0, inProgress: 0, merged: 0 };
  const issues = filterByTeam(props.agentData.issues, teamKey);
  let inProgress = 0;
  let merged = 0;
  for (const i of issues) {
    if (i.agentState === 'in-progress') inProgress++;
    // "merged" reflects the PR outcome (a real GitHub merge), independent of the
    // Jira status: any row whose rolled-up PR state is MERGED.
    if (prStatus(i) === 'MERGED') merged++;
  }
  return { total: issues.length, inProgress, merged };
}

function recomputeMetrics(issues) {
  const byState = { new: 0, 'ready-to-solve': 0, 'in-progress': 0, closed: 0, other: 0 };
  let processedCount = 0;
  for (const issue of issues) {
    byState[issue.agentState] = (byState[issue.agentState] || 0) + 1;
    if (issue.processed) processedCount++;
  }
  const totalIssues = issues.length;
  const processedRate = totalIssues > 0 ? Math.round((processedCount / totalIssues) * 100) : 0;
  return { totalIssues, byState, processedCount, processedRate };
}

const displayMetrics = computed(() => {
  if (selectedTeam.value === 'all') {
    return props.agentData?.metrics || { totalIssues: 0, byState: {}, processedCount: 0, processedRate: 0 };
  }
  return recomputeMetrics(teamFilteredIssues.value);
});

const filteredIssues = computed(() => {
  let issues = teamFilteredIssues.value;

  if (stateFilter.value !== 'all') {
    issues = issues.filter(i => i.agentState === stateFilter.value);
  }

  if (processedFilter.value === 'processed') {
    issues = issues.filter(i => i.processed);
  } else if (processedFilter.value === 'unprocessed') {
    issues = issues.filter(i => !i.processed);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    issues = issues.filter(i =>
      i.key.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      (i.assignee && i.assignee.toLowerCase().includes(q)) ||
      i.components.some(c => c.toLowerCase().includes(q))
    );
  }

  return issues;
});

// PR status shown in the table. A chai-bot row carries its PR's state directly
// (prState); a Jira issue row derives a single state from its linkedPrs
// (any open → OPEN, else any merged → MERGED, else CLOSED); a plain issue has
// no PR and returns null.
function prStatus(issue) {
  if (issue.prState) return issue.prState.toUpperCase();
  const linked = issue.linkedPrs;
  if (Array.isArray(linked) && linked.length) {
    const states = linked.map(p => (p.state || '').toUpperCase());
    if (states.includes('OPEN')) return 'OPEN';
    if (states.includes('MERGED')) return 'MERGED';
    return 'CLOSED';
  }
  return null;
}

// The PR to link the status badge to: the bot PR for chai-bot rows, otherwise
// the first linked PR for Jira issue rows.
function prLink(issue) {
  if (issue.prUrl) return issue.prUrl;
  const linked = issue.linkedPrs;
  if (Array.isArray(linked) && linked.length && linked[0].url) return linked[0].url;
  return null;
}

// Compact label for a single PR link: "repo#number" parsed from the PR URL
// (e.g. cluster-ingress-operator#1483), falling back to "PR ↗" when the URL
// doesn't match the expected GitHub shape.
const PR_URL_RE = /github\.com\/[^/]+\/([^/]+)\/pull\/(\d+)/;

function prLabelForUrl(url) {
  if (!url) return '';
  const m = url.match(PR_URL_RE);
  if (m) return `${m[1]}#${m[2]}`;
  return 'PR ↗';
}

// Every PR to show in the PR column for a row: the single bot PR for chai-bot
// rows, otherwise all linkedPrs for a Jira issue row. Each entry is
// { url, state, label } ready to render.
function prList(issue) {
  if (issue.prUrl) {
    return [{ url: issue.prUrl, state: (issue.prState || '').toUpperCase(), label: prLabelForUrl(issue.prUrl) }];
  }
  const linked = issue.linkedPrs;
  if (Array.isArray(linked) && linked.length) {
    return linked
      .filter(p => p && p.url)
      .map(p => ({ url: p.url, state: (p.state || '').toUpperCase(), label: prLabelForUrl(p.url) }));
  }
  return [];
}

const PR_STATUS_LABELS = { OPEN: 'Open', MERGED: 'Merged', CLOSED: 'Closed' };

function prStatusLabel(state) {
  if (!state) return '—';
  return PR_STATUS_LABELS[state] || state;
}

const PR_STATUS_CLASSES = {
  OPEN: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MERGED: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  CLOSED: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
};

function prStatusClasses(state) {
  return PR_STATUS_CLASSES[state] || PR_STATUS_CLASSES.CLOSED;
}

// Per-PR link color in the PR column, so each PR's state is legible at a glance
// without a full badge per line (rows can carry many PRs).
const PR_STATE_TEXT_CLASSES = {
  OPEN: 'text-green-700 dark:text-green-400',
  MERGED: 'text-purple-700 dark:text-purple-400',
  CLOSED: 'text-gray-500 dark:text-gray-400'
};

function prStateTextClasses(state) {
  return PR_STATE_TEXT_CLASSES[state] || 'text-primary-600 dark:text-primary-400';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
