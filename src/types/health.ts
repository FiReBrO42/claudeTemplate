/**
 * 委託單健檢報告的共用型別。
 * 由 src/utils/orderHealthCheck.ts 的純函式 runHealthCheck 產出，
 * 供 src/views/HealthCheckView.vue 渲染，規則權威版見
 * docs/plans/2026-07-05-order-health-check.md。
 */

export type Severity = 'ok' | 'warning' | 'critical'

/** 面向 A 的問題代碼 */
export type ConcentrationIssueCode = 'concentration-warning' | 'concentration-critical'

/** 面向 B 的問題代碼 */
export type DeviationIssueCode = 'deviation-orphan' | 'deviation-hold' | 'deviation-opposite'

/** 面向 C 的問題代碼 */
export type RiskControlIssueCode = 'riskControl-missingStopLoss' | 'riskControl-missingTakeProfit'

export type HealthIssueCode = ConcentrationIssueCode | DeviationIssueCode | RiskControlIssueCode

export interface HealthIssue {
  code: HealthIssueCode
  severity: Severity
  /** 逐筆委託單問題（面向 B / C）才有值；面向 A 以 symbol 分組，不對應單筆委託單 */
  orderId?: string
  /** 面向 A（集中度）問題所屬標的 */
  symbol?: string
  /** 供顯示用的補充數值（如集中度佔比 0~1） */
  detail?: Record<string, number | string>
}

export interface DimensionResult {
  /** 該面向所有問題項中的最高嚴重度；無問題為 'ok' */
  severity: Severity
  issues: HealthIssue[]
}

export type ScoreBand = 'good' | 'warning' | 'danger'

export interface HealthReport {
  /** 100 起扣分，下限 0，四捨五入為整數 */
  score: number
  scoreBand: ScoreBand
  concentration: DimensionResult
  deviation: DimensionResult
  riskControl: DimensionResult
}
