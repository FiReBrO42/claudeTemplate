import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { AdviceRecord } from '@/types/advice'

const STORAGE_KEY = 'invest.advice.records'

function loadRecords(): AdviceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AdviceRecord[]) : []
  } catch {
    // 資料損毀（非合法 JSON 或格式不符）時回退空陣列，避免 crash。
    return []
  }
}

export const useAdviceStore = defineStore('advice', () => {
  const records = ref<AdviceRecord[]>(loadRecords())

  watch(
    records,
    (next) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    },
    { deep: true },
  )

  function add(record: Omit<AdviceRecord, 'id'>): void {
    records.value.push({ ...record, id: crypto.randomUUID() })
  }

  function remove(id: string): void {
    records.value = records.value.filter((item) => item.id !== id)
  }

  return { records, add, remove }
})
