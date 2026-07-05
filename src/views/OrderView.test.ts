import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { useOrderStore } from '@/stores/order'

import OrderView from './OrderView.vue'

async function mountOrderView(initialPath = '/order'): Promise<{ wrapper: ReturnType<typeof mount>; router: Router }> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/order', name: 'order', component: OrderView }],
  })
  router.push(initialPath)
  await router.isReady()

  const wrapper = mount(OrderView, {
    global: {
      plugins: [router],
    },
  })
  return { wrapper, router }
}

describe('OrderView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('無資料時顯示空狀態文案', async () => {
    const { wrapper } = await mountOrderView()

    expect(wrapper.text()).toContain('尚無委託單記錄')
  })

  it('可新增委託單，出現在列表中', async () => {
    const { wrapper } = await mountOrderView()

    await wrapper.find('#order-date').setValue('2026-07-01')
    await wrapper.find('#order-symbol').setValue('aapl')
    await wrapper.find('#order-side').setValue('buy')
    await wrapper.find('#order-price').setValue('150')
    await wrapper.find('#order-shares').setValue('10')
    await wrapper.find('#order-status').setValue('unfilled')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('AAPL')
    const store = useOrderStore()
    expect(store.records).toHaveLength(1)
  })

  it('股數非正整數時擋下並顯示驗證訊息', async () => {
    const { wrapper } = await mountOrderView()

    await wrapper.find('#order-date').setValue('2026-07-01')
    await wrapper.find('#order-symbol').setValue('AAPL')
    await wrapper.find('#order-price').setValue('150')
    await wrapper.find('#order-shares').setValue('1.5')
    await wrapper.find('form').trigger('submit.prevent')

    const store = useOrderStore()
    expect(store.records).toHaveLength(0)
    expect(wrapper.text()).toContain('股數須為大於 0 的正整數')
  })

  it('依狀態篩選：選定狀態只顯示該狀態，選全部顯示全部', async () => {
    const store = useOrderStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', side: 'buy', price: 150, shares: 10, status: 'filled' })
    store.add({ date: '2026-07-02', symbol: 'TSLA', side: 'sell', price: 200, shares: 5, status: 'unfilled' })

    const { wrapper } = await mountOrderView()

    await wrapper.find('.order-view__filters select').setValue('filled')
    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).not.toContain('TSLA')

    await wrapper.find('.order-view__filters select').setValue('')
    expect(wrapper.text()).toContain('AAPL')
    expect(wrapper.text()).toContain('TSLA')
  })

  it('點擊編輯後修改送出會更新該筆而非新增一筆', async () => {
    const store = useOrderStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', side: 'buy', price: 150, shares: 10, status: 'unfilled' })
    const id = store.records[0]!.id

    const { wrapper } = await mountOrderView()
    await wrapper.find('.order-view__edit').trigger('click')

    await wrapper.find('#order-shares').setValue('20')
    await wrapper.find('form').trigger('submit.prevent')

    expect(store.records).toHaveLength(1)
    expect(store.records[0]!.id).toBe(id)
    expect(store.records[0]!.shares).toBe(20)
  })

  it('點擊刪除後該筆從列表與 store 消失', async () => {
    const store = useOrderStore()
    store.add({ date: '2026-07-01', symbol: 'AAPL', side: 'buy', price: 150, shares: 10, status: 'unfilled' })

    const { wrapper } = await mountOrderView()
    await wrapper.find('.order-view__delete').trigger('click')

    expect(store.records).toHaveLength(0)
    expect(wrapper.text()).toContain('尚無委託單記錄')
  })

  it('從 route query 帶入 symbol/side/adviceId 時預填表單', async () => {
    const { wrapper } = await mountOrderView('/order?symbol=AAPL&side=buy&adviceId=advice-1')

    expect((wrapper.find('#order-symbol').element as HTMLInputElement).value).toBe('AAPL')
    expect((wrapper.find('#order-side').element as HTMLSelectElement).value).toBe('buy')
    expect(wrapper.text()).toContain('advice-1')
  })

  it('非法 side query（非 buy/sell）會被忽略，不影響預設值', async () => {
    const { wrapper } = await mountOrderView('/order?symbol=AAPL&side=hold')

    expect((wrapper.find('#order-side').element as HTMLSelectElement).value).toBe('buy')
  })
})
