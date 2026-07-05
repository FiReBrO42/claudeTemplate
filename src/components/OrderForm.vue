<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { useI18nStore } from '@/stores/i18n'
import type { OrderRecord, OrderSide, OrderStatus } from '@/types/order'

const i18n = useI18nStore()

const props = defineProps<{
  /**
   * 有值且含 `id` → 編輯模式（欄位預填、送出時 emit 帶 id）。
   * 有值但不含 `id`（如一鍵帶入的 symbol/side/adviceId）→ 新增模式但預填部分欄位。
   * 無值 → 全新空白新增模式。
   */
  initial?: Partial<OrderRecord> | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<OrderRecord, 'id'> & { id?: string }]
  cancel: []
}>()

interface FormState {
  date: string
  symbol: string
  side: OrderSide
  price: string
  shares: string
  status: OrderStatus
  adviceId?: string
  /** 選填，空字串代表未填寫 */
  stopLoss: string
  /** 選填，空字串代表未填寫 */
  takeProfit: string
}

function buildFormState(initial?: Partial<OrderRecord> | null): FormState {
  return {
    date: initial?.date ?? '',
    symbol: initial?.symbol ?? '',
    side: initial?.side === 'sell' ? 'sell' : 'buy',
    price: initial?.price !== undefined ? String(initial.price) : '',
    shares: initial?.shares !== undefined ? String(initial.shares) : '',
    status: initial?.status ?? 'unfilled',
    adviceId: initial?.adviceId,
    stopLoss: initial?.stopLoss !== undefined ? String(initial.stopLoss) : '',
    takeProfit: initial?.takeProfit !== undefined ? String(initial.takeProfit) : '',
  }
}

const form = reactive(buildFormState(props.initial))
const errors = ref<string[]>([])

const isEditing = computed(() => Boolean(props.initial?.id))

watch(
  () => props.initial,
  (next) => {
    Object.assign(form, buildFormState(next))
    errors.value = []
  },
)

function validate(): string[] {
  const messages: string[] = []

  if (!form.date) messages.push(i18n.t('order.form.error.date'))
  if (!form.symbol.trim()) messages.push(i18n.t('order.form.error.symbol'))

  const priceValue = Number(form.price)
  if (!form.price || Number.isNaN(priceValue) || priceValue <= 0) {
    messages.push(i18n.t('order.form.error.price'))
  }

  const sharesValue = Number(form.shares)
  if (!form.shares || Number.isNaN(sharesValue) || !Number.isInteger(sharesValue) || sharesValue <= 0) {
    messages.push(i18n.t('order.form.error.shares'))
  }

  // 停損/停利為選填：留空不驗證，有填才須為大於 0 的數字。
  if (form.stopLoss) {
    const stopLossValue = Number(form.stopLoss)
    if (Number.isNaN(stopLossValue) || stopLossValue <= 0) {
      messages.push(i18n.t('order.form.error.stopLoss'))
    }
  }

  if (form.takeProfit) {
    const takeProfitValue = Number(form.takeProfit)
    if (Number.isNaN(takeProfitValue) || takeProfitValue <= 0) {
      messages.push(i18n.t('order.form.error.takeProfit'))
    }
  }

  return messages
}

function handleSubmit(): void {
  const validationErrors = validate()
  errors.value = validationErrors
  if (validationErrors.length > 0) return

  const payload: Omit<OrderRecord, 'id'> & { id?: string } = {
    date: form.date,
    symbol: form.symbol.trim().toUpperCase(),
    side: form.side,
    price: Number(form.price),
    shares: Number(form.shares),
    status: form.status,
    adviceId: form.adviceId,
    stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
    takeProfit: form.takeProfit ? Number(form.takeProfit) : undefined,
  }

  if (isEditing.value && props.initial?.id) {
    payload.id = props.initial.id
  }

  emit('submit', payload)

  if (!isEditing.value) {
    Object.assign(form, buildFormState())
    errors.value = []
  }
}

function handleCancel(): void {
  emit('cancel')
}
</script>

<template>
  <form class="order-form" @submit.prevent="handleSubmit">
    <div class="order-form__field">
      <label for="order-date">{{ i18n.t('order.form.date') }}</label>
      <input id="order-date" v-model="form.date" type="date" />
    </div>

    <div class="order-form__field">
      <label for="order-symbol">{{ i18n.t('order.form.symbol') }}</label>
      <input id="order-symbol" v-model="form.symbol" type="text" />
    </div>

    <div class="order-form__field">
      <label for="order-side">{{ i18n.t('order.form.side') }}</label>
      <select id="order-side" v-model="form.side">
        <option value="buy">{{ i18n.t('order.side.buy') }}</option>
        <option value="sell">{{ i18n.t('order.side.sell') }}</option>
      </select>
    </div>

    <div class="order-form__field">
      <label for="order-price">{{ i18n.t('order.form.price') }}</label>
      <input id="order-price" v-model="form.price" type="number" step="0.01" min="0" />
    </div>

    <div class="order-form__field">
      <label for="order-shares">{{ i18n.t('order.form.shares') }}</label>
      <input id="order-shares" v-model="form.shares" type="number" step="1" min="0" />
    </div>

    <div class="order-form__field">
      <label for="order-status">{{ i18n.t('order.form.status') }}</label>
      <select id="order-status" v-model="form.status">
        <option value="filled">{{ i18n.t('order.status.filled') }}</option>
        <option value="unfilled">{{ i18n.t('order.status.unfilled') }}</option>
        <option value="cancelled">{{ i18n.t('order.status.cancelled') }}</option>
      </select>
    </div>

    <div class="order-form__field">
      <label for="order-stop-loss">{{ i18n.t('order.form.stopLoss') }}</label>
      <input id="order-stop-loss" v-model="form.stopLoss" type="number" step="0.01" min="0" />
    </div>

    <div class="order-form__field">
      <label for="order-take-profit">{{ i18n.t('order.form.takeProfit') }}</label>
      <input id="order-take-profit" v-model="form.takeProfit" type="number" step="0.01" min="0" />
    </div>

    <div v-if="form.adviceId" class="order-form__field">
      <span>{{ i18n.t('order.form.adviceId') }}</span>
      <span>{{ form.adviceId }}</span>
    </div>

    <ul v-if="errors.length > 0" class="order-form__errors">
      <li v-for="message in errors" :key="message">{{ message }}</li>
    </ul>

    <div class="order-form__actions">
      <button type="submit">{{ isEditing ? i18n.t('order.form.update') : i18n.t('order.form.submit') }}</button>
      <button v-if="isEditing" type="button" @click="handleCancel">{{ i18n.t('order.form.cancel') }}</button>
    </div>
  </form>
</template>

<style scoped>
.order-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.order-form__actions {
  display: flex;
  gap: 0.5rem;
}

.order-form__errors {
  color: #c0392b;
}
</style>
