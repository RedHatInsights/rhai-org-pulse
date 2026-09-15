import { describe, it, expect, vi } from 'vitest'

const { createTestContext } = require('../../../../shared/server/module-context')
const registerRoutes = require('../../server/index')

describe('server routes', () => {
  it('registers Jira Solve and Agentic CVE routes', () => {
    const router = { get: vi.fn(), post: vi.fn() }
    const context = createTestContext()
    registerRoutes(router, context)
    expect(router.get).toHaveBeenCalledWith('/data', expect.any(Function), expect.any(Function))
    expect(router.get).toHaveBeenCalledWith('/cve-data', expect.any(Function), expect.any(Function))
    expect(router.post).toHaveBeenCalledWith('/refresh', expect.any(Function), expect.any(Function), expect.any(Function))
    expect(router.post).toHaveBeenCalledWith('/cve-refresh', expect.any(Function), expect.any(Function), expect.any(Function))
  })
})
