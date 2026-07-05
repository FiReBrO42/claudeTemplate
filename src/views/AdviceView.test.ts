import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAdviceStore } from '@/stores/advice'

import AdviceView from './AdviceView.vue'

function mountAdviceView() {
  return mount(AdviceView)
}

describe('AdviceView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('無資料時顯示空狀態文案', () => {
    const wrapper = mountAdviceView()

    expect(wrapper.text()).toContain('尚無投資建議紀錄')
  })

  it('有資料時顯示紀錄，動作文案走 i18n', () => {
    const store = useAdviceStore()
    store.add({
      date: '2026-07-01',
      symbol: 'AAPL',
      action: 'buy',
      price: 150,
      summary: '看多',
      confidence: 4,
    })

    const wrapper = mountAdviceView()

    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).toContain('買進')
  })

  it('依標的關鍵字篩選（不分大小寫子字串）', async () => {
    const store = useAdviceStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', action: 'buy', price: 150, summary: 'a', confidence: 3 })
    store.add({ date: '2026-07-02', symbol: 'TSLA', action: 'sell', price: 200, summary: 'b', confidence: 2 })

    const wrapper = mountAdviceView()
    await wrapper.find('.advice-view__filters input[type="text"]').setValue('aapl')

    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).not.toContain('TSLA')
  })

  it('依日期起訖區間篩選', async () => {
    const store = useAdviceStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', action: 'buy', price: 150, summary: 'a', confidence: 3 })
    store.add({ date: '2026-07-10', symbol: 'TSLA', action: 'sell', price: 200, summary: 'b', confidence: 2 })

    const wrapper = mountAdviceView()
    const dateInputs = wrapper.findAll('.advice-view__filters input[type="date"]')
    await dateInputs[0]!.setValue('2026-07-05')

    expect(wrapper.text()).not.toContain('AAPL')
    expect(wrapper.text()).toContain('TSLA')
  })

  it('點擊刪除鈕會移除該筆紀錄並回到空狀態', async () => {
    const store = useAdviceStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', action: 'buy', price: 150, summary: 'a', confidence: 3 })

    const wrapper = mountAdviceView()
    await wrapper.find('.advice-view__delete').trigger('click')

    expect(store.records).toHaveLength(0)
    expect(wrapper.text()).toContain('尚無投資建議紀錄')
  })
})
