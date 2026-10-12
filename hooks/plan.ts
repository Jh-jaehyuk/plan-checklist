import type { Plan, PlanItem } from '../types'

import type { Messages } from './messages'

const MAX_ITEMS = 20
const MIN_EVIDENCE = 8

const clean = (text: string) => text.replace(/\*\*|`/g, '').trim()

// The first format that matches becomes the steps: checkboxes, then top-level numbers, then top-level bullets.
const PATTERNS = [/^\s*[-*]\s+\[[ xX]\]\s+(.+)$/, /^\d+[.)]\s+(.+)$/, /^[-*]\s+(.+)$/]

export function extractPlan(markdown: string, t: Messages): Plan | null {
  const lines = markdown.split('\n')
  const title = clean(lines.find(line => /^#\s+/.test(line))?.replace(/^#\s+/, '') ?? t.untitled)

  for (const pattern of PATTERNS) {
    const items: PlanItem[] = lines
      .map(line => pattern.exec(line)?.[1])
      .filter((text): text is string => text !== undefined)
      .map(text => ({ text: clean(text), evidence: null }))
    if (items.length > 0) {
      return { title, items: items.slice(0, MAX_ITEMS) }
    }
  }
  return null
}

export type CheckOutcome = { plan: Plan } | { error: string }

export function checkItem(plan: Plan | null, item: number, evidence: string, t: Messages): CheckOutcome {
  if (plan === null) {
    return { error: t.noPlan }
  }
  const target = plan.items[item - 1]
  if (target === undefined) {
    return { error: t.noSuchItem(item, plan.items.length) }
  }
  if (evidence.trim().length < MIN_EVIDENCE) {
    return { error: t.needEvidence }
  }
  const items = plan.items.map((one, i) =>
    i === item - 1 ? { ...one, evidence: evidence.trim() } : one,
  )
  return { plan: { ...plan, items } }
}

// What the transcript holds of one tool call, as `$.session.messages()` lists it.
export type ToolUseRecord = { tool: string; input: Record<string, unknown>; result?: unknown; text?: string }

// `/checklist close` as the transcript keeps it. The note it leaves Claude is a meta row `$.session.messages()` skips.
const CLOSE_ROW = /<command-name>\/(?:plan-checklist:)?checklist<\/command-name>[\s\S]*<command-args>\s*close\s*<\/command-args>/

// Only what came after the last `/checklist close`: a closed plan must not come back on resume.
export function sinceLastClose<M extends { role: string; text: string }>(messages: readonly M[]): M[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const one = messages[i]
    if (one !== undefined && one.role === 'user' && CLOSE_ROW.test(one.text)) {
      return messages.slice(i + 1)
    }
  }
  return [...messages]
}

// A resumed session starts with empty state: replay its approved plans and checks to get the plan back.
export function replayPlan(toolUses: ToolUseRecord[], checkTool: string, t: Messages): Plan | null {
  let plan: Plan | null = null
  for (const use of toolUses) {
    const record = use.result as { plan?: unknown } | undefined
    if (use.tool === 'ExitPlanMode' && typeof record?.plan === 'string') {
      plan = extractPlan(record.plan, t) ?? plan
    } else if (use.tool === checkTool && use.text !== undefined) {
      const outcome = checkItem(plan, Number(use.input.item), String(use.input.evidence ?? ''), t)
      if ('plan' in outcome) {
        plan = outcome.plan
      }
    }
  }
  return plan
}

export const doneCount = (plan: Plan) => plan.items.filter(one => one.evidence !== null).length

export function reminder(plan: Plan, tool: string, t: Messages): string | null {
  const left = plan.items
    .map((one, i) => ({ ...one, n: i + 1 }))
    .filter(one => one.evidence === null)
  if (left.length === 0) {
    return null
  }
  return [
    t.reminderTitle(plan.title, doneCount(plan), plan.items.length),
    t.reminderLeft,
    ...left.map(one => `${one.n}. ${one.text}`),
    t.reminderRule(tool),
  ].join('\n')
}

// How many of `width` cells the progress bar fills.
export const filledCells = (done: number, total: number, width: number) =>
  total === 0 ? 0 : Math.round((done / total) * width)

export type BandLayout = { barWidth: number; gap: number; showLabel: boolean }

// The band shrinks for narrow panes (tmux splits): the word label goes first, then the bar.
export const bandLayout = (columns: number): BandLayout =>
  columns >= 70
    ? { barWidth: 12, gap: 2, showLabel: true }
    : columns >= 45
      ? { barWidth: 6, gap: 1, showLabel: false }
      : { barWidth: 0, gap: 1, showLabel: false }

// "Write the test: run pytest" → "Write the test"; a colon inside a word (localhost:8000) is not a split.
export const stepTitle = (text: string) => text.split(/:\s/)[0]?.trim() || text

export const evidenceLines = (evidence: string) =>
  evidence
    .split(/\n|;\s/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

export function checklistMarkdown(plan: Plan): string {
  const nextItem = plan.items.findIndex(one => one.evidence === null)
  const blocks = plan.items.map((one, i) => {
    const mark = one.evidence !== null ? '✓' : i === nextItem ? '›' : '○'
    const evidence = one.evidence === null ? [] : evidenceLines(one.evidence).map(line => `     ${line}`)
    return [`${mark} ${i + 1}. ${stepTitle(one.text)}`, ...evidence].join('\n')
  })
  return [`${plan.title} · ${doneCount(plan)}/${plan.items.length}`, ...blocks].join('\n\n')
}
