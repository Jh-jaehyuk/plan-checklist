export type PlanItem = { text: string; evidence: string | null }

export type Plan = { title: string; items: PlanItem[] }

declare module 'claude-code' {
  interface PluginState {
    'plan-checklist': { plan: Plan | null; isExpanded: boolean; nudgedAt: number | null }
  }
}
