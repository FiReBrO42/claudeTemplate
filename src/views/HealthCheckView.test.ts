import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAdviceStore } from '@/stores/advice'
import { useOrderStore } from '@/stores/order'

import HealthCheckView from './HealthCheckView.vue'

function mountHealthCheckView() {
  return mount(HealthCheckView)
}

describe('HealthCheckView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('無委託單資料時顯示空狀態文案，不渲染分數', () => {
    const wrapper = mountHealthCheckView()

    expect(wrapper.text()).toContain('尚無委託單資料，無法產生健檢報告')
    expect(wrapper.text()).not.toContain('健檢總分')
  })

  it('資料健康時總分 100、燈號為良好，三面向皆無問題', () => {
    const orderStore = useOrderStore()
    // 三標的均分曝險（各約 33%），皆已成交、皆有一致方向的關聯建議、皆填妥停損停利。
    for (const symbol of ['AAA', 'BBB', 'CCC']) {
      const advice = { date: '2026-07-01', symbol, action: 'buy' as const, price: 100, summary: 's', confidence: 3 }
      useAdviceStore().add(advice)
    }
    const adviceStore = useAdviceStore()
    for (const record of adviceStore.records) {
      orderStore.add({
        date: '2026-07-01',
        symbol: record.symbol,
        side: 'buy',
        price: 100,
        shares: 10,
        status: 'filled',
        adviceId: record.id,
        stopLoss: 90,
        takeProfit: 120,
      })
    }

    const wrapper = mountHealthCheckView()

    expect(wrapper.text()).toContain('健檢總分')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('良好')
  })

  it('渲染問題明細：集中度過高、孤兒委託單、觀望仍下單、缺停損停利皆顯示對應文案', () => {
    const orderStore = useOrderStore()
    const adviceStore = useAdviceStore()

    adviceStore.add({ date: '2026-07-01', symbol: 'HOLD1', action: 'hold', price: 100, summary: 's', confidence: 3 })
    const holdAdviceId = adviceStore.records[0]!.id

    // 單一標的 100% 曝險 → 集中度 critical
    orderStore.add({
      date: '2026-07-01',
      symbol: 'AAPL',
      side: 'buy',
      price: 100,
      shares: 10,
      status: 'filled',
      // 無 adviceId → 孤兒
      stopLoss: 90,
      takeProfit: 120,
    })
    // 對觀望建議仍下單 → critical，且缺停損/停利
    orderStore.add({
      date: '2026-07-02',
      symbol: 'AAPL',
      side: 'buy',
      price: 50,
      shares: 1,
      status: 'filled',
      adviceId: holdAdviceId,
    })

    const wrapper = mountHealthCheckView()
    const text = wrapper.text()

    expect(text).toContain('集中度過高')
    expect(text).toContain('無關聯 AI 建議或建議已不存在')
    expect(text).toContain('在 AI 建議為觀望時仍下單')
    expect(text).toContain('缺少停損價')
    expect(text).toContain('缺少停利價')
  })

  it('分數低於 60 時燈號顯示為需檢視', () => {
    const orderStore = useOrderStore()
    // 單一標的 100% 集中度 critical(-15) + 孤兒 warning(-7) + 缺停損 critical(-15) + 缺停利 warning(-7) = 56
    orderStore.add({
      date: '2026-07-01',
      symbol: 'AAPL',
      side: 'buy',
      price: 100,
      shares: 10,
      status: 'filled',
    })

    const wrapper = mountHealthCheckView()

    expect(wrapper.text()).toContain('56')
    expect(wrapper.text()).toContain('需檢視')
  })
})
