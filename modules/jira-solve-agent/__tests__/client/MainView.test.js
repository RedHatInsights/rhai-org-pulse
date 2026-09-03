import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AgentContent from '../../client/components/AgentContent.vue'

describe('AgentContent', () => {
  const sampleData = {
    fetchedAt: '2026-07-07T10:00:00Z',
    jiraHost: 'https://redhat.atlassian.net',
    teamRepos: {
      hypershift: ['hypershift'],
      installer: ['installer'],
      trt: ['sippy', 'origin'],
      mco: ['machine-config-operator', 'os'],
      ota: ['cluster-version-operator', 'cincinnati-graph-data']
    },
    metrics: {
      totalIssues: 10,
      byState: { new: 2, 'ready-to-solve': 0, 'in-progress': 1, closed: 1 },
      processedCount: 1,
      processedRate: 10
    },
    prs: [
      { repo: 'openshift/hypershift', team: 'hypershift', number: 9137, state: 'OPEN' },
      { repo: 'openshift/windows-machine-config-operator', team: 'wmco', number: 321, state: 'MERGED' }
    ],
    issues: [
      { key: 'OCPBUGS-1', summary: 'HyperShift bug', status: 'New', resolution: null, agentState: 'new', processed: false, merged: false, issueType: 'Bug', priority: 'Major', created: '2026-07-01', updated: '2026-07-07', labels: ['issue-for-agent'], components: ['HyperShift'], assignee: null, linkedPrs: [{ repo: 'openshift/hypershift', team: 'hypershift', number: 9137, url: 'https://github.com/openshift/hypershift/pull/9137', state: 'OPEN', author: 'x' }, { repo: 'openshift/origin', team: 'trt', number: 31382, url: 'https://github.com/openshift/origin/pull/31382', state: 'CLOSED', author: 'y' }] },
      { key: 'CNTRLPLANE-10', summary: 'Installer issue', status: 'In Progress', resolution: null, agentState: 'in-progress', processed: true, merged: false, issueType: 'Bug', priority: 'Critical', created: '2026-07-02', updated: '2026-07-06', labels: ['issue-for-agent', 'agent-processed'], components: ['Installer / openshift-installer'], assignee: 'Jane' },
      { key: 'OCPBUGS-2', summary: 'Hosted CP bug', status: 'Closed', resolution: 'Done', agentState: 'closed', processed: false, merged: true, issueType: 'Bug', priority: 'Minor', created: '2026-07-03', updated: '2026-07-05', labels: ['issue-for-agent'], components: ['Hosted Control Planes'], assignee: null },
      { key: 'TRT-100', summary: 'TRT test fix', status: 'New', agentState: 'new', processed: false, issueType: 'Task', priority: 'Major', created: '2026-07-04', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'WINC-5', summary: 'WMCO bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null, linkedPrs: [{ repo: 'openshift/windows-machine-config-operator', team: 'wmco', number: 321, url: 'https://github.com/openshift/windows-machine-config-operator/pull/321', state: 'MERGED', author: 'z' }] },
      { key: 'OCPBUGS-3', summary: 'Windows Containers component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Windows Containers'], assignee: null },
      { key: 'MCO-12', summary: 'MCO bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'OCPBUGS-4', summary: 'MCO component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Machine Config Operator'], assignee: null },
      { key: 'NE-7', summary: 'Ingress bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: [], assignee: null },
      { key: 'OCPBUGS-5', summary: 'Ingress component bug', status: 'New', agentState: 'new', processed: false, issueType: 'Bug', priority: 'Major', created: '2026-07-05', updated: '2026-07-07', labels: [], components: ['Networking / router'], assignee: null }
    ]
  }

  it('renders funnel stat cards', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('Total Candidates')
    expect(wrapper.text()).toContain('Jira Attempts')
    expect(wrapper.text()).toContain('Jira Acceptances')
    expect(wrapper.text()).toContain('Jira Acceptance Rate')
    expect(wrapper.text()).toContain('GitHub PR Merge Rate')
    const acceptanceCard = wrapper.find('a[aria-label="View accepted candidates in Jira"]')
    // The resolved sample was never marked agent-processed, so it is not an
    // accepted attempt and cannot inflate the attempted-to-accepted rate.
    expect(acceptanceCard.text()).toContain('0%')
    expect(acceptanceCard.text()).toContain('0/1 attempted issues accepted')
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
    expect(allBtn.element.parentElement.textContent).toContain('total candidate')
    expect(allBtn.element.parentElement.textContent).toContain('total attempts')
    expect(allBtn.element.parentElement.textContent).toContain('jira accepted')
    expect(buttons.some(b => b.text().includes('HyperShift'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Installer'))).toBe(true)
    expect(buttons.some(b => b.text().includes('TRT'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Windows Containers'))).toBe(true)
    expect(buttons.some(b => b.text().includes('MCO'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Ingress Operator'))).toBe(true)
  })

  it('shows candidate funnel stats independently from PR state', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    // The WMCO box matches two issues (WINC-5 by prefix, OCPBUGS-3 by the
    // "Windows Containers" component); only WINC-5's linked PR is MERGED.
    const wmcoBtn = wrapper.findAll('button').find(b => b.text().includes('Windows Containers'))
    expect(wmcoBtn.element.parentElement.textContent).toContain('jira accepted')
    // Neither Jira issue has an accepted merge resolution, even though one
    // carries a merged GitHub PR.
    const nums = [...wmcoBtn.element.parentElement.querySelectorAll('.text-xl')].map(n => n.textContent)
    expect(nums).toEqual(['2', '0', '0'])
  })

  it('keeps actual GitHub PR merge rate distinct from Jira acceptance', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const githubCard = wrapper.find('[title="Actual merged bot PRs divided by bot PRs with a known GitHub state"]')
    // Two bot PRs have known states and one is actually merged.
    expect(githubCard.text()).toContain('50%')
    expect(githubCard.text()).toContain('1/2 agentic PRs with a known state')
  })

  it('disables Jira metrics for repository-only teams', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const teamButton = wrapper.findAll('button').find(button => button.text().includes('Cluster Lifecycle'))
    expect(teamButton.element.parentElement.textContent).toContain('GitHub activity only · no Jira mapping')
    expect(teamButton.element.parentElement.querySelectorAll('a')).toHaveLength(0)

    await teamButton.trigger('click')
    const attempts = wrapper.find('a[aria-label="View total attempts in Jira"]')
    expect(attempts.attributes('href')).toBeUndefined()
    expect(attempts.attributes('aria-disabled')).toBe('true')
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

  it('links team funnel counts to matching Jira searches', () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    const jqlFor = label => {
      const href = wrapper.find(`a[aria-label="${label}"]`).attributes('href')
      return new URL(href).searchParams.get('jql')
    }

    expect(jqlFor('View HyperShift candidates in Jira')).toContain('component IN ("HyperShift", "Hosted Control Planes")')
    expect(jqlFor('View Installer attempts in Jira')).toContain('labels = "agent-processed"')
    expect(jqlFor('View TRT merges in Jira')).toContain('resolution IN (Done, "Done-Errata")')
    expect(jqlFor('View TRT merges in Jira')).toContain('labels = "agent-processed"')
    expect(jqlFor('View OCPBUGS candidates in Jira')).toContain('project IN (OCPBUGS)')
  })

  it('updates summary Jira links for the selected team', async () => {
    const wrapper = mount(AgentContent, {
      props: { agentData: sampleData, loading: false, error: null }
    })
    await wrapper.findAll('button').find(button => button.text().includes('HyperShift')).trigger('click')

    const candidateHref = wrapper.find('a[aria-label="View total candidates in Jira"]').attributes('href')
    const progressHref = wrapper.find('a[aria-label="View in-progress candidates in Jira"]').attributes('href')
    expect(new URL(candidateHref).searchParams.get('jql')).toContain('component IN ("HyperShift", "Hosted Control Planes")')
    expect(new URL(progressHref).searchParams.get('jql')).toContain('statusCategory = "In Progress"')
  })


  // Row keys in table order, so sort assertions read as the visible ordering.
  function renderedKeys(wrapper) {
    return wrapper.findAll('tbody tr').map(tr => tr.findAll('td')[0].text())
  }

  function headerButton(wrapper, label) {
    return wrapper.findAll('thead th button').find(b => b.text().startsWith(label))
  }

  describe('column filters', () => {
    it('offers a PR status filter matching the PR Status column', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const select = wrapper.find('select[aria-label="Filter by PR status"]')
      expect(select.exists()).toBe(true)
      const values = select.findAll('option').map(o => o.attributes('value'))
      expect(values).toEqual(['all', 'OPEN', 'MERGED', 'CLOSED', 'UNKNOWN', 'none'])
    })

    it('filters rows down to a chosen PR status', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      await wrapper.find('select[aria-label="Filter by PR status"]').setValue('MERGED')
      // Only WINC-5 has a MERGED linked PR.
      expect(renderedKeys(wrapper)).toEqual(['WINC-5'])
    })

    it('filters rows with no PR at all via the "No PR" option', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      await wrapper.find('select[aria-label="Filter by PR status"]').setValue('none')
      const keys = renderedKeys(wrapper)
      // Rows carrying linked PRs are excluded; the rest remain.
      expect(keys).not.toContain('OCPBUGS-1')
      expect(keys).not.toContain('WINC-5')
      expect(keys).toContain('CNTRLPLANE-10')
    })

    it('keeps the Jira state filter working alongside the PR filter', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      await wrapper.find('select[aria-label="Filter by Jira state"]').setValue('in-progress')
      expect(renderedKeys(wrapper)).toEqual(['CNTRLPLANE-10'])
    })

    it('no longer shows the orphaned processed filter', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const optionText = wrapper.findAll('option').map(o => o.text())
      expect(optionText).not.toContain('Not Processed')
    })
  })

  describe('column sorting', () => {
    it('renders every column header as a sort button', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const labels = wrapper.findAll('thead th button').map(b => b.text().replace(/[▲▼]/g, '').trim())
      expect(labels).toEqual(['Key', 'Summary', 'PR Status', 'PR', 'Jira Status'])
    })

    it('sorts by key numerically within a project, not lexicographically', async () => {
      const data = {
        ...sampleData,
        issues: [
          { key: 'OCPBUGS-100', summary: 'c', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'OCPBUGS-9', summary: 'a', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'CNTRLPLANE-2', summary: 'b', status: 'New', agentState: 'new', processed: false, components: [], assignee: null }
        ]
      }
      const wrapper = mount(AgentContent, { props: { agentData: data, loading: false, error: null } })
      await headerButton(wrapper, 'Key').trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['CNTRLPLANE-2', 'OCPBUGS-9', 'OCPBUGS-100'])
    })

    it('cycles ascending, descending, then back to the default order', async () => {
      const data = {
        ...sampleData,
        issues: [
          { key: 'OCPBUGS-100', summary: 'c', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'OCPBUGS-9', summary: 'a', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'CNTRLPLANE-2', summary: 'b', status: 'New', agentState: 'new', processed: false, components: [], assignee: null }
        ]
      }
      const wrapper = mount(AgentContent, { props: { agentData: data, loading: false, error: null } })
      const btn = () => headerButton(wrapper, 'Key')

      await btn().trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['CNTRLPLANE-2', 'OCPBUGS-9', 'OCPBUGS-100'])

      await btn().trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['OCPBUGS-100', 'OCPBUGS-9', 'CNTRLPLANE-2'])

      // Third click clears the sort, restoring the server's ordering.
      await btn().trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['OCPBUGS-100', 'OCPBUGS-9', 'CNTRLPLANE-2'])
    })

    it('sorts by summary alphabetically', async () => {
      const data = {
        ...sampleData,
        issues: [
          { key: 'A-1', summary: 'zebra', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'A-2', summary: 'apple', status: 'New', agentState: 'new', processed: false, components: [], assignee: null }
        ]
      }
      const wrapper = mount(AgentContent, { props: { agentData: data, loading: false, error: null } })
      await headerButton(wrapper, 'Summary').trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['A-2', 'A-1'])
    })

    it('sorts by PR status in lifecycle order with no-PR rows last', async () => {
      const pr = (state, number) => [{ repo: 'openshift/origin', team: 'trt', number, url: `https://github.com/openshift/origin/pull/${number}`, state, author: 'x' }]
      const data = {
        ...sampleData,
        issues: [
          { key: 'A-1', summary: 'none', status: 'New', agentState: 'new', processed: false, components: [], assignee: null },
          { key: 'A-2', summary: 'closed', status: 'New', agentState: 'new', processed: false, components: [], assignee: null, linkedPrs: pr('CLOSED', 2) },
          { key: 'A-3', summary: 'open', status: 'New', agentState: 'new', processed: false, components: [], assignee: null, linkedPrs: pr('OPEN', 3) },
          { key: 'A-4', summary: 'merged', status: 'New', agentState: 'new', processed: false, components: [], assignee: null, linkedPrs: pr('MERGED', 4) }
        ]
      }
      const wrapper = mount(AgentContent, { props: { agentData: data, loading: false, error: null } })
      await headerButton(wrapper, 'PR Status').trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['A-3', 'A-4', 'A-2', 'A-1'])
    })

    it('sorts by Jira status alphabetically with blanks last', async () => {
      const data = {
        ...sampleData,
        issues: [
          { key: 'A-1', summary: 'a', status: null, agentState: 'other', processed: false, components: [], assignee: null },
          { key: 'A-2', summary: 'b', status: 'Closed', agentState: 'closed', processed: false, components: [], assignee: null },
          { key: 'A-3', summary: 'c', status: 'Assigned', agentState: 'new', processed: false, components: [], assignee: null }
        ]
      }
      const wrapper = mount(AgentContent, { props: { agentData: data, loading: false, error: null } })
      await headerButton(wrapper, 'Jira Status').trigger('click')
      expect(renderedKeys(wrapper)).toEqual(['A-3', 'A-2', 'A-1'])
    })

    it('sorts the PR column by number of linked PRs', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      await headerButton(wrapper, 'PR').trigger('click')
      // OCPBUGS-1 has two linked PRs, WINC-5 has one, the rest have none.
      const keys = renderedKeys(wrapper)
      expect(keys[0]).toBe('OCPBUGS-1')
      expect(keys[1]).toBe('WINC-5')
    })

    it('marks the sorted column with aria-sort for assistive tech', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const keyHeader = () => wrapper.findAll('thead th')[0]
      expect(keyHeader().attributes('aria-sort')).toBe('none')
      await headerButton(wrapper, 'Key').trigger('click')
      expect(keyHeader().attributes('aria-sort')).toBe('ascending')
      await headerButton(wrapper, 'Key').trigger('click')
      expect(keyHeader().attributes('aria-sort')).toBe('descending')
    })

    it('does not mutate the incoming issues array when sorting', async () => {
      const issues = sampleData.issues.map(i => ({ ...i }))
      const order = issues.map(i => i.key)
      const wrapper = mount(AgentContent, {
        props: { agentData: { ...sampleData, issues }, loading: false, error: null }
      })
      await headerButton(wrapper, 'Key').trigger('click')
      expect(issues.map(i => i.key)).toEqual(order)
    })

    it('keeps sorting applied while a filter narrows the rows', async () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      await headerButton(wrapper, 'Key').trigger('click')
      await wrapper.find('select[aria-label="Filter by Jira state"]').setValue('new')
      const keys = renderedKeys(wrapper)
      expect(keys).toEqual([...keys].sort((a, b) => {
        const [pa, na] = a.split('-'); const [pb, nb] = b.split('-')
        return pa === pb ? Number(na) - Number(nb) : pa.localeCompare(pb)
      }))
    })
  })


  describe('team repo tooltips', () => {
    function teamButton(wrapper, label) {
      return wrapper.findAll('button').find(b => b.text().includes(label))
    }

    function tooltipFor(button) {
      return button.element.parentElement.querySelector('[role="tooltip"]')
    }

    it('lists a team\'s repos in a tooltip on its box', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const tip = tooltipFor(teamButton(wrapper, 'MCO'))
      expect(tip).toBeTruthy()
      expect(tip.textContent).toContain('machine-config-operator')
      expect(tip.textContent).toContain('os')
      expect(tip.textContent).toContain('2 repos')
    })

    it('rolls every tracked repo up under All Teams', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const tip = tooltipFor(teamButton(wrapper, 'All Teams'))
      // De-duplicated and sorted across all teams.
      expect(tip.textContent).toContain('cincinnati-graph-data')
      expect(tip.textContent).toContain('sippy')
      expect(tip.textContent).toContain('8 repos')
    })

    it('uses the singular label for a one-repo team', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const tip = tooltipFor(teamButton(wrapper, 'Installer'))
      expect(tip.textContent).toContain('1 repo')
      expect(tip.textContent).not.toContain('1 repos')
    })

    it('points the box at its tooltip via aria-describedby', () => {
      const wrapper = mount(AgentContent, {
        props: { agentData: sampleData, loading: false, error: null }
      })
      const btn = teamButton(wrapper, 'MCO')
      expect(btn.attributes('aria-describedby')).toBe('repos-mco')
      expect(tooltipFor(btn).id).toBe('repos-mco')
    })

    it('renders without tooltips when the server sends no teamRepos', () => {
      const { teamRepos, ...withoutRepos } = sampleData
      expect(teamRepos).toBeTruthy()
      const wrapper = mount(AgentContent, {
        props: { agentData: withoutRepos, loading: false, error: null }
      })
      expect(wrapper.findAll('[role="tooltip"]')).toHaveLength(0)
      // The boxes themselves still render.
      expect(teamButton(wrapper, 'MCO').exists()).toBe(true)
    })
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
