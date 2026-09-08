import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSidebar from '../components/AppSidebar.vue'

describe('AppSidebar external agentic tools', () => {
  function mountSidebar(collapsed = false) {
    return mount(AppSidebar, {
      props: {
        collapsed,
        activeModule: 'home',
        modules: [],
        builtInManifests: []
      }
    })
  }

  it('links external agentic tools in a new tab', () => {
    const wrapper = mountSidebar()
    const readiness = wrapper.find('a[href="https://fleet-insights.apps.engineering.openshift.org/hybrid-platforms/ocp/ai-enablement"]')
    const valorFlow = wrapper.find('a[href="https://valorflow.apps.int.spoke.preprod.us-west-2.aws.paas.redhat.com/"]')
    const hyperShell = wrapper.find('a[href="https://hypershell.apps.rosa.hcmais01ue1.s9m2.p3.openshiftapps.com/"]')

    expect(readiness.text()).toContain('Agentic Readiness')
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
})
