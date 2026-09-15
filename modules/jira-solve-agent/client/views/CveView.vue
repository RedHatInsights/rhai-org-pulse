<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">ARC analysis</p>
        <h2 class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Agentic CVE</h2>
        <p class="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Track automated analysis and remediation of OCPBUGS Vulnerabilities. This dashboard is currently based on the ARC tool from OpenShift Sustaining; find out more in #forum-arc. Every KPI opens its source Jira query for verification.
        </p>
      </div>
      <button
        v-if="isAdmin"
        type="button"
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="refreshing"
        @click="refresh"
      >
        {{ refreshing ? 'Refreshing…' : 'Refresh Jira data' }}
      </button>
    </div>

    <LoadingOverlay v-if="loading && !data" message="Loading Agentic CVE data..." />
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
      {{ error }}
    </div>
    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <a
          v-for="kpi in kpis"
          :key="kpi.key"
          :href="jiraSearchUrl(kpi.jqlKey || kpi.key)"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-primary-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
        >
          <div class="flex items-center justify-between gap-3">
            <component :is="kpi.icon" :size="20" :class="kpi.color" />
            <ExternalLink :size="14" class="text-gray-400" />
          </div>
          <div class="mt-5 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ metricValue(kpi) }}</div>
          <div class="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ kpi.label }}</div>
          <div class="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ kpi.description }}</div>
          <div v-if="kpi.key === 'mergeRate'" class="mt-1 text-xs text-gray-400">{{ metric('mergedPrs') }}/{{ metric('agenticPrs') }}</div>
        </a>
      </div>

      <div class="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Recently updated vulnerabilities</h3>
          <span class="text-xs text-gray-400">{{ issues.length }} most recent shown</span>
        </div>
        <div v-if="issues.length === 0" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No cached CVE data is available. An administrator can refresh it from Jira.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th class="px-5 py-3">Issue</th>
                <th class="px-5 py-3">Summary</th>
                <th class="px-5 py-3">ARC signals</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3">Resolution</th>
                <th class="px-5 py-3">VEX justification</th>
                <th class="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="issue in issues" :key="issue.key" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="whitespace-nowrap px-5 py-3">
                  <a :href="`${data.jiraHost}/browse/${issue.key}`" target="_blank" rel="noopener noreferrer" class="font-medium text-primary-600 hover:underline dark:text-primary-400">{{ issue.key }}</a>
                </td>
                <td class="max-w-lg px-5 py-3 text-gray-700 dark:text-gray-300">{{ issue.summary }}</td>
                <td class="px-5 py-3">
                  <div class="flex min-w-56 flex-wrap gap-1">
                    <span v-for="label in arcLabels(issue)" :key="label" class="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{{ label }}</span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-gray-600 dark:text-gray-300">{{ issue.status }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-gray-600 dark:text-gray-300">{{ resolutionFor(issue) }}</td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-300">{{ issue.vexJustification || '—' }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-gray-500 dark:text-gray-400">{{ formatDate(issue.updated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="data?.fetchedAt" class="border-t border-gray-200 px-5 py-3 text-xs text-gray-400 dark:border-gray-700">
          Last refreshed {{ formatDate(data.fetchedAt) }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CheckCircle2, ExternalLink, GitPullRequest, SearchX, Tags } from 'lucide-vue-next';
import LoadingOverlay from '@shared/client/components/LoadingOverlay.vue';
import { useAuth } from '@shared/client/composables/useAuth.js';
import { useCveData } from '../composables/useCveData.js';

const { isAdmin } = useAuth();
const { data, loading, refreshing, error, refresh } = useCveData();

const kpis = [
  { key: 'analyzed', label: 'Issues analyzed', description: 'Vulnerabilities labeled arc:complete.', icon: CheckCircle2, color: 'text-emerald-500' },
  { key: 'agenticPrs', label: 'Agentic PRs', description: 'Vulnerabilities labeled arc:automated-pr.', icon: GitPullRequest, color: 'text-blue-500' },
  { key: 'mergeRate', jqlKey: 'mergedPrs', label: 'Merge rate', description: 'Automated PR issues closed with resolution Done.', icon: GitPullRequest, color: 'text-teal-500' },
  { key: 'metadataIssues', label: 'Metadata issues', description: 'Repository mappings that ARC could not resolve.', icon: Tags, color: 'text-amber-500' },
  { key: 'falsePositivesAddressed', label: 'False positives addressed', description: 'Unique arc:negative or arc:not-shipped vulnerabilities.', icon: SearchX, color: 'text-purple-500' }
];

const issues = computed(() => data.value?.issues || []);
function metric(key) { return data.value?.metrics?.[key] || 0; }
function metricValue(kpi) { return kpi.key === 'mergeRate' ? `${metric(kpi.key)}%` : metric(kpi.key); }
function jiraSearchUrl(key) { return `${data.value?.jiraHost || 'https://redhat.atlassian.net'}/issues/?jql=${encodeURIComponent(data.value?.jql?.[key] || '')}`; }
function arcLabels(issue) { return (issue.labels || []).filter(label => label.startsWith('arc:')); }
function resolutionFor(issue) { return issue.status?.toLowerCase() === 'closed' ? (issue.resolution || '—') : '—'; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString() : '—'; }
</script>
