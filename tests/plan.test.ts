import { describe, expect, test } from 'claude-code/testing'

import { MESSAGES } from '../hooks/messages'
import { checkItem, checklistMarkdown, evidenceLines, extractPlan, reminder, stepTitle } from '../hooks/plan'

const ko = MESSAGES.ko

const PLAN = `# 결제 취소 API

## Context
- 배경 설명은 항목이 아니다

## Steps
1. 재현 테스트 작성
2. **환불 로직** 수정
3. \`pytest\` 전체 통과 확인
`

describe('extractPlan', () => {
  test('numbered steps win over context bullets', () => {
    expect(extractPlan(PLAN, ko)).toEqual({
      title: '결제 취소 API',
      items: [
        { text: '재현 테스트 작성', evidence: null },
        { text: '환불 로직 수정', evidence: null },
        { text: 'pytest 전체 통과 확인', evidence: null },
      ],
    })
  })

  test('checkboxes win over numbers', () => {
    expect(extractPlan('1. a\n- [ ] b\n- [x] c', ko)?.items.map(i => i.text)).toEqual(['b', 'c'])
  })

  test('plan without list yields null', () => {
    expect(extractPlan('# t\n그냥 문단', ko)).toBe(null)
  })
})

describe('checkItem', () => {
  const plan = extractPlan(PLAN, ko)

  test('rejects missing evidence', () => {
    expect(checkItem(plan, 1, '  done ', ko)).toEqual({
      error: '증거가 필요합니다. 실제로 돌린 검증 명령과 그 결과를 적으세요.',
    })
  })

  test('rejects out of range item', () => {
    expect('error' in checkItem(plan, 4, 'pytest → 3 passed', ko)).toBe(true)
  })

  test('records evidence and shrinks reminder', () => {
    const outcome = checkItem(plan, 1, 'pytest tests/test_refund.py → 1 failed (RED)', ko)
    if (!('plan' in outcome)) throw new Error('expected plan')
    expect(outcome.plan.items[0]?.evidence).toBe('pytest tests/test_refund.py → 1 failed (RED)')
    const text = reminder(outcome.plan, 'T', ko) ?? ''
    expect(text).toContain('(1/3)')
    expect(text).not.toContain('1. 재현 테스트 작성')
    expect(text).toContain('2. 환불 로직 수정')
  })

  test('no reminder once everything is checked', () => {
    let current = plan
    for (const n of [1, 2, 3]) {
      const outcome = checkItem(current, n, 'pytest → 3 passed', ko)
      if (!('plan' in outcome)) throw new Error('expected plan')
      current = outcome.plan
    }
    expect(current === null ? 'x' : reminder(current, 'T', ko)).toBe(null)
  })
})

test('approved plan becomes todos, check needs evidence, clear wipes it', { options: { language: 'ko' } }, async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  on('session.end', (_$, e) => ({ sessionId: e.sessionId }))

  await $.tool.call({ tool: 'ExitPlanMode' })
  expect(toasts).toEqual(['승인된 계획에서 단계 3개를 추적해요'])

  const bare = await $.tool.call({ tool: 'mcp__plan-checklist__plan_check', item: 1, evidence: '' })
  expect(bare.isError).toBe(true)

  const ok = await $.tool.call({ tool: 'mcp__plan-checklist__plan_check', item: 1, evidence: 'pytest → 1 failed (RED 확인)' })
  expect(ok.isError).toBeUndefined()
  expect(toasts.at(-1)).toBe('단계 완료 (1/3)')

  await $.session.end({ reason: 'clear', sessionId: 's', resume: { id: 's' } } as never)
  const after = await $.tool.call({ tool: 'mcp__plan-checklist__plan_check', item: 2, evidence: 'pytest → 3 passed' })
  expect(after.isError).toBe(true)
})

test('english is the default language', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))

  await $.tool.call({ tool: 'ExitPlanMode' })
  expect(toasts).toEqual(['Tracking 3 steps from the approved plan'])

  const bare = await $.tool.call({ tool: 'mcp__plan-checklist__plan_check', item: 1, evidence: 'done' })
  expect(bare.isError).toBe(true)
  expect(JSON.stringify(bare)).toContain('Evidence is required')
})

describe('checklist readability', () => {
  test('step title is the text before the first colon', () => {
    expect(stepTitle('Compose 뼈대 작성: docker compose up 후 curl')).toBe('Compose 뼈대 작성')
    expect(stepTitle('curl localhost:8000/health 확인')).toBe('curl localhost:8000/health 확인')
    expect(stepTitle('재현 테스트 작성')).toBe('재현 테스트 작성')
  })

  test('evidence splits into one check per line', () => {
    expect(evidenceLines('curl /health → 200; alembic current → head\npytest → 4 passed\n')).toEqual([
      'curl /health → 200',
      'alembic current → head',
      'pytest → 4 passed',
    ])
  })

  test('checklist is plain text: short titles, one evidence check per indented line', () => {
    const plan = {
      title: '게시판',
      items: [
        { text: '뼈대 작성: compose up 후 확인', evidence: 'curl /health → 200; alembic → `head`' },
        { text: '로그인 구현: pytest', evidence: null },
        { text: '권한 구현', evidence: null },
      ],
    }
    expect(checklistMarkdown(plan)).toBe(
      [
        '게시판 · 1/3',
        '',
        '✓ 1. 뼈대 작성',
        '     curl /health → 200',
        '     alembic → `head`',
        '',
        '› 2. 로그인 구현',
        '',
        '○ 3. 권한 구현',
      ].join('\n'),
    )
  })
})
