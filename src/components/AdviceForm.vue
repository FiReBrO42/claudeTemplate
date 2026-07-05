<script setup lang="ts">
import { reactive, ref } from 'vue'

import StarRating from '@/components/StarRating.vue'
import { useI18nStore } from '@/stores/i18n'
import type { AdviceAction, AdviceRecord } from '@/types/advice'

const i18n = useI18nStore()

const emit = defineEmits<{
  submit: [record: Omit<AdviceRecord, 'id'>]
}>()

interface FormState {
  date: string
  symbol: string
  action: AdviceAction
  price: string
  summary: string
  confidence: number
}

function createEmptyForm(): FormState {
  return {
    date: '',
    symbol: '',
    action: 'hold',
    price: '',
    summary: '',
    confidence: 3,
  }
}

const form = reactive(createEmptyForm())
const errors = ref<string[]>([])

function validate(): string[] {
  const messages: string[] = []

  if (!form.date) messages.push(i18n.t('advice.form.error.date'))
  if (!form.symbol.trim()) messages.push(i18n.t('advice.form.error.symbol'))
  if (!form.summary.trim()) messages.push(i18n.t('advice.form.error.summary'))

  const priceValue = Number(form.price)
  if (!form.price || Number.isNaN(priceValue) || priceValue <= 0) {
    messages.push(i18n.t('advice.form.error.price'))
  }

  if (!Number.isInteger(form.confidence) || form.confidence < 1 || form.confidence > 5) {
    messages.push(i18n.t('advice.form.error.confidence'))
  }

  return messages
}

function handleSubmit(): void {
  const validationErrors = validate()
  errors.value = validationErrors
  if (validationErrors.length > 0) return

  emit('submit', {
    date: form.date,
    symbol: form.symbol.trim().toUpperCase(),
    action: form.action,
    price: Number(form.price),
    summary: form.summary.trim(),
    confidence: form.confidence,
  })

  Object.assign(form, createEmptyForm())
  errors.value = []
}
</script>

<template>
  <form class="advice-form" @submit.prevent="handleSubmit">
    <div class="advice-form__field">
      <label for="advice-date">{{ i18n.t('advice.form.date') }}</label>
      <input id="advice-date" v-model="form.date" type="date" />
    </div>

    <div class="advice-form__field">
      <label for="advice-symbol">{{ i18n.t('advice.form.symbol') }}</label>
      <input id="advice-symbol" v-model="form.symbol" type="text" />
    </div>

    <div class="advice-form__field">
      <label for="advice-action">{{ i18n.t('advice.form.action') }}</label>
      <select id="advice-action" v-model="form.action">
        <option value="buy">{{ i18n.t('advice.action.buy') }}</option>
        <option value="sell">{{ i18n.t('advice.action.sell') }}</option>
        <option value="hold">{{ i18n.t('advice.action.hold') }}</option>
      </select>
    </div>

    <div class="advice-form__field">
      <label for="advice-price">{{ i18n.t('advice.form.price') }}</label>
      <input id="advice-price" v-model="form.price" type="number" step="0.01" min="0" />
    </div>

    <div class="advice-form__field">
      <label for="advice-summary">{{ i18n.t('advice.form.summary') }}</label>
      <textarea id="advice-summary" v-model="form.summary" />
    </div>

    <div class="advice-form__field">
      <span>{{ i18n.t('advice.form.confidence') }}</span>
      <StarRating v-model="form.confidence" />
    </div>

    <ul v-if="errors.length > 0" class="advice-form__errors">
      <li v-for="message in errors" :key="message">{{ message }}</li>
    </ul>

    <button type="submit">{{ i18n.t('advice.form.submit') }}</button>
  </form>
</template>

<style scoped>
.advice-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.advice-form__errors {
  color: #c0392b;
}
</style>
