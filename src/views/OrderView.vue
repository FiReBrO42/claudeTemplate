<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import OrderForm from '@/components/OrderForm.vue'
import { useOrderStore } from '@/stores/order'
import { useI18nStore } from '@/stores/i18n'
import type { OrderRecord, OrderSide, OrderStatus } from '@/types/order'

const i18n = useI18nStore()
const store = useOrderStore()
const route = useRoute()

const statusFilter = ref<OrderStatus | ''>('')
const editingRecord = ref<OrderRecord | null>(null)
const prefill = ref<Partial<OrderRecord> | null>(null)

// 一鍵帶入：讀 route query 的 symbol/side/adviceId 預填新增表單；
// side 僅接受 'buy'/'sell'，非法值忽略（不可信任 URL）。
onMounted(() => {
  const { symbol, side, adviceId } = route.query
  const sideValue: OrderSide | undefined = side === 'buy' || side === 'sell' ? side : undefined
  const symbolValue = typeof symbol === 'string' ? symbol : undefined
  const adviceIdValue = typeof adviceId === 'string' ? adviceId : undefined

  if (symbolValue || sideValue || adviceIdValue) {
    prefill.value = {
      symbol: symbolValue,
      side: sideValue,
      adviceId: adviceIdValue,
    }
  }
})

const formInitial = computed(() => editingRecord.value ?? prefill.value ?? undefined)

const filteredRecords = computed(() => {
  if (!statusFilter.value) return store.records
  return store.records.filter((record) => record.status === statusFilter.value)
})

function handleSubmit(payload: Omit<OrderRecord, 'id'> & { id?: string }): void {
  if (payload.id) {
    const { id, ...patch } = payload
    store.update(id, patch)
  } else {
    store.add(payload)
  }
  editingRecord.value = null
  prefill.value = null
}

function handleCancelEdit(): void {
  editingRecord.value = null
}

function handleEdit(record: OrderRecord): void {
  prefill.value = null
  editingRecord.value = record
}

function handleRemove(id: string): void {
  store.remove(id)
  if (editingRecord.value?.id === id) editingRecord.value = null
}
</script>

<template>
  <main class="order-view">
    <h1>{{ i18n.t('order.title') }}</h1>

    <OrderForm :initial="formInitial" @submit="handleSubmit" @cancel="handleCancelEdit" />

    <section class="order-view__filters">
      <label>
        {{ i18n.t('order.filter.status') }}
        <select v-model="statusFilter">
          <option value="">{{ i18n.t('order.filter.all') }}</option>
          <option value="filled">{{ i18n.t('order.status.filled') }}</option>
          <option value="unfilled">{{ i18n.t('order.status.unfilled') }}</option>
          <option value="cancelled">{{ i18n.t('order.status.cancelled') }}</option>
        </select>
      </label>
    </section>

    <p v-if="filteredRecords.length === 0">{{ i18n.t('order.list.empty') }}</p>

    <table v-else class="order-view__table">
      <thead>
        <tr>
          <th>{{ i18n.t('order.form.date') }}</th>
          <th>{{ i18n.t('order.form.symbol') }}</th>
          <th>{{ i18n.t('order.form.side') }}</th>
          <th>{{ i18n.t('order.form.price') }}</th>
          <th>{{ i18n.t('order.form.shares') }}</th>
          <th>{{ i18n.t('order.form.status') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in filteredRecords" :key="record.id">
          <td>{{ record.date }}</td>
          <td>{{ record.symbol }}</td>
          <td>{{ i18n.t(`order.side.${record.side}`) }}</td>
          <td>{{ record.price }}</td>
          <td>{{ record.shares }}</td>
          <td>{{ i18n.t(`order.status.${record.status}`) }}</td>
          <td>
            <button type="button" class="order-view__edit" @click="handleEdit(record)">
              {{ i18n.t('order.list.edit') }}
            </button>
            <button type="button" class="order-view__delete" @click="handleRemove(record.id)">
              {{ i18n.t('order.list.delete') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.order-view__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}

.order-view__table {
  width: 100%;
  border-collapse: collapse;
}

.order-view__table th,
.order-view__table td {
  padding: 0.5rem;
  border: 1px solid #ccc;
  text-align: left;
}
</style>
