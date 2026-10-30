export type Lang = 'en' | 'ko'

export type Messages = {
  untitled: string
  noPlan: string
  noSuchItem: (item: number, total: number) => string
  notNext: (item: number, next: number) => string
  allChecked: string
  needEvidence: string
  subagentCheck: string
  reminderTitle: (title: string, done: number, total: number) => string
  reminderLeft: string
  reminderRule: (tool: string) => string
  stopGate: string
  toolDescription: string
  itemParam: string
  evidenceParam: string
  commandDescription: string
  commandNoPlan: string
  closed: (title: string) => string
  closedNote: (title: string) => string
  noStepsFound: string
  planRules: string
  planRulesShort: string
  planSentBack: string
  planNoSteps: string
  planTooMany: (count: number, max: number) => string
  planNoCheck: string
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
    notNext: (item, next) =>
      `Steps are checked in order. The next one is item ${next} (you asked for ${item}). Finish and verify item ${next} first, then check it.`,
    allChecked: 'Every step of this plan is already checked.',
    needEvidence: 'Evidence is required. Give the verification command you actually ran and its result.',
    subagentCheck: 'Only the main agent checks steps off. Put the commands you ran and their results in your report; the main agent verifies them and checks the step.',
    reminderTitle: (title, done, total) => `# Plan in progress: ${title} (${done}/${total})`,
    reminderLeft: 'Remaining items:',
    reminderRule: tool =>
      `Work through the items in order. When you finish an item, call ${tool} with { item, evidence }. Put the verification commands you actually ran in evidence, one per line as "command → result". Do not check an item you have not verified.`,
    stopGate:
      'Before ending the turn, check every step you have verified. For a step you cannot verify yet, say in one line why and what it waits for.',
    toolDescription:
      'Mark the next unchecked item of the plan in progress as done; items are checked in order. Call it only for an item you have verified, and put the verification command you ran and its result in evidence.',
    itemParam: 'Item number (starting at 1)',
    evidenceParam: 'One check per line, "command → result" (e.g. "pytest tests/x.py → 12 passed")',
    commandDescription: 'Show the steps of the plan in progress with their evidence; close stops tracking it',
    commandNoPlan: 'No plan in progress. Approve a plan in plan mode to start tracking it.',
    closed: title => `Closed the plan: ${title}`,
    closedNote: title =>
      `The user closed the plan "${title}" with steps left. Stop tracking it: do not continue its remaining steps unless the user asks.`,
    noStepsFound: 'plan-checklist: no steps found in the plan (use a numbered list or checkboxes)',
    planRules: [
      'plan-checklist turns the plan you write into a checklist. Steps are checked off in order, each only with the verification you ran. Write the steps so they can be tracked:',
      '- Put the steps in one numbered list (or checkboxes), in the order you will do them, 20 at most.',
      '- Make each step one change you can verify on its own. Split a broad area such as "backend", "frontend" or "deploy" into the concrete changes it holds.',
      '- Write each step as "what you will do: how you will verify it", the check a command or an observation with its expected result (e.g. "Add the refund endpoint: pytest tests/test_refund.py passes").',
      '- A small task may need only two or three steps. Do not pad it.',
    ].join('\n'),
    planRulesShort:
      'plan-checklist: steps in one numbered list in the order you will do them, each "what you will do: how you will verify it", one verifiable change per step, 20 at most.',
    planSentBack: 'plan-checklist sent the plan back before the user saw it. Fix the plan file, then call ExitPlanMode again.',
    planNoSteps: 'No steps found. Put the steps in a numbered list or checkboxes.',
    planTooMany: (count, max) => `The plan has ${count} steps and only ${max} can be tracked. Merge steps or split the work into more than one plan.`,
    planNoCheck:
      'These steps do not say how they will be verified. Write each as "what you will do: how you will verify it", and split a step too broad to verify with one check:',
    tracking: count => `Tracking ${count} steps from the approved plan`,
    checked: (done, total) => `Step done (${done}/${total})`,
    finished: title => `All steps done: ${title}`,
    checkResult: (item, done, total) => `Item ${item} checked (${done}/${total})`,
    next: 'Next',
    allDone: total => `✓ All ${total} steps done`,
    showAll: 'Show all',
    hide: 'Hide',
    evidenceHint: '/checklist shows the evidence for each step · /checklist close ends the plan',
  },
  ko: {
    untitled: '계획',
    noPlan: '진행 중인 계획이 없습니다.',
    noSuchItem: (item, total) => `항목 ${item}은 없습니다. 1~${total} 중에서 고르세요.`,
    notNext: (item, next) => `단계는 순서대로 체크합니다. 다음 항목은 ${next}입니다(요청: ${item}). 항목 ${next}부터 끝내고 검증한 뒤 체크하세요.`,
    allChecked: '이 계획의 모든 단계가 이미 체크됐습니다.',
    needEvidence: '증거가 필요합니다. 실제로 돌린 검증 명령과 그 결과를 적으세요.',
    subagentCheck: '단계 체크는 메인 에이전트만 합니다. 돌린 명령과 결과를 보고서에 담으세요. 메인 에이전트가 확인하고 체크합니다.',
    reminderTitle: (title, done, total) => `# 진행 중인 계획: ${title} (${done}/${total})`,
    reminderLeft: '남은 항목:',
    reminderRule: tool =>
      `항목은 순서대로 진행한다. 항목을 끝내면 ${tool}를 { item, evidence }로 호출한다. evidence에는 실제로 돌린 검증을 "명령 → 결과" 형식으로 한 줄에 하나씩 적는다. 검증하지 않은 항목은 체크하지 않는다.`,
    stopGate: '턴을 끝내기 전에 검증을 마친 항목을 모두 체크한다. 아직 검증할 수 없는 항목은 이유와 무엇을 기다리는지 한 줄로 적는다.',
    toolDescription:
      '진행 중인 계획에서 아직 체크하지 않은 다음 항목을 완료로 체크한다. 항목은 순서대로만 체크된다. 실제로 검증을 끝낸 항목에만 호출하고, evidence에 돌린 검증 명령과 결과를 적는다.',
    itemParam: '항목 번호 (1부터)',
    evidenceParam: '검증 하나당 한 줄, "명령 → 결과" (예: "pytest tests/x.py → 12 passed")',
    commandDescription: '진행 중인 계획의 항목과 증거를 보여준다. close로 추적을 끝낸다',
    commandNoPlan: '진행 중인 계획이 없어요. plan 모드에서 계획을 승인하면 생겨요.',
    closed: title => `계획을 닫았어요: ${title}`,
    closedNote: title =>
      `사용자가 단계가 남은 계획 "${title}"을 닫았다. 더 이상 추적하지 않는다. 사용자가 요청하지 않으면 남은 단계를 이어서 진행하지 않는다.`,
    noStepsFound: 'plan-checklist: 계획에서 항목을 찾지 못했어요 (번호 목록이나 체크박스가 필요해요)',
    planRules: [
      'plan-checklist는 작성한 계획을 체크리스트로 만든다. 단계는 순서대로, 실제로 돌린 검증이 있을 때만 체크된다. 추적할 수 있게 단계를 쓴다:',
      '- 단계는 진행할 순서대로 번호 목록(또는 체크박스) 하나에 담고, 20개를 넘기지 않는다.',
      '- 한 단계는 따로 검증할 수 있는 변경 하나다. "백엔드", "프론트엔드", "배포"처럼 넓은 영역은 그 안의 구체적인 변경으로 쪼갠다.',
      '- 각 단계는 "할 일: 검증 방법"으로 쓴다. 검증은 기대 결과가 있는 명령이나 관찰이다 (예: "환불 API 추가: pytest tests/test_refund.py 통과").',
      '- 작은 일은 두세 단계면 충분하다. 단계를 억지로 늘리지 않는다.',
    ].join('\n'),
    planRulesShort: 'plan-checklist: 단계는 진행 순서대로 번호 목록 하나에, 각 단계는 "할 일: 검증 방법", 단계 하나에 검증 가능한 변경 하나, 최대 20개.',
    planSentBack: 'plan-checklist가 사용자에게 보이기 전에 계획을 돌려보냈다. 계획 파일을 고친 뒤 ExitPlanMode를 다시 호출한다.',
    planNoSteps: '단계를 찾지 못했다. 단계를 번호 목록이나 체크박스로 쓴다.',
    planTooMany: (count, max) => `계획의 단계가 ${count}개인데 ${max}개까지만 추적된다. 단계를 합치거나 일을 여러 계획으로 나눈다.`,
    planNoCheck: '다음 단계에는 검증 방법이 없다. 각 단계를 "할 일: 검증 방법"으로 쓰고, 검증 하나로 확인할 수 없을 만큼 넓은 단계는 쪼갠다:',
    tracking: count => `승인된 계획에서 단계 ${count}개를 추적해요`,
    checked: (done, total) => `단계 완료 (${done}/${total})`,
    finished: title => `모든 단계 완료: ${title}`,
    checkResult: (item, done, total) => `항목 ${item} 체크됨 (${done}/${total})`,
    next: '다음',
    allDone: total => `✓ ${total}단계 모두 완료`,
    showAll: '전체 보기',
    hide: '접기',
    evidenceHint: '/checklist 로 단계별 증거를 볼 수 있어요 · /checklist close 로 계획을 닫아요',
  },
}

export const messagesFor = (language: unknown): Messages => MESSAGES[language === 'ko' ? 'ko' : 'en']
