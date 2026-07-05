import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { OrderRecord } from '@/types/order'

const STORAGE_KEY = 'invest.orders.records'

function loadRecords(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as OrderRecord[]) : []
  } catch {
    // 資料損毀（非合法 JSON 或格式不符）時回退空陣列，避免 crash。
    return []
  }
}

export const useOrderStore = defineStore('order', () => {
  const records = ref<OrderRecord[]>(loadRecords())

  watch(
    records,
    (next) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    },
    { deep: true },
  )

  function add(record: Omit<OrderRecord, 'id'>): void {
    records.value.push({ ...record, id: crypto.randomUUID() })
  }

  function update(id: string, patch: Omit<OrderRecord, 'id'>): void {
    const index = records.value.findIndex((item) => item.id === id)
    if (index === -1) return
    records.value[index] = { ...patch, id }
  }

  function remove(id: string): void {
    records.value = records.value.filter((item) => item.id !== id)
  }

  return { records, add, update, remove }
})
