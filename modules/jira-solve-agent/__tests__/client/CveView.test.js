import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import CveView from '../../client/views/CveView.vue';

vi.mock('@shared/client/composables/useAuth.js', () => ({
  useAuth: () => ({ isAdmin: false })
}));

vi.mock('@shared/client/services/api.js', () => ({
  apiRequest: vi.fn(async () => ({
    fetchedAt: '2026-09-10T00:00:00.000Z',
    jiraHost: 'https://redhat.atlassian.net',
    metrics: { analyzed: 44, agenticPrs: 42, mergedPrs: 21, mergeRate: 50, metadataIssues: 217, falsePositivesAddressed: 317 },
    jql: {
      analyzed: 'project = OCPBUGS AND issuetype = Vulnerability AND labels = "arc:complete"',
      agenticPrs: 'project = OCPBUGS AND issuetype = Vulnerability AND labels = "arc:automated-pr"',
      mergedPrs: 'project = OCPBUGS AND issuetype = Vulnerability AND labels = "arc:automated-pr" AND status = Closed AND resolution = Done',
      metadataIssues: 'project = OCPBUGS AND issuetype = Vulnerability AND labels = "arc:repo-unmapped"',
      falsePositivesAddressed: 'project = OCPBUGS AND issuetype = Vulnerability AND labels IN ("arc:negative", "arc:not-shipped")'
    },
    issues: [{ key: 'OCPBUGS-1', summary: 'Example vulnerability', status: 'Closed', resolution: 'Done-Errata', vexJustification: 'Component not present', updated: '2026-09-09T00:00:00.000Z', labels: ['arc:complete'] }]
  }))
}));

describe('CveView', () => {
  it('renders the four KPI definitions and Jira links', async () => {
    const wrapper = mount(CveView);
    await flushPromises();

    expect(wrapper.text()).toContain('Agentic CVE');
    expect(wrapper.text()).toContain('ARC tool from OpenShift Sustaining');
    expect(wrapper.text()).toContain('#forum-arc');
    expect(wrapper.text()).toContain('Issues analyzed');
    expect(wrapper.text()).toContain('Agentic PRs');
    expect(wrapper.text()).toContain('Merge rate');
    expect(wrapper.text()).toContain('50%');
    expect(wrapper.text()).toContain('21/42');
    expect(wrapper.text()).toContain('Metadata issues');
    expect(wrapper.text()).toContain('False positives addressed');
    expect(wrapper.text()).toContain('OCPBUGS-1');
    expect(wrapper.text()).toContain('Done-Errata');
    expect(wrapper.text()).toContain('Component not present');
    expect(wrapper.findAll('a[href*="/issues/?jql="]')).toHaveLength(5);
  });
});
