export type Lang = 'en' | 'ko'

export type Messages = {
  untitled: string
  noPlan: string
  noSuchItem: (item: number, total: number) => string
  needEvidence: string
  reminderTitle: (title: string, done: number, total: number) => string
  reminderLeft: string
  reminderRule: (tool: string) => string
  toolDescription: string
  itemParam: string
  evidenceParam: string
  commandDescription: string
  commandNoPlan: string
  noStepsFound: string
  tracking: (count: number) => string
  checked: (done: number, total: number) => string
  finished: (title: string) => string
  checkResult: (item: number, done: number, total: number) => string
  next: string
  allDone: (total: number) => string
  showAll: string
  hide: string
  evidenceHint: string
}

export const MESSAGES: Record<Lang, Messages> = {
  en: {
    untitled: 'Plan',
    noPlan: 'No plan in progress.',
    noSuchItem: (item, total) => `There is no item ${item}. Pick one from 1 to ${total}.`,
    needEvidence: 'Evidence is required. Give the verification command you actually ran and its result.',
    reminderTitle: (title, done, total) => `# Plan in progress: ${title} (${done}/${total})`,
    reminderLeft: 'Remaining items:',
    reminderRule: tool =>
      `When you finish an item, call ${tool} with { item, evidence }. Put the verification command you actually ran and its result in evidence. Do not check an item you have not verified.`,
    toolDescription:
      'Mark one item of the plan in progress as done. Call it only for an item you have verified, and put the verification command you ran and its result in evidence.',
    itemParam: 'Item number (starting at 1)',
    evidenceParam: 'Verification command and result (e.g. "pytest tests/x.py → 12 passed")',
    commandDescription: 'Show the steps of the plan in progress with their evidence',
    commandNoPlan: 'No plan in progress. Approve a plan in plan mode to start tracking it.',
    noStepsFound: 'plan-checklist: no steps found in the plan (use a numbered list or checkboxes)',
    tracking: count => `Tracking ${count} steps from the approved plan`,
    checked: (done, total) => `Step done (${done}/${total})`,
    finished: title => `All steps done: ${title}`,
    checkResult: (item, done, total) => `Item ${item} checked (${done}/${total})`,
    next: 'Next',
    allDone: total => `✓ All ${total} steps done`,
    showAll: 'Show all',
    hide: 'Hide',
    evidenceHint: '/checklist shows the evidence for each step',
  },
  ko: {
    untitled: '계획',
    noPlan: '진행 중인 계획이 없습니다.',
    noSuchItem: (item, total) => `항목 ${item}은 없습니다. 1~${total} 중에서 고르세요.`,
    needEvidence: '증거가 필요합니다. 실제로 돌린 검증 명령과 그 결과를 적으세요.',
    reminderTitle: (title, done, total) => `# 진행 중인 계획: ${title} (${done}/${total})`,
    reminderLeft: '남은 항목:',
    reminderRule: tool =>
      `항목을 끝내면 ${tool}를 { item, evidence }로 호출한다. evidence에는 실제로 돌린 검증 명령과 그 결과를 적는다. 검증하지 않은 항목은 체크하지 않는다.`,
    toolDescription:
      '진행 중인 계획의 항목 하나를 완료로 체크한다. 실제로 검증을 끝낸 항목에만 호출하고, evidence에 돌린 검증 명령과 결과를 적는다.',
    itemParam: '항목 번호 (1부터)',
    evidenceParam: '검증 명령과 결과 (예: "pytest tests/x.py → 12 passed")',
    commandDescription: '진행 중인 계획의 항목과 증거를 보여준다',
    commandNoPlan: '진행 중인 계획이 없어요. plan 모드에서 계획을 승인하면 생겨요.',
    noStepsFound: 'plan-checklist: 계획에서 항목을 찾지 못했어요 (번호 목록이나 체크박스가 필요해요)',
    tracking: count => `승인된 계획에서 단계 ${count}개를 추적해요`,
    checked: (done, total) => `단계 완료 (${done}/${total})`,
    finished: title => `모든 단계 완료: ${title}`,
    checkResult: (item, done, total) => `항목 ${item} 체크됨 (${done}/${total})`,
    next: '다음',
    allDone: total => `✓ ${total}단계 모두 완료`,
    showAll: '전체 보기',
    hide: '접기',
    evidenceHint: '/checklist 로 단계별 증거를 볼 수 있어요',
  },
}

export const messagesFor = (language: unknown): Messages => MESSAGES[language === 'ko' ? 'ko' : 'en']
