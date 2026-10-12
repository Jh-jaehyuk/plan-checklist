import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Messages } from './messages'
import { messagesFor } from './messages'
import { bandLayout, checkItem, checklistMarkdown, doneCount, extractPlan, filledCells, replayPlan, reminder, sinceLastClose, stepTitle } from './plan'

const plan = atom({ plugin: 'plan-checklist', key: 'plan' } as const, null)
const isExpanded = atom({ plugin: 'plan-checklist', key: 'isExpanded' } as const, false)
// How many steps were done when a stop was last blocked: a step Claude cannot check yet blocks once, not every turn.
const nudgedAt = atom({ plugin: 'plan-checklist', key: 'nudgedAt' } as const, null)

const CHECK_TOOL = 'mcp__plan-checklist__plan_check'

// Session state does not survive a resume (agent view's ←, /resume) or /branch: rebuild it from the transcript.
async function restore($: EngineInterface, t: Messages) {
  if ((await read($, plan)) !== null) {
    return
  }
  const messages = await $.session.messages()
  const restored = replayPlan(sinceLastClose(messages).flatMap(one => one.toolUses), CHECK_TOOL, t)
  if (restored !== null) {
    await update($, plan, () => restored)
  }
}

export const register: Register = (on, options) => {
  const t = messagesFor(options.language)

  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'plan_check',
      description: t.toolDescription,
      inputSchema: {
        type: 'object',
        properties: {
          item: { type: 'integer', description: t.itemParam },
          evidence: { type: 'string', description: t.evidenceParam },
        },
        required: ['item', 'evidence'],
      },
      isDeferred: false,
    })
    await $.command.register({ name: 'checklist', description: t.commandDescription })
    await restore($, t)

    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'resume' || e.source === 'fork') {
      await restore($, t)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true || ran.result.plan === null) {
      return ran
    }

    const extracted = extractPlan(ran.result.plan, t)
    if (extracted === null) {
      $.ui.toast(t.noStepsFound)
      return ran
    }
    await update($, plan, () => extracted)
    await update($, nudgedAt, () => null)
    $.ui.toast(t.tracking(extracted.items.length))

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: CHECK_TOOL }, async ($, e) => {
    // A subagent's word is not verification: it reports evidence, the main agent checks it and the step.
    // This also keeps every check in the main transcript, which a resumed session replays.
    if (e.agentId !== undefined) {
      return { result: t.subagentCheck, isError: true as const }
    }
    const input = e as unknown as { item: number; evidence: string }
    const outcome = checkItem(await read($, plan), Number(input.item), String(input.evidence ?? ''), t)
    if ('error' in outcome) {
      return { result: outcome.error, isError: true as const }
    }

    await update($, plan, () => outcome.plan)
    const done = doneCount(outcome.plan)
    const total = outcome.plan.items.length
    $.ui.toast(done === total ? t.finished(outcome.plan.title) : t.checked(done, total))

    return { result: t.checkResult(input.item, done, total) }
  })

  on('command.run', { command: 'checklist' }, async ($, e) => {
    const current = await read($, plan)
    if (current === null) {
      return { text: t.commandNoPlan }
    }
    // The person ends the plan with steps left: stop tracking it and tell Claude not to carry on with them.
    if (e.args.trim() === 'close') {
      await update($, plan, () => null)
      await update($, nudgedAt, () => null)
      return { text: t.closed(current.title), context: [t.closedNote(current.title)] }
    }
    return { text: checklistMarkdown(current) }
  })

  // The reminder rides each prompt, next to the work, rather than the system prompt.
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const result = await next(e)
    const current = await read($, plan)
    const text = current === null ? null : reminder(current, CHECK_TOOL, t)
    if (text === null) {
      return result
    }
    return { ...result, additionalContext: [...(result.additionalContext ?? []), text] }
  }).catch(($, e, next) => next(e))

  // A reminder can be read past; ending the turn with unchecked steps is stopped once per bit of progress.
  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    const current = await read($, plan)
    const text = current === null ? null : reminder(current, CHECK_TOOL, t)
    if (e.stop_hook_active || result.block !== undefined || current === null || text === null) {
      return result
    }
    const done = doneCount(current)
    if ((await read($, nudgedAt)) === done) {
      return result
    }
    await update($, nudgedAt, () => done)
    return { ...result, block: [text, t.stopGate].join('\n') }
  }).catch(($, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, plan, () => null)
      await update($, nudgedAt, () => null)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, plan)
    if (e.props.hasSurvey || current === null) {
      return next(e)
    }

    const done = doneCount(current)
    const total = current.items.length
    const isDone = done === total
    const nextItem = current.items.findIndex(one => one.evidence === null)
    const expanded = await read($, isExpanded)
    const layout = bandLayout(e.props.bodyColumns)
    const filled = filledCells(done, total, layout.barWidth)
    const { Box, Button, Text } = $.ui.resolve(e)

    // Collapsed: one line with the progress and the step Claude is on, or that all are done.
    // Expanded: the same line titled with the plan, then every step.
    const label = expanded ? current.title : isDone ? t.allDone(total) : stepTitle(current.items[nextItem]?.text ?? '')
    return (
      <Box flexDirection="column">
        <Box columnGap={layout.gap}>
          {layout.barWidth > 0 && (
            <Text>
              <Text color={isDone ? 'success' : 'suggestion'}>{'━'.repeat(filled)}</Text>
              <Text color="subtle">{'─'.repeat(layout.barWidth - filled)}</Text>
            </Text>
          )}
          <Text bold color={isDone ? 'success' : undefined}>
            {done}/{total}
          </Text>
          <Box flexGrow={1}>
            <Text wrap="truncate-end" color={isDone && !expanded ? 'success' : undefined}>
              {!expanded && !isDone && layout.showLabel && <Text dimColor>{t.next}  </Text>}
              {label}
            </Text>
          </Box>
          <Button
            key="toggle"
            label={expanded ? t.hide : t.showAll}
            onPress={() => update($, isExpanded, now => !now)}
          />
        </Box>
        {expanded &&
          current.items.map((one, i) => (
            <Text key={`item-${i}`} wrap="truncate-end" dimColor={i !== nextItem} bold={i === nextItem}>
              {'  '}
              <Text color={one.evidence !== null ? 'success' : undefined}>
                {one.evidence !== null ? '✓' : i === nextItem ? '›' : '○'}
              </Text>{' '}
              {i + 1}. {stepTitle(one.text)}
            </Text>
          ))}
        {expanded && (
          <Text color="subtle">
            {'  '}
            {t.evidenceHint}
          </Text>
        )}
      </Box>
    )
  })
}
