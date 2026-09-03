import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LandingPage from '../components/LandingPage.vue'

describe('LandingPage', () => {
  function mountPage() {
    return mount(LandingPage, {
      props: {
        builtInManifests: [
          { slug: 'jira-solve-agent', name: 'Agentic Bug Fixes', description: 'Track agent work', icon: 'sparkles' }
        ]
      }
    })
  }

  it('explains Org Pulse and presents the strategic initiatives', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('What is Org Pulse?')
    expect(wrapper.text()).toContain("Hybrid Platforms' agentic evolution")
    expect(wrapper.text()).toContain('Agentic Bug Fixes')
    expect(wrapper.text()).toContain('Agentic Backports')
    expect(wrapper.text()).toContain('Agentic Team, Engineer & Repo Structure')
    expect(wrapper.text()).toContain('Refinement Assistance')
    expect(wrapper.text()).toContain('ValorFlow')
    expect(wrapper.findAll('span').filter(span => span.text() === 'TBD')).toHaveLength(1)
    const titles = wrapper.findAll('#strategic-initiatives-heading + div h2').map(title => title.text())
    expect(titles).toEqual([
      'Agentic Team, Engineer & Repo Structure',
      'Repo-level Agent Readiness',
      'Agentic Bug Fixes',
      'Refinement Assistance',
      'Agentic Backports',
      'HyperShell'
    ])
    expect(wrapper.text()).not.toContain('Built-in Modules')
    expect(wrapper.text()).not.toContain('Utilities')
    expect(wrapper.text()).not.toContain('API Docs')
  })

  it('navigates from Agentic Bug Fixes to Jira Solve', async () => {
    const wrapper = mountPage()
    const initiative = wrapper.findAll('button').find(button => button.text().includes('Track agent-assisted bug'))

    await initiative.trigger('click')

    expect(wrapper.emitted('navigate')).toContainEqual(['jira-solve-agent'])
  })

  it('navigates from team structure to Team Tracker home', async () => {
    const wrapper = mountPage()
    const initiative = wrapper.findAll('button').find(button => button.text().includes('Connect teams, engineers'))

    await initiative.trigger('click')

    expect(wrapper.emitted('navigate')).toContainEqual(['team-tracker::home'])
  })

  it('links HyperShell externally', () => {
    const wrapper = mountPage()
    const link = wrapper.find('a[href="https://hypershell.apps.rosa.hcmais01ue1.s9m2.p3.openshiftapps.com/"]')

    expect(link.text()).toContain('Support long-lived cloud agents secured by OpenShell.')
    expect(link.text()).toContain('External')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('links Refinement Assistance to ValorFlow externally', () => {
    const wrapper = mountPage()
    const link = wrapper.find('a[href="https://valorflow.apps.int.spoke.preprod.us-west-2.aws.paas.redhat.com/"]')

    expect(link.text()).toContain('Refinement Assistance')
    expect(link.text()).toContain('ValorFlow')
    expect(link.text()).toContain('External')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('links Repo-level Agent Readiness to Fleet Insights', () => {
    const wrapper = mountPage()
    const link = wrapper.find('a[href="https://fleet-insights.apps.engineering.openshift.org/hybrid-platforms/ocp/ai-enablement"]')

    expect(link.text()).toContain('Repo-level Agent Readiness')
    expect(link.text()).toContain('External')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })
})
