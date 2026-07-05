import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import type { OrderRecord } from '@/types/order'

import { useOrderStore } from './order'

const STORAGE_KEY = 'invest.orders.records'

function baseRecord(): Omit<OrderRecord, 'id'> {
  return {
    date: '2026-07-01',
    symbol: 'AAPL',
    side: 'buy',
    price: 150,
    shares: 10,
    status: 'unfilled',
  }
}

describe('useOrderStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('初始化時 records 為空陣列', () => {
    const store = useOrderStore()
    expect(store.records).toEqual([])
  })

  it('add 會生成 id 並加入 records', () => {
    const store = useOrderStore()
    store.add(baseRecord())

    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBeTruthy()
    expect(store.records[0].symbol).toBe('AAPL')
  })

  it('add 可附帶 adviceId 建立關聯', () => {
    const store = useOrderStore()
    store.add({ ...baseRecord(), adviceId: 'advice-1' })

    expect(store.records[0].adviceId).toBe('advice-1')
  })

  it('update 會依 id 更新對應紀錄且保留原 id', () => {
    const store = useOrderStore()
    store.add(baseRecord())
    const id = store.records[0].id

    store.update(id, { ...baseRecord(), status: 'filled', shares: 20 })

    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBe(id)
    expect(store.records[0].status).toBe('filled')
    expect(store.records[0].shares).toBe(20)
  })

  it('update 遇到不存在的 id 時不變動 records', () => {
    const store = useOrderStore()
    store.add(baseRecord())

    store.update('not-exist-id', { ...baseRecord(), status: 'cancelled' })

    expect(store.records).toHaveLength(1)
    expect(store.records[0].status).toBe('unfilled')
  })

  it('remove 會移除對應 id 的紀錄', () => {
    const store = useOrderStore()
    store.add(baseRecord())
    const id = store.records[0].id

    store.remove(id)

    expect(store.records).toHaveLength(0)
  })

  it('新增後會寫入 localStorage（key: invest.orders.records）', async () => {
    const store = useOrderStore()
    store.add(baseRecord())

    await nextTick()

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1)
  })

  it('update 後會同步寫入 localStorage', async () => {
    const store = useOrderStore()
    store.add(baseRecord())
    const id = store.records[0].id

    store.update(id, { ...baseRecord(), status: 'filled' })
    await nextTick()

    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw ?? '[]') as OrderRecord[]
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.status).toBe('filled')
  })

  it('remove 後會同步從 localStorage 消失', async () => {
    const store = useOrderStore()
    store.add(baseRecord())
    const id = store.records[0].id

    store.remove(id)
    await nextTick()

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(JSON.parse(raw ?? '[]')).toHaveLength(0)
  })

  it('初始化時會從 localStorage 載入既有資料', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...baseRecord(), id: 'fixed-id' }]))

    const store = useOrderStore()

    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBe('fixed-id')
  })

  it('localStorage 資料損毀（非合法 JSON）時回退空陣列', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')

    const store = useOrderStore()

    expect(store.records).toEqual([])
  })
})
