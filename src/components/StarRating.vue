<script setup lang="ts">
import { computed } from 'vue'

import { useI18nStore } from '@/stores/i18n'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
    max?: number
  }>(),
  {
    readonly: false,
    max: 5,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const i18n = useI18nStore()

const stars = computed(() => Array.from({ length: props.max }, (_, index) => index + 1))

function select(value: number): void {
  if (props.readonly) return
  emit('update:modelValue', value)
}
</script>

<template>
  <span
    class="star-rating"
    :class="{ 'star-rating--readonly': readonly }"
    :aria-label="i18n.t('advice.star.value', { value: modelValue })"
  >
    <button
      v-for="star in stars"
      :key="star"
      type="button"
      class="star-rating__star"
      :class="{ 'star-rating__star--filled': star <= modelValue }"
      :disabled="readonly"
      :aria-label="i18n.t('advice.star.select', { value: star })"
      @click="select(star)"
    >
      {{ star <= modelValue ? '★' : '☆' }}
    </button>
  </span>
</template>

<style scoped>
.star-rating__star {
  padding: 0 0.1rem;
  color: inherit;
  font-size: 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
}

.star-rating--readonly .star-rating__star {
  cursor: default;
}
</style>
