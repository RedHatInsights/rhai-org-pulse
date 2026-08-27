import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AgentContent from '../../client/components/AgentContent.vue'

describe('AgentContent', () => {
  const sampleData = {
    fetchedAt: '2026-07-07T10:00:00Z',
    jiraHost: 'https://redhat.atlassian.net',
    metrics: {
      totalIssues: 10,
      byState: { new: 2, 'ready-to-solve': 0, 'in-progress': 1, closed: 1 },
      processedCount: 1,
      processedRate: 10
    },
    issues: [
      { key: 'OCPBUGS-1', summary: 'HyperShift bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-01', updated: '2026-07-07', labels: [], components: ['HyperShift'], assignee: null, linkedPrs: [{ repo: 'openshift/hypershift', team: 'hypershift', number: 9137, url: 'https://github.com/openshift/hypershift/pull/9137', state: 'OPEN', author: 'x' }, { repo: 'openshift/origin', team: 'trt', number: 31382, url: 'https://github.com/openshift/origin/pull/31382', state: 'CLOSED', author: 'y' }] },
      { key: 'CNTRLPLANE-10', summary: 'Installer issue', status: 'In Progress', agentState: 'in-progress', processed: true, issueType: 'Bug', priority: 'Critical', created: '2026-07-02', updated: '2026-07-06', labels: ['agent-processed'], components: ['Installer / openshift-installer'], assignee: 'Jane' },
      { key: 'OCPBUGS-2', summary: 'Hosted CP bug', status: 'Closed', agentState: 'closed', processed: false, issueType: 'Bug', priority: 'Minor', created: '2026-07-03', updated: '2026-07-05', labels: [], components: ['Hosted Control Planes'], assignee: null },
      { key: 'TRT-100', summary: 'TRT test fix', status: 'New', agentState: 'new', processed: false, issueType: 'Task', priority: 'Major', created: '2026-07-04', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'WINC-5', summary: 'WMCO bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null, linkedPrs: [{ repo: 'openshift/windows-machine-config-operator', team: 'wmco', number: 321, url: 'https://github.com/openshift/windows-machine-config-operator/pull/321', state: 'MERGED', author: 'z' }] },
      { key: 'OCPBUGS-3', summary: 'Windows Containers component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Windows Containers'], assignee: null },
      { key: 'MCO-12', summary: 'MCO bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'OCPBUGS-4', summary: 'MCO component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Machine Config Operator'], assignee: null },
      { key: 'NE-7', summary: 'Ingress bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'OCPBUGS-5', summary: 'Ingress component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Networking / router'], assignee: null }
    ]
  }

  it('renders stat cards with metrics', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('Total Issues')
    expect(wrapper.text()).toContain('Ready to Solve')
    expect(wrapper.text()).toContain('10%')
  })

  it('renders the issue table with Key, Summary, PR Status and Jira Status columns', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const text = wrapper.text()
    // Column headers.
    expect(text).toContain('Key')
    expect(text).toContain('Summary')
    expect(text).toContain('PR Status')
    expect(text).toContain('Jira Status')
    // Key + summary render.
    expect(text).toContain('OCPBUGS-1')
    expect(text).toContain('HyperShift bug')
    // Jira status renders.
    expect(text).toContain('In Progress')
    // The removed Component column content is no longer shown in the table.
    expect(text).not.toContain('Installer / openshift-installer')
  })

  it('rolls up the PR Status badge across an issue\'s multiple linked PRs', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    // OCPBUGS-1 has an OPEN and a CLOSED linked PR → rollup badge is "Open"
    // (any open wins) and links to the first PR.
    const badge = wrapper.findAll('a[href="https://github.com/openshift/hypershift/pull/9137"]')
      .find(a => a.text() === 'Open')
    expect(badge).toBeTruthy()
  })

  it('lists every PR for a Jira issue in the PR column', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    // Both linked PRs render as their own compact links, each pointing at its PR.
    const hs = wrapper.find('a[href="https://github.com/openshift/hypershift/pull/9137"]')
    const origin = wrapper.find('a[href="https://github.com/openshift/origin/pull/31382"]')
    expect(hs.exists()).toBe(true)
    expect(origin.exists()).toBe(true)
    // The PR column uses compact "repo#number" labels for each.
    const labels = wrapper.findAll('a').map(a => a.text())
    expect(labels).toContain('hypershift#9137')
    expect(labels).toContain('origin#31382')
  })

  it('shows team selector buttons with inline stats', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const allBtn = buttons.find(b => b.text().includes('All Teams'))
    expect(allBtn.exists()).toBe(true)
    expect(allBtn.text()).toContain('total')
    expect(allBtn.text()).toContain('merged')
    expect(allBtn.text()).toContain('wip')
    expect(buttons.some(b => b.text().includes('HyperShift'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Installer'))).toBe(true)
    expect(buttons.some(b => b.text().includes('TRT'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Windows Containers'))).toBe(true)
    expect(buttons.some(b => b.text().includes('MCO'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Ingress Operator'))).toBe(true)
  })

  it('shows a merged stat that counts rows with a merged PR', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    // The WMCO box matches two issues (WINC-5 by prefix, OCPBUGS-3 by the
    // "Windows Containers" component); only WINC-5's linked PR is MERGED.
    const wmcoBtn = wrapper.findAll('button').find(b => b.text().includes('Windows Containers'))
    expect(wmcoBtn.text()).toContain('merged')
    // Its stat cluster reads: total=2, wip=0, merged=1.
    const nums = wmcoBtn.findAll('.text-xl').map(n => n.text())
    expect(nums).toEqual(['2', '0', '1'])
  })

  it('filters issues by team when team button is clicked', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const installerBtn = buttons.find(b => b.text().includes('Installer'))
    await installerBtn.trigger('click')

    expect(wrapper.text()).toContain('CNTRLPLANE-10')
    expect(wrapper.text()).not.toContain('OCPBUGS-1')
    expect(wrapper.text()).not.toContain('OCPBUGS-2')
  })

  it('filters TRT issues by project prefix', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const trtBtn = buttons.find(b => b.text().includes('TRT'))
    await trtBtn.trigger('click')

    expect(wrapper.text()).toContain('TRT-100')
    expect(wrapper.text()).not.toContain('OCPBUGS-1')
    expect(wrapper.text()).not.toContain('CNTRLPLANE-10')
  })

  it('filters WMCO issues by project prefix and component', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const wmcoBtn = buttons.find(b => b.text().includes('Windows Containers'))
    await wmcoBtn.trigger('click')

    expect(wrapper.text()).toContain('WINC-5')
    expect(wrapper.text()).toContain('Windows Containers component bug')
    expect(wrapper.text()).not.toContain('OCPBUGS-1')
  })

  it('filters MCO issues by project prefix and component', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const mcoBtn = buttons.find(b => b.text().includes('MCO'))
    await mcoBtn.trigger('click')

    expect(wrapper.text()).toContain('MCO-12')
    expect(wrapper.text()).toContain('MCO component bug')
    expect(wrapper.text()).not.toContain('OCPBUGS-1')
  })

  it('filters ingress issues by project prefix and component', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const buttons = wrapper.findAll('button')
    const ingressBtn = buttons.find(b => b.text().includes('Ingress Operator'))
    await ingressBtn.trigger('click')

    expect(wrapper.text()).toContain('NE-7')
    expect(wrapper.text()).toContain('Ingress component bug')
    expect(wrapper.text()).not.toContain('OCPBUGS-1')
  })

  it('shows empty state when no data', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: null, loading: false, error: null }
    })
    expect(wrapper.text()).toContain('No data available')
  })

  it('shows error state with retry', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: null, loading: false, error: 'Connection failed' }
    })
    expect(wrapper.text()).toContain('Connection failed')
    expect(wrapper.text()).toContain('Retry')
  })
})
