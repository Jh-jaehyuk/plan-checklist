import { expect, test } from 'claude-code/testing'

const PLAN = '# Refund API\n\n1. Write the failing test\n2. Fix the refund logic\n3. Run the full suite'

const band = (bodyColumns: number) => ({
  component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns } as never,
})

test('band drops the label, then the bar, as the pane narrows', async ($, on) => {
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  await $.tool.call({ tool: 'ExitPlanMode' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const at = async (columns: number) => {
      const ui = await $.ui.mount({ plugin: 'plan-checklist', surface, ...band(columns) })
      return { ui, shown: JSON.stringify(await ui.drawn()) }
    }

    const wide = await at(100)
    expect(wide.shown).toContain('─'.repeat(12))
    expect(wide.shown).toContain('"Next"')
    expect(wide.shown).toContain('Write the failing test')
    await wide.ui.unmount()

    const split = await at(50)
    expect(split.shown).toContain('─'.repeat(6))
    expect(split.shown).not.toContain('─'.repeat(7))
    expect(split.shown).not.toContain('"Next"')
    await split.ui.unmount()

    const narrow = await at(30)
    expect(narrow.shown).not.toContain('─')
    expect(narrow.shown).toContain('Write the failing test')
    expect(narrow.shown).not.toContain('Refund API')
    await narrow.ui.press({ key: 'toggle' })
    const expanded = JSON.stringify(await narrow.ui.drawn())
    expect(expanded).toContain('Refund API')
    expect(expanded).toContain('Run the full suite')
    await narrow.ui.press({ key: 'toggle' })
    await narrow.ui.unmount()
  }
})

test('finished plan says it is done instead of naming the plan', { options: { language: 'ko' } }, async ($, on) => {
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', { tool: 'ExitPlanMode' }, () => ({ result: { plan: PLAN, isAgent: false } }))
  await $.tool.call({ tool: 'ExitPlanMode' })
  for (const item of [1, 2, 3]) {
    await $.tool.call({ tool: 'mcp__plan-checklist__plan_check', item, evidence: 'node test.js → ok, exit=0' })
  }

  for (const columns of [100, 30]) {
    const ui = await $.ui.mount({ plugin: 'plan-checklist', surface: 'terminal', ...band(columns) })
    const shown = JSON.stringify(await ui.drawn())
    expect(shown).toContain('3단계 모두 완료')
    expect(shown).not.toContain('Refund API')
    await ui.unmount()
  }
})
