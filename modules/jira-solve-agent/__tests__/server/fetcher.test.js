import { describe, it, expect } from 'vitest'

const { processIssue, MERGED_RESOLUTIONS } = require('../../server/jira/fetcher')

function jiraIssue(resolution) {
  return {
    key: 'OCPBUGS-1',
    fields: {
      summary: 'Agent candidate',
      status: { name: 'Closed', statusCategory: { name: 'Done' } },
      resolution: resolution ? { name: resolution } : null,
      issuetype: { name: 'Bug' },
      priority: { name: 'Major' },
      created: '2026-08-01',
      updated: '2026-08-02',
      labels: ['issue-for-agent', 'agent-processed'],
      components: [{ name: 'HyperShift' }],
      assignee: null
    }
  }
}

describe('Jira Solve Agent fetcher', () => {
  it.each(MERGED_RESOLUTIONS)('counts resolution %s as merged', resolution => {
    const issue = processIssue(jiraIssue(resolution))
    expect(issue.resolution).toBe(resolution)
    expect(issue.processed).toBe(true)
    expect(issue.merged).toBe(true)
  })

  it.each([null, 'Current Release', 'ERRATA', 'Duplicate', "Won't Do"])('does not count resolution %s as merged', resolution => {
    expect(processIssue(jiraIssue(resolution)).merged).toBe(false)
  })
})
