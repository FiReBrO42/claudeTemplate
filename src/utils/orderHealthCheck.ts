/**
 * 委託單健檢規則引擎。純函式，不依賴 Pinia / DOM，
 * 規則權威版見 docs/plans/2026-07-05-order-health-check.md。
 */

import type { AdviceRecord } from '@/types/advice'
import type { DimensionResult, HealthIssue, HealthReport, ScoreBand, Severity } from '@/types/health'
import type { OrderRecord } from '@/types/order'

/** 面向 A：單一標的曝險佔比超過此值 → warning（且未超過 critical 門檻） */
const CONCENTRATION_WARNING_THRESHOLD = 0.4
/** 面向 A：單一標的曝險佔比超過此值 → critical */
const CONCENTRATION_CRITICAL_THRESHOLD = 0.6

/** 整體評分：每個 critical 問題扣分 */
const CRITICAL_PENALTY = 15
/** 整體評分：每個 warning 問題扣分 */
const WARNING_PENALTY = 7

/** 燈號帶門檻：分數 >= 此值 → good */
const SCORE_GOOD_THRESHOLD = 80
/** 燈號帶門檻：分數 >= 此值（且 < good 門檻）→ warning，否則 danger */
const SCORE_WARNING_THRESHOLD = 60

const SEVERITY_RANK: Record<Severity, number> = { ok: 0, warning: 1, critical: 2 }

function highestSeverity(issues: HealthIssue[]): Severity {
  let result: Severity = 'ok'
  for (const issue of issues) {
    if (SEVERITY_RANK[issue.severity] > SEVERITY_RANK[result]) result = issue.severity
  }
  return result
}

/** 面向 A — 風險集中度：母體為已成交買單，依 symbol 分組計算曝險佔比 */
function checkConcentration(orders: OrderRecord[]): DimensionResult {
  const filledBuys = orders.filter((order) => order.status === 'filled' && order.side === 'buy')

  const exposureBySymbol = new Map<string, number>()
  let totalExposure = 0
  for (const order of filledBuys) {
    const exposure = order.price * order.shares
    exposureBySymbol.set(order.symbol, (exposureBySymbol.get(order.symbol) ?? 0) + exposure)
    totalExposure += exposure
  }

  const issues: HealthIssue[] = []
  // 除零保護：母體為空（無已成交買單）時總曝險為 0，直接回傳 ok，不做除法。
  if (totalExposure > 0) {
    for (const [symbol, exposure] of exposureBySymbol) {
      const ratio = exposure / totalExposure
      if (ratio > CONCENTRATION_CRITICAL_THRESHOLD) {
        issues.push({ code: 'concentration-critical', severity: 'critical', symbol, detail: { ratio } })
      } else if (ratio > CONCENTRATION_WARNING_THRESHOLD) {
        issues.push({ code: 'concentration-warning', severity: 'warning', symbol, detail: { ratio } })
      }
    }
  }

  return { severity: highestSeverity(issues), issues }
}

/** 面向 B — 偏離關聯 AI 建議：母體為未取消委託單，一筆最多列一條最嚴重問題 */
function checkDeviation(orders: OrderRecord[], advices: AdviceRecord[]): DimensionResult {
  const adviceById = new Map(advices.map((advice) => [advice.id, advice]))
  const population = orders.filter((order) => order.status !== 'cancelled')

  const issues: HealthIssue[] = []
  for (const order of population) {
    const advice = order.adviceId ? adviceById.get(order.adviceId) : undefined

    if (!order.adviceId || !advice) {
      issues.push({ code: 'deviation-orphan', severity: 'warning', orderId: order.id })
      continue
    }

    if (advice.action === 'hold') {
      issues.push({ code: 'deviation-hold', severity: 'critical', orderId: order.id })
      continue
    }

    const isOpposite =
      (advice.action === 'buy' && order.side === 'sell') || (advice.action === 'sell' && order.side === 'buy')
    if (isOpposite) {
      issues.push({ code: 'deviation-opposite', severity: 'critical', orderId: order.id })
    }
  }

  return { severity: highestSeverity(issues), issues }
}

/** 面向 C — 停損/風控欄位完整性：母體為已成交委託單，一筆可同時列兩條 */
function checkRiskControl(orders: OrderRecord[]): DimensionResult {
  const population = orders.filter((order) => order.status === 'filled')

  const issues: HealthIssue[] = []
  for (const order of population) {
    if (order.stopLoss === undefined || order.stopLoss === null) {
      issues.push({ code: 'riskControl-missingStopLoss', severity: 'critical', orderId: order.id })
    }
    if (order.takeProfit === undefined || order.takeProfit === null) {
      issues.push({ code: 'riskControl-missingTakeProfit', severity: 'warning', orderId: order.id })
    }
  }

  return { severity: highestSeverity(issues), issues }
}

function calculateScore(allIssues: HealthIssue[]): number {
  const penalty = allIssues.reduce((sum, issue) => {
    if (issue.severity === 'critical') return sum + CRITICAL_PENALTY
    if (issue.severity === 'warning') return sum + WARNING_PENALTY
    return sum
  }, 0)

  return Math.max(0, Math.round(100 - penalty))
}

function getScoreBand(score: number): ScoreBand {
  if (score >= SCORE_GOOD_THRESHOLD) return 'good'
  if (score >= SCORE_WARNING_THRESHOLD) return 'warning'
  return 'danger'
}

/** 對全部委託單執行健檢，產出三面向結果與整體分數。純函式，不讀寫任何外部狀態。 */
export function runHealthCheck(orders: OrderRecord[], advices: AdviceRecord[]): HealthReport {
  const concentration = checkConcentration(orders)
  const deviation = checkDeviation(orders, advices)
  const riskControl = checkRiskControl(orders)

  const score = calculateScore([...concentration.issues, ...deviation.issues, ...riskControl.issues])

  return {
    score,
    scoreBand: getScoreBand(score),
    concentration,
    deviation,
    riskControl,
  }
}
