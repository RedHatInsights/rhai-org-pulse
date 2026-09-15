import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSidebar from '../components/AppSidebar.vue'

describe('AppSidebar external agentic tools', () => {
  function mountSidebar(collapsed = false, extraProps = {}) {
    return mount(AppSidebar, {
      props: {
        collapsed,
        activeModule: 'home',
        modules: [],
        builtInManifests: [],
        ...extraProps
      }
    })
  }

  it('links external agentic tools in a new tab', () => {
    const wrapper = mountSidebar()
    const readiness = wrapper.find('a[href="https://fleet-insights.apps.engineering.openshift.org/hybrid-platforms/ocp/ai-enablement"]')
    const valorFlow = wrapper.find('a[href="https://valorflow.apps.int.spoke.preprod.us-west-2.aws.paas.redhat.com/"]')
    const hyperShell = wrapper.find('a[href="https://hypershell.apps.rosa.hcmais01ue1.s9m2.p3.openshiftapps.com/"]')

    expect(readiness.text()).toContain('Agentic Repo Readiness')
    expect(valorFlow.text()).toContain('ValorFlow Refinement')
    expect(hyperShell.text()).toContain('HyperShell')
    expect(readiness.attributes('target')).toBe('_blank')
    expect(valorFlow.attributes('target')).toBe('_blank')
    expect(hyperShell.attributes('target')).toBe('_blank')
    expect(readiness.attributes('rel')).toBe('noopener noreferrer')
    expect(valorFlow.attributes('rel')).toBe('noopener noreferrer')
    expect(hyperShell.attributes('rel')).toBe('noopener noreferrer')
  })

  it('keeps all external links available when collapsed', () => {
    const wrapper = mountSidebar(true)

    expect(wrapper.findAll('a[target="_blank"]')).toHaveLength(3)
  })

  it('shows Agentic CVE as a top-level navigation item', async () => {
    const wrapper = mountSidebar(false, {
      activeModule: 'jira-solve-agent',
      activeViewId: 'cve',
      builtInManifests: [{
        name: 'Agentic Bugfixes',
        slug: 'jira-solve-agent',
        icon: 'bot',
        client: {
          flatNavigation: true,
          promotedNavItems: [{ id: 'cve', label: 'Agentic CVE', icon: 'Shield' }],
          navItems: [{ id: 'main', label: 'Agentic Bugfixes', icon: 'Bot', default: true }]
        }
      }]
    })

    const item = wrapper.find('button[aria-label="Agentic CVE"]')
    expect(item.exists()).toBe(true)
    expect(item.attributes('aria-current')).toBe('page')
    expect(wrapper.text().match(/Agentic CVE/g)).toHaveLength(1)

    await item.trigger('click')
    expect(wrapper.emitted('navigate')).toContainEqual(['jira-solve-agent::cve'])
  })

  it('shows Agentic Bugfixes as a top-level item without nested children', async () => {
    const wrapper = mountSidebar(false, {
      activeModule: 'jira-solve-agent',
      activeViewId: 'main',
      builtInManifests: [{
        name: 'Agentic Bugfixes',
        slug: 'jira-solve-agent',
        icon: 'bot',
        client: {
          flatNavigation: true,
          promotedNavItems: [{ id: 'cve', label: 'Agentic CVE', icon: 'Shield' }],
          navItems: [{ id: 'main', label: 'Agentic Bugfixes', icon: 'Bot', default: true }]
        }
      }]
    })

    const item = wrapper.find('button[aria-label="Agentic Bugfixes"]')
    expect(item.exists()).toBe(true)
    expect(item.attributes('aria-current')).toBe('page')
    expect(item.find('svg').exists()).toBe(true)
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)

    await item.trigger('click')
    expect(wrapper.emitted('navigate')).toContainEqual(['jira-solve-agent::main'])
  })

  it('places Agentic CVE immediately after Agentic Bugfixes', () => {
    const wrapper = mountSidebar(false, {
      builtInManifests: [{
        name: 'Agentic Bugfixes',
        slug: 'jira-solve-agent',
        icon: 'bot',
        client: {
          flatNavigation: true,
          promotedNavItems: [{ id: 'cve', label: 'Agentic CVE', icon: 'Shield' }],
          navItems: [{ id: 'main', label: 'Agentic Bugfixes', icon: 'Bot', default: true }]
        }
      }]
    })

    const labels = wrapper.findAll('nav [aria-label]').map(item => item.attributes('aria-label'))
    const bugfixesIndex = labels.indexOf('Agentic Bugfixes')
    expect(labels[bugfixesIndex + 1]).toBe('Agentic CVE')
  })

  it('does not show Jira AutoFix under AI Impact', () => {
    const wrapper = mountSidebar(false, {
      builtInManifests: [{
        name: 'AI Impact',
        slug: 'ai-impact',
        icon: 'sparkles',
        client: { navItems: [{ id: 'main', label: 'Overview', default: true }] }
      }]
    })

    expect(wrapper.text()).not.toContain('Jira AutoFix')
  })

  it('shows Agentic RFE Review at the top level instead of under AI Impact', async () => {
    const wrapper = mountSidebar(false, {
      activeModule: 'ai-impact',
      activeViewId: 'rfe-review',
      builtInManifests: [{
        name: 'AI Impact',
        slug: 'ai-impact',
        icon: 'sparkles',
        client: {
          hideFromSidebar: true,
          promotedNavItems: [{ id: 'rfe-review', label: 'Agentic RFE Review', icon: 'ClipboardList' }],
          navItems: [{ id: 'ai-factory-guide', label: 'AI Factory Guide', default: true }]
        }
      }]
    })

    const item = wrapper.find('button[aria-label="Agentic RFE Review"]')
    expect(item.exists()).toBe(true)
    expect(item.attributes('aria-current')).toBe('page')
    expect(wrapper.text().match(/Agentic RFE Review/g)).toHaveLength(1)
    expect(wrapper.text()).not.toContain('AI Impact')

    await item.trigger('click')
    expect(wrapper.emitted('navigate')).toContainEqual(['ai-impact::rfe-review'])
  })

  it('hides enabled modules marked hideFromSidebar', () => {
    const wrapper = mountSidebar(false, {
      builtInManifests: ['Releases', 'Upstream Pulse', 'System Health', 'Product Builds'].map((name, index) => ({
        name,
        slug: `hidden-${index}`,
        icon: 'BarChart3',
        client: {
          hideFromSidebar: true,
          navItems: [{ id: 'main', label: `${name} Dashboard`, default: true }]
        }
      }))
    })

    expect(wrapper.text()).not.toContain('Releases')
    expect(wrapper.text()).not.toContain('Upstream Pulse')
    expect(wrapper.text()).not.toContain('System Health')
    expect(wrapper.text()).not.toContain('Product Builds')
  })
})
