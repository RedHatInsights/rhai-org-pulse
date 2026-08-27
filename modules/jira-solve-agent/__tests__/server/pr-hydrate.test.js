import { describe, it, expect, vi } from 'vitest'

const {
  prStateFromRestPull,
  hydratePullRequestState,
  hydrateLinkedPrStates
} = require('../../server/github/prs')

function okPullResponse(data) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data
  }
}

describe('prStateFromRestPull', () => {
  it('maps merged PRs to MERGED', () => {
    expect(prStateFromRestPull({ merged: true, state: 'closed' })).toBe('MERGED')
  })

  it('maps open PRs to OPEN', () => {
    expect(prStateFromRestPull({ merged: false, state: 'open' })).toBe('OPEN')
  })

  it('maps closed-not-merged PRs to CLOSED', () => {
    expect(prStateFromRestPull({ merged: false, state: 'closed' })).toBe('CLOSED')
  })
})

describe('hydratePullRequestState', () => {
  it('fetches PR state from the GitHub REST API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okPullResponse({ merged: true, state: 'closed' }))
    const state = await hydratePullRequestState('openshift/hypershift', 7577, 'token', fetchImpl)

    expect(state).toBe('MERGED')
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/openshift/hypershift/pulls/7577'
    )
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer token')
  })
})

describe('hydrateLinkedPrStates', () => {
  it('updates state on every unique linked PR in the map', async () => {
    const pr1 = {
      repo: 'openshift/hypershift',
      number: 7577,
      url: 'https://github.com/openshift/hypershift/pull/7577',
      state: 'OPEN'
    };
    const pr2 = {
      repo: 'openshift/origin',
      number: 1,
      url: 'https://github.com/openshift/origin/pull/1',
      state: 'OPEN'
    };
    const linkedByKey = new Map([
      ['CNTRLPLANE-644', [pr1]],
      ['TRT-1', [pr2, pr2]]
    ]);

    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okPullResponse({ merged: true, state: 'closed' }))
      .mockResolvedValueOnce(okPullResponse({ merged: false, state: 'open' }))

    await hydrateLinkedPrStates(linkedByKey, { token: 't', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(pr1.state).toBe('MERGED')
    expect(pr2.state).toBe('OPEN')
  })

  it('skips when no token is provided', async () => {
    const fetchImpl = vi.fn()
    const linkedByKey = new Map([
      ['TRT-1', [{ repo: 'openshift/origin', number: 1, url: 'u', state: 'OPEN' }]]
    ])
    await hydrateLinkedPrStates(linkedByKey, { fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
