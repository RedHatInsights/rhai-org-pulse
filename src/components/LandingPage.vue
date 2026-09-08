<template>
  <div>
    <div class="mb-8 rounded-2xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-primary-950/40 dark:via-gray-900 dark:to-blue-950/30 p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">What is Org Pulse?</p>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 max-w-3xl">
        Hybrid Platforms' agentic evolution
      </h1>
      <p class="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
        Org Pulse brings delivery signals, engineering data, and agentic initiatives together to tell the story of how Hybrid Platforms is evolving.
      </p>
    </div>

    <!-- Strategic initiatives -->
    <section class="mb-8" aria-labelledby="strategic-initiatives-heading">
      <p id="strategic-initiatives-heading" class="px-1 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        Strategic Initiatives
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <component
          :is="initiative.href ? 'a' : initiative.target ? 'button' : 'div'"
          v-for="initiative in strategicInitiatives"
          :key="initiative.title"
          class="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-left"
          :class="initiative.target || initiative.href ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900' : ''"
          :href="initiative.href"
          :target="initiative.href ? '_blank' : undefined"
          :rel="initiative.href ? 'noopener noreferrer' : undefined"
          @click="initiative.target && $emit('navigate', initiative.target)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="rounded-lg bg-primary-50 dark:bg-primary-900/30 p-2 text-primary-600 dark:text-primary-400">
              <component :is="initiative.icon" :size="20" />
            </div>
            <span
              v-if="initiative.status"
              class="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >{{ initiative.status }}</span>
          </div>
          <h2 class="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{{ initiative.title }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{{ initiative.description }}</p>
        </component>
      </div>
    </section>

    <!-- External Modules (git-static) -->
    <div v-if="externalModules.length > 0">
      <p class="px-1 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        External Modules
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="mod in externalModules"
          :key="mod.slug"
          @click="$emit('navigate', `modules/${mod.slug}`)"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
              <component :is="getIcon(mod.icon)" :size="20" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ mod.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ mod.description }}</p>
              <span class="inline-block mt-2 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-full">
                External
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  BarChart3,
  Search,
  Box,
  Activity,
  GitBranch,
  Globe,
  FileText,
  PieChart,
  UsersRound,
  Zap,
  Layout,
  Network,
  ChartCandlestick,
  Sparkles,
  Hospital,
  Bot,
  GitMerge,
  ListChecks,
  Cloud
} from 'lucide-vue-next'

const props = defineProps({
  modules: { type: Array, default: () => [] },
  builtInManifests: { type: Array, default: () => [] },
  isAdmin: Boolean
})

defineEmits(['navigate'])

const strategicInitiatives = [
  {
    title: 'Agentic Team, Engineer & Repo Structure',
    description: 'Connect teams, engineers, and repositories to make ownership and agentic readiness visible.',
    icon: UsersRound,
    target: 'team-tracker::home'
  },
  {
    title: 'Repo-level Agent Readiness',
    description: 'Explore AI enablement and agent readiness across Hybrid Platforms repositories.',
    icon: GitBranch,
    href: 'https://fleet-insights.apps.engineering.openshift.org/hybrid-platforms/ocp/ai-enablement',
    status: 'External'
  },
  {
    title: 'Agentic Bug Fixes',
    description: 'Track agent-assisted bug candidates, attempts, acceptances, and the pull requests that land.',
    icon: Bot,
    target: 'jira-solve-agent'
  },
  {
    title: 'Refinement Assistance',
    description: 'ValorFlow assists backlog refinement and helps work become implementation-ready.',
    icon: ListChecks,
    href: 'https://valorflow.apps.int.spoke.preprod.us-west-2.aws.paas.redhat.com/',
    status: 'External'
  },
  {
    title: 'Agentic Backports',
    description: 'Bring agentic assistance to identifying, preparing, and validating release backports.',
    icon: GitMerge,
    status: 'TBD'
  },
  {
    title: 'HyperShell',
    description: 'Support long-lived cloud agents secured by OpenShell.',
    icon: Cloud,
    href: 'https://hypershell.apps.rosa.hcmais01ue1.s9m2.p3.openshiftapps.com/',
    status: 'External'
  }
]

const externalModules = computed(() =>
  props.modules.filter(m => m.type === 'git-static').sort((a, b) => (a.order || 0) - (b.order || 0))
)

const iconMap = {
  'bar-chart': BarChart3,
  'search': Search,
  'activity': Activity,
  'git-branch': GitBranch,
  'globe': Globe,
  'file-text': FileText,
  'pie-chart': PieChart,
  'users-round': UsersRound,
  'zap': Zap,
  'layout': Layout,
  'box': Box,
  'network': Network,
  'chart-candlestick': ChartCandlestick,
  'sparkles': Sparkles,
  'hospital': Hospital
}

function getIcon(iconName) {
  return iconMap[iconName] || Box
}
</script>
