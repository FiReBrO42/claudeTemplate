import { describe, expect, it } from 'vitest'

import type { AdviceRecord } from '@/types/advice'
import type { OrderRecord } from '@/types/order'

import { runHealthCheck } from './orderHealthCheck'

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    date: '2026-07-01',
    symbol: 'AAPL',
    side: 'buy',
    price: 100,
    shares: 10,
    status: 'filled',
    ...overrides,
  }
}

function advice(overrides: Partial<AdviceRecord> = {}): AdviceRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    date: '2026-07-01',
    symbol: 'AAPL',
    action: 'buy',
    price: 100,
    summary: '看多',
    confidence: 4,
    ...overrides,
  }
}

describe('runHealthCheck - 空資料', () => {
  it('無委託單時回傳合理報告：score 100、三面向皆 ok、不崩', () => {
    const report = runHealthCheck([], [])

    expect(report.score).toBe(100)
    expect(report.scoreBand).toBe('good')
    expect(report.concentration.severity).toBe('ok')
    expect(report.concentration.issues).toEqual([])
    expect(report.deviation.severity).toBe('ok')
    expect(report.riskControl.severity).toBe('ok')
  })
})

describe('runHealthCheck - 面向 A 集中度', () => {
  it('母體為空（無已成交買單）時 ok，且不產生 NaN', () => {
    const orders = [order({ status: 'unfilled' }), order({ status: 'cancelled' }), order({ side: 'sell' })]

    const report = runHealthCheck(orders, [])

    expect(report.concentration.severity).toBe('ok')
    expect(report.concentration.issues).toEqual([])
    for (const issue of report.concentration.issues) {
      expect(Number.isNaN(issue.detail?.ratio)).toBe(false)
    }
  })

  it('單一標的佔比 100%（唯一標的）→ critical', () => {
    const orders = [order({ symbol: 'AAPL', price: 100, shares: 10, status: 'filled', side: 'buy' })]

    const report = runHealthCheck(orders, [])

    expect(report.concentration.severity).toBe('critical')
    expect(report.concentration.issues).toHaveLength(1)
    expect(report.concentration.issues[0]?.code).toBe('concentration-critical')
    expect(report.concentration.issues[0]?.symbol).toBe('AAPL')
  })

  it('佔比恰為 0.6（邊界，未超過）→ 不算 critical', () => {
    // AAPL 曝險 600、TSLA 曝險 400，總 1000，AAPL 佔比 0.6（非 >0.6）
    const orders = [
      order({ symbol: 'AAPL', price: 60, shares: 10 }),
      order({ symbol: 'TSLA', price: 40, shares: 10 }),
    ]

    const report = runHealthCheck(orders, [])

    const aaplIssue = report.concentration.issues.find((issue) => issue.symbol === 'AAPL')
    expect(aaplIssue?.code).not.toBe('concentration-critical')
  })

  it('佔比恰為 0.4（邊界，未超過）→ 不算 warning', () => {
    // 三標的均分：各佔比 1/3 < 0.4，改用兩標的各 0.5 測試 >0.4 的情況於下一測試
    const orders = [
      order({ symbol: 'AAA', price: 40, shares: 10 }),
      order({ symbol: 'BBB', price: 60, shares: 10 }),
    ]
    // AAA 佔比 0.4（非 >0.4）
    const report = runHealthCheck(orders, [])
    const aaaIssue = report.concentration.issues.find((issue) => issue.symbol === 'AAA')
    expect(aaaIssue).toBeUndefined()
  })

  it('佔比 0.5（>0.4 且 <=0.6）→ warning', () => {
    const orders = [
      order({ symbol: 'AAPL', price: 50, shares: 10 }),
      order({ symbol: 'TSLA', price: 50, shares: 10 }),
    ]

    const report = runHealthCheck(orders, [])

    expect(report.concentration.severity).toBe('warning')
    expect(report.concentration.issues).toHaveLength(2)
    expect(report.concentration.issues.every((issue) => issue.code === 'concentration-warning')).toBe(true)
  })

  it('只計算已成交買單：unfilled/cancelled/sell 不計入母體與曝險', () => {
    const orders = [
      order({ symbol: 'AAPL', price: 100, shares: 10, status: 'filled', side: 'buy' }),
      order({ symbol: 'TSLA', price: 999, shares: 999, status: 'unfilled', side: 'buy' }),
      order({ symbol: 'MSFT', price: 999, shares: 999, status: 'filled', side: 'sell' }),
      order({ symbol: 'NFLX', price: 999, shares: 999, status: 'cancelled', side: 'buy' }),
    ]

    const report = runHealthCheck(orders, [])

    // 母體只有 AAPL 一筆，佔比 100% → critical，且不受其餘噪音影響
    expect(report.concentration.issues).toHaveLength(1)
    expect(report.concentration.issues[0]?.symbol).toBe('AAPL')
  })
})

