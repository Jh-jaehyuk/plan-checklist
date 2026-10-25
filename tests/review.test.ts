import { describe, expect, test } from 'claude-code/testing'

import { MESSAGES } from '../hooks/messages'
import { planProblems } from '../hooks/plan'

const en = MESSAGES.en

const PLAN_FILE = '/home/me/.claude/plans/refund.md'
const GOOD = '# Refund API\n\n1. Write the failing test: pytest tests/test_refund.py → 1 failed\n2. Fix the refund logic: pytest tests/test_refund.py → passed'
const VAGUE = '# Shop\n\n1. Backend\n2. Frontend\n3. Deploy: curl https://shop.example/health → 200'

type Body = Extract<Parameters<typeof test>[1], (...args: never[]) => unknown>

// What sits beneath the plugin in a planning session: the plan-mode reminder, the plan file, the approval.
const planning = async ($: Parameters<Body>[0], on: Parameters<Body>[1], file: string) => {
  const approvals: string[] = []
  on('ui.toast', () => ({ value: undefined }))
  on('prompt.attachment', (_$, e) => ({ text: e.text }))
  on('fs.read', (_$, e) => {
    if (e.path !== PLAN_FILE) throw new Error('no such file')
    return { value: file } as never
  })
  on('tool.call', { tool: 'ExitPlanMode' }, () => {
    approvals.push(file)
    return { result: { plan: file, isAgent: false } }
  })
  const reminder = await $.prompt.attachment({
    type: 'plan_mode',
    text: 'Plan mode is active.',
    origin: { kind: 'engine' },
    detail: { reminder: 'full', planFilePath: PLAN_FILE, hasPlan: false },
  } as never)
  return { approvals, reminder }
}

describe('planProblems', () => {
  test('a plan whose every step says how it is verified passes', () => {
    expect(planProblems(GOOD, en)).toBe(null)
  })

  test('steps without a way to verify them are listed', () => {
    const problems = planProblems(VAGUE, en) ?? ''
    expect(problems).toContain('1. Backend')
    expect(problems).toContain('2. Frontend')
    expect(problems).not.toContain('3. Deploy')
  })

  test('a plan with no list is sent back', () => {
    expect(planProblems('# Shop\n\nJust build it.', en)).toContain('No steps found')
  })

  test('steps past the 20 tracked are flagged', () => {
    const many = Array.from({ length: 21 }, (_, i) => `${i + 1}. Step ${i + 1}: npm test → passed`).join('\n')
    expect(planProblems(many, en)).toContain('21 steps')
  })
})

test('the plan-mode reminder tells Claude how to write trackable steps', async ($, on) => {
  const { reminder } = await planning($, on, GOOD)
  expect(reminder.text).toContain('Plan mode is active.')
  expect(reminder.text).toContain('how you will verify it')
})

test('a vague plan is sent back before the user sees it', async ($, on) => {
  const { approvals } = await planning($, on, VAGUE)

  const result = await $.tool.call({ tool: 'ExitPlanMode' })
  expect(result.deny).toContain('1. Backend')
  expect(approvals).toEqual([])
})

test('a plan that says how each step is verified goes to the user', async ($, on) => {
  const { approvals } = await planning($, on, GOOD)

  const result = await $.tool.call({ tool: 'ExitPlanMode' })
  expect(result.deny).toBeUndefined()
  expect(approvals).toEqual([GOOD])
})

test('after two send-backs the plan goes to the user as it is', async ($, on) => {
  const { approvals } = await planning($, on, VAGUE)

  expect((await $.tool.call({ tool: 'ExitPlanMode' })).deny).toBeDefined()
  expect((await $.tool.call({ tool: 'ExitPlanMode' })).deny).toBeDefined()
  expect((await $.tool.call({ tool: 'ExitPlanMode' })).deny).toBeUndefined()
  expect(approvals).toEqual([VAGUE])
})

test('with no plan file named, the plan is not held up', async ($, on) => {
  on('ui.toast', () => ({ value: undefined }))
  on('fs.read', () => {
    throw new Error('no such file')
  })
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: GOOD, isAgent: false } }))

  const result = await $.tool.call({ tool: 'ExitPlanMode' })
  expect(result.isError).toBeUndefined()
})
