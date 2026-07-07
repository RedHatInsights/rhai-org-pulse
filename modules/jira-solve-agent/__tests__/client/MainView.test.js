import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AgentContent from '../../client/components/AgentContent.vue'

describe('AgentContent', () => {
  const sampleData = {
    fetchedAt: '2026-07-07T10:00:00Z',
    jiraHost: 'https://redhat.atlassian.net',
    metrics: {
      totalIssues: 5,
      byState: { new: 2, 'ready-to-solve': 1, 'in-progress': 1, closed: 1 },
      processedCount: 3,
      processedRate: 60
    },
    issues: [
      { key: 'OCPBUGS-1', summary: 'Test issue', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-01', updated: '2026-07-07', labels: [], components: [], assignee: null }
    ]
  }

  it('renders stat cards with metrics', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('Total Issues')
    expect(wrapper.text()).toContain('Ready to Solve')
    expect(wrapper.text()).toContain('60%')
  })

  it('renders issue table with data', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    expect(wrapper.text()).toContain('OCPBUGS-1')
    expect(wrapper.text()).toContain('Test issue')
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
