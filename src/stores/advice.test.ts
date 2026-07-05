import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import type { AdviceRecord } from '@/types/advice'

import { useAdviceStore } from './advice'

const STORAGE_KEY = 'invest.advice.records'

function baseRecord(): Omit<AdviceRecord, 'id'> {
  return {
    date: '2026-07-01',
    symbol: 'AAPL',
    action: 'buy',
    price: 150,
    summary: '看多',
    confidence: 4,
  }
}

describe('useAdviceStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('初始化時 records 為空陣列', () => {
    const store = useAdviceStore()
    expect(store.records).toEqual([])
  })

  it('add 會生成 id 並加入 records', () => {
    const store = useAdviceStore()
    store.add(baseRecord())

    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBeTruthy()
    expect(store.records[0].symbol).toBe('AAPL')
  })

  it('remove 會移除對應 id 的紀錄', () => {
    const store = useAdviceStore()
    store.add(baseRecord())
    const id = store.records[0].id

    store.remove(id)

    expect(store.records).toHaveLength(0)
  })

  it('新增後會寫入 localStorage（key: invest.advice.records）', async () => {
    const store = useAdviceStore()
    store.add(baseRecord())

    await nextTick()

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1)
  })

  it('初始化時會從 localStorage 載入既有資料', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...baseRecord(), id: 'fixed-id' }]))

    const store = useAdviceStore()

    expect(store.records).toHaveLength(1)
    expect(store.records[0].id).toBe('fixed-id')
  })

  it('localStorage 資料損毀（非合法 JSON）時回退空陣列', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')

    const store = useAdviceStore()

    expect(store.records).toEqual([])
  })
})
