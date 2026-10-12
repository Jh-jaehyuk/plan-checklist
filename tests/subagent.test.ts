import { expect, test } from 'claude-code/testing'

const PLAN = '# Refund API\n\n1. Write the failing test\n2. Fix the refund logic'
const CHECK = 'mcp__plan-checklist__plan_check'

test('a subagent cannot check a step off; the main loop still can', async ($, on) => {
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  await $.tool.call({ tool: 'ExitPlanMode' })

  const fromSubagent = await $.tool.call({ tool: CHECK, agentId: 'sub-1', item: 1, evidence: 'pytest → 1 failed (RED)' } as never)
  expect(fromSubagent.isError).toBe(true)
  expect(JSON.stringify(fromSubagent)).toContain('main agent')

  const fromMain = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  expect(fromMain.isError).toBeUndefined()
  expect(JSON.stringify(fromMain)).toContain('1/2')
})
