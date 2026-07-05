<script setup lang="ts">
import { computed, ref } from 'vue'

import AdviceForm from '@/components/AdviceForm.vue'
import StarRating from '@/components/StarRating.vue'
import { useAdviceStore } from '@/stores/advice'
import { useI18nStore } from '@/stores/i18n'
import type { AdviceRecord } from '@/types/advice'

const i18n = useI18nStore()
const store = useAdviceStore()

const symbolFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const filteredRecords = computed(() => {
  const keyword = symbolFilter.value.trim().toLowerCase()

  return store.records.filter((record) => {
    const symbolMatch = record.symbol.toLowerCase().includes(keyword)
    const fromMatch = !dateFrom.value || record.date >= dateFrom.value
    const toMatch = !dateTo.value || record.date <= dateTo.value
    return symbolMatch && fromMatch && toMatch
  })
})

function handleSubmit(record: Omit<AdviceRecord, 'id'>): void {
  store.add(record)
}

function handleRemove(id: string): void {
  store.remove(id)
}

function clearFilters(): void {
  symbolFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}
</script>

<template>
  <main class="advice-view">
    <h1>{{ i18n.t('advice.title') }}</h1>

    <AdviceForm @submit="handleSubmit" />

    <section class="advice-view__filters">
      <label>
        {{ i18n.t('advice.filter.symbol') }}
        <input v-model="symbolFilter" type="text" />
      </label>
      <label>
        {{ i18n.t('advice.filter.dateFrom') }}
        <input v-model="dateFrom" type="date" />
      </label>
      <label>
        {{ i18n.t('advice.filter.dateTo') }}
        <input v-model="dateTo" type="date" />
      </label>
      <button type="button" @click="clearFilters">{{ i18n.t('advice.filter.clear') }}</button>
    </section>

    <p v-if="filteredRecords.length === 0">{{ i18n.t('advice.list.empty') }}</p>

    <table v-else class="advice-view__table">
      <thead>
        <tr>
          <th>{{ i18n.t('advice.form.date') }}</th>
          <th>{{ i18n.t('advice.form.symbol') }}</th>
          <th>{{ i18n.t('advice.form.action') }}</th>
          <th>{{ i18n.t('advice.form.price') }}</th>
          <th>{{ i18n.t('advice.form.summary') }}</th>
          <th>{{ i18n.t('advice.form.confidence') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in filteredRecords" :key="record.id">
          <td>{{ record.date }}</td>
          <td>{{ record.symbol }}</td>
          <td>{{ i18n.t(`advice.action.${record.action}`) }}</td>
          <td>{{ record.price }}</td>
          <td>{{ record.summary }}</td>
          <td><StarRating :model-value="record.confidence" readonly /></td>
          <td>
            <button type="button" class="advice-view__delete" @click="handleRemove(record.id)">
              {{ i18n.t('advice.list.delete') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.advice-view__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}

.advice-view__table {
  width: 100%;
  border-collapse: collapse;
}

.advice-view__table th,
.advice-view__table td {
  padding: 0.5rem;
  border: 1px solid #ccc;
  text-align: left;
}
</style>