describe('runHealthCheck - 面向 B 偏離關聯 AI 建議', () => {
  it('無 adviceId → 孤兒委託單，warning', () => {
    const orders = [order({ adviceId: undefined })]

    const report = runHealthCheck(orders, [])

    expect(report.deviation.severity).toBe('warning')
    expect(report.deviation.issues[0]?.code).toBe('deviation-orphan')
  })

  it('adviceId 指向不存在的建議 → 孤兒委託單，warning', () => {
    const orders = [order({ adviceId: 'not-exist' })]

    const report = runHealthCheck(orders, [])

    expect(report.deviation.severity).toBe('warning')
    expect(report.deviation.issues[0]?.code).toBe('deviation-orphan')
  })

  it('關聯建議為 hold，仍下單 → critical（優先於方向判定）', () => {
    const a = advice({ action: 'hold' })
    const orders = [order({ adviceId: a.id, side: 'buy' })]

    const report = runHealthCheck(orders, [a])

    expect(report.deviation.severity).toBe('critical')
    expect(report.deviation.issues[0]?.code).toBe('deviation-hold')
  })

  it('方向相反（建議 buy，委託 sell）→ critical', () => {
    const a = advice({ action: 'buy' })
    const orders = [order({ adviceId: a.id, side: 'sell' })]

    const report = runHealthCheck(orders, [a])

    expect(report.deviation.severity).toBe('critical')
    expect(report.deviation.issues[0]?.code).toBe('deviation-opposite')
  })

  it('方向相反（建議 sell，委託 buy）→ critical', () => {
    const a = advice({ action: 'sell' })
    const orders = [order({ adviceId: a.id, side: 'buy' })]

    const report = runHealthCheck(orders, [a])

    expect(report.deviation.severity).toBe('critical')
    expect(report.deviation.issues[0]?.code).toBe('deviation-opposite')
  })

  it('方向一致 → 無問題', () => {
    const a = advice({ action: 'buy' })
    const orders = [order({ adviceId: a.id, side: 'buy' })]

    const report = runHealthCheck(orders, [a])

    expect(report.deviation.severity).toBe('ok')
    expect(report.deviation.issues).toEqual([])
  })

  it('已取消的委託單不列入母體', () => {
    const orders = [order({ status: 'cancelled', adviceId: undefined })]

    const report = runHealthCheck(orders, [])

    expect(report.deviation.issues).toEqual([])
  })
})

describe('runHealthCheck - 面向 C 停損/風控欄位完整性', () => {
  it('已成交委託單缺停損價 → critical', () => {
    const orders = [order({ status: 'filled', stopLoss: undefined, takeProfit: 90 })]

    const report = runHealthCheck(orders, [])

    expect(report.riskControl.severity).toBe('critical')
    expect(report.riskControl.issues.some((issue) => issue.code === 'riskControl-missingStopLoss')).toBe(true)
  })

  it('已成交委託單缺停利價 → warning', () => {
    const orders = [order({ status: 'filled', stopLoss: 90, takeProfit: undefined })]

    const report = runHealthCheck(orders, [])

    expect(report.riskControl.severity).toBe('warning')
    expect(report.riskControl.issues.some((issue) => issue.code === 'riskControl-missingTakeProfit')).toBe(true)
  })

  it('已成交委託單兩者皆缺 → 同時列出兩條問題，嚴重度取最高（critical）', () => {
    const orders = [order({ status: 'filled', stopLoss: undefined, takeProfit: undefined })]

    const report = runHealthCheck(orders, [])

    expect(report.riskControl.severity).toBe('critical')
    expect(report.riskControl.issues).toHaveLength(2)
  })

  it('兩者皆有 → 無問題', () => {
    const orders = [order({ status: 'filled', stopLoss: 90, takeProfit: 120 })]

    const report = runHealthCheck(orders, [])

    expect(report.riskControl.severity).toBe('ok')
    expect(report.riskControl.issues).toEqual([])
  })

  it('僅檢查已成交委託單：unfilled/cancelled 即使缺欄位也不列入', () => {
    const orders = [
      order({ status: 'unfilled', stopLoss: undefined, takeProfit: undefined }),
      order({ status: 'cancelled', stopLoss: undefined, takeProfit: undefined }),
    ]

    const report = runHealthCheck(orders, [])

    expect(report.riskControl.issues).toEqual([])
  })
})

describe('runHealthCheck - 整體評分', () => {
  it('每個 critical 扣 15、每個 warning 扣 7，從 100 起算', () => {
    // 建構恰好 1 個 critical（缺停損）+ 1 個 warning（缺停利）
    const orders = [order({ status: 'filled', adviceId: undefined, stopLoss: undefined, takeProfit: undefined })]
    // 為避免集中度/偏離的額外問題干擾扣分計算，改為分開驗證：
    // 這裡刻意只用一筆單一標的且無建議關聯，會同時觸發：
    // - concentration: 單一標的 100% → critical
    // - deviation: 孤兒 → warning
    // - riskControl: 缺停損 critical + 缺停利 warning
    // 共 2 個 critical + 2 個 warning = 100 - 2*15 - 2*7 = 56
    const report = runHealthCheck(orders, [])

    expect(report.score).toBe(56)
  })

  it('扣分下限為 0，不會變負數', () => {
    const orders = Array.from({ length: 10 }, () =>
      order({
        symbol: `SYM-${crypto.randomUUID()}`,
        status: 'filled',
        adviceId: undefined,
        stopLoss: undefined,
        takeProfit: undefined,
      }),
    )

    const report = runHealthCheck(orders, [])

    expect(report.score).toBe(0)
    expect(report.scoreBand).toBe('danger')
  })

  it('score 燈號帶：>=80 good、60-79 warning、<60 danger', () => {
    expect(runHealthCheck([], []).scoreBand).toBe('good')

    // 1 個 warning：100-7=93 仍 good；再加另一 warning 湊到 60~79 區間需另組資料，改直接驗證邊界透過分數反推較脆弱，
    // 故改用單筆委託單（缺停利=warning，7 分，93 分 good）驗證下限鄰近情境已足夠覆蓋分支。
    const oneWarning = runHealthCheck(
      [order({ status: 'filled', adviceId: undefined, stopLoss: 90, takeProfit: undefined, symbol: 'ONLY' })],
      [],
    )
    // ONLY 為唯一標的，集中度 100% critical(-15) + 偏離孤兒 warning(-7) + 缺停利 warning(-7) = 100-15-7-7=71
    expect(oneWarning.score).toBe(71)
    expect(oneWarning.scoreBand).toBe('warning')
  })
})
