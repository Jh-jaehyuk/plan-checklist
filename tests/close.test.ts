import { expect, test } from 'claude-code/testing'

const PLAN = '# Refund API\n\n1. Write the failing test\n2. Fix the refund logic'
const CHECK = 'mcp__plan-checklist__plan_check'

type Body = Extract<Parameters<typeof test>[1], (...args: never[]) => unknown>

const approve = async ($: Parameters<Body>[0], on: Parameters<Body>[1]) => {
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  on('classic.Stop', () => ({}))
  await $.tool.call({ tool: 'ExitPlanMode' })
}

// The row the transcript keeps for a slash command, as `$.session.messages()` returns it.
const commandRow = (name: string, args: string) => ({
  role: 'user' as const,
  text: `<command-name>/${name}</command-name>\n            <command-message>${name}</command-message>\n            <command-args>${args}</command-args>`,
  toolUses: [],
})
const approved = (id: string) => ({
  role: 'assistant' as const,
  text: '',
  toolUses: [{ tool_use_id: id, tool: 'ExitPlanMode', input: {}, result: { plan: PLAN, isAgent: false }, text: 'approved' }],
})

const resumeWith = async ($: Parameters<Body>[0], on: Parameters<Body>[1], transcript: unknown[]) => {
  on('tool.register', () => ({ value: undefined }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.messages', () => ({ value: transcript }) as never)
  on('ui.toast', () => ({ value: undefined }))
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
}

test('/checklist close stops tracking the plan and tells Claude so', async ($, on) => {
  await approve($, on)

  const closed = await $.command.run({ command: 'checklist', args: 'close' } as never)
  expect(closed.text).toContain('Refund API')
  expect(closed.context?.join('\n')).toContain('Refund API')

  const check = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  expect(check.isError).toBe(true)
  const stop = await $.classic.Stop({ stop_hook_active: false })
  expect(stop.block).toBeUndefined()
})

test('/checklist close with no plan says there is none', async $ => {
  const closed = await $.command.run({ command: 'checklist', args: 'close' } as never)
  expect(closed.text).toContain('No plan in progress')
  expect(closed.context ?? []).toEqual([])
})

test('a resumed session does not bring a closed plan back', async ($, on) => {
  await resumeWith($, on, [approved('t1'), commandRow('checklist', 'close')])

  const check = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  expect(check.isError).toBe(true)
})

test('the namespaced /plan-checklist:checklist close counts too', async ($, on) => {
  await resumeWith($, on, [approved('t1'), commandRow('plan-checklist:checklist', 'close')])

  const check = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  expect(check.isError).toBe(true)
})

test('a plan approved after a close comes back on resume', async ($, on) => {
  await resumeWith($, on, [approved('t1'), commandRow('checklist', 'close'), approved('t2'), commandRow('checklist', '')])

  const check = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 1 failed (RED)' })
  expect(check.isError).toBeUndefined()
})
