import { expect, test } from 'claude-code/testing'

const PLAN = '# Refund API\n\n1. Write the failing test\n2. Fix the refund logic'
const CHECK = 'mcp__plan-checklist__plan_check'

type Body = Extract<Parameters<typeof test>[1], (...args: never[]) => unknown>

const approve = async ($: Parameters<Body>[0], on: Parameters<Body>[1]) => {
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  on('classic.Stop', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  await $.tool.call({ tool: 'ExitPlanMode' })
}

test('each prompt carries the remaining steps while a plan is in progress', async ($, on) => {
  await approve($, on)

  const result = await $.classic.UserPromptSubmit({ prompt: 'go on' })
  expect(result.additionalContext?.join('\n')).toContain('1. Write the failing test')
})

test('no reminder on a prompt when no plan is in progress', async ($, on) => {
  on('classic.UserPromptSubmit', () => ({}))

  const result = await $.classic.UserPromptSubmit({ prompt: 'hi' })
  expect(result.additionalContext ?? []).toEqual([])
})

test('ending a turn with unchecked steps is blocked once, then again only after progress', async ($, on) => {
  await approve($, on)

  const first = await $.classic.Stop({ stop_hook_active: false })
  expect(first.block).toContain(CHECK)
  expect(first.block).toContain('2. Fix the refund logic')

  // Claude explained instead of checking: no progress, no second block.
  const again = await $.classic.Stop({ stop_hook_active: false })
  expect(again.block).toBeUndefined()

  await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  const afterProgress = await $.classic.Stop({ stop_hook_active: false })
  expect(afterProgress.block).toContain('2. Fix the refund logic')
})

test('a stop already continued by a stop hook is never blocked', async ($, on) => {
  await approve($, on)

  const result = await $.classic.Stop({ stop_hook_active: true })
  expect(result.block).toBeUndefined()
})

test('a finished plan never blocks a stop', async ($, on) => {
  await approve($, on)
  await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  await $.tool.call({ tool: CHECK, item: 2, evidence: 'pytest → 3 passed' })

  const result = await $.classic.Stop({ stop_hook_active: false })
  expect(result.block).toBeUndefined()
})
