import { expect, test } from 'claude-code/testing'

const PLAN = '# Refund API\n\n1. Write the failing test\n2. Fix the refund logic\n3. Run the full suite'
const CHECK = 'mcp__plan-checklist__plan_check'

// The transcript a resumed session starts with: the approved plan, a check refused for thin evidence, one that landed.
const TRANSCRIPT = [
  {
    role: 'assistant' as const,
    text: '',
    toolUses: [{ tool_use_id: 't1', tool: 'ExitPlanMode', input: {}, result: { plan: PLAN, isAgent: false }, text: 'approved' }],
  },
  {
    role: 'assistant' as const,
    text: '',
    toolUses: [
      { tool_use_id: 't2', tool: CHECK, input: { item: 2, evidence: 'done' }, text: 'refused' },
      { tool_use_id: 't3', tool: CHECK, input: { item: 1, evidence: 'node test.js → exit=1 (RED)' }, text: 'checked' },
    ],
  },
]

// What sits beneath the plugin at session start in a real session.
const engine = (on: Parameters<Parameters<typeof test>[1]>[1], transcript: unknown[]) => {
  on('tool.register', () => ({ value: undefined }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.messages', () => ({ value: transcript }) as never)
  on('ui.toast', () => ({ value: undefined }))
}

test('a resumed session rebuilds the plan from its transcript', async ($, on) => {
  engine(on, TRANSCRIPT)

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

  const next = await $.tool.call({ tool: CHECK, item: 2, evidence: 'pytest → 3 passed' })
  expect(next.isError).toBeUndefined()
  expect(JSON.stringify(next)).toContain('2/3')
})

test('a check refused for being out of order is not replayed', async ($, on) => {
  engine(on, [
    TRANSCRIPT[0],
    {
      role: 'assistant' as const,
      text: '',
      toolUses: [{ tool_use_id: 't2', tool: CHECK, input: { item: 2, evidence: 'pytest → 3 passed' }, text: 'refused' }],
    },
  ])

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

  const first = await $.tool.call({ tool: CHECK, item: 1, evidence: 'node test.js → exit=1 (RED)' })
  expect(JSON.stringify(first)).toContain('1/3')
})

test('a fresh session with no plan in its transcript has none', async ($, on) => {
  engine(on, [])

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

  const check = await $.tool.call({ tool: CHECK, item: 1, evidence: 'pytest → 3 passed' })
  expect(check.isError).toBe(true)
})

test('/resume in a running session rebuilds the plan too', async ($, on) => {
  engine(on, TRANSCRIPT)
  on('classic.SessionStart', () => ({}) as never)

  await $.classic.SessionStart({ source: 'resume' } as never)

  const next = await $.tool.call({ tool: CHECK, item: 2, evidence: 'pytest → 3 passed' })
  expect(JSON.stringify(next)).toContain('2/3')
})

test('/branch rebuilds the plan in the forked session', async ($, on) => {
  engine(on, TRANSCRIPT)
  on('classic.SessionStart', () => ({}) as never)

  await $.classic.SessionStart({ source: 'fork' } as never)

  const next = await $.tool.call({ tool: CHECK, item: 2, evidence: 'pytest → 3 passed' })
  expect(JSON.stringify(next)).toContain('2/3')
})
