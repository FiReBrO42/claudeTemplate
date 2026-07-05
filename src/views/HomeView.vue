<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { useCounterStore } from '@/stores/counter'
import { useI18nStore } from '@/stores/i18n'

const i18n = useI18nStore()
const counter = useCounterStore()

function toggleLocale(): void {
  i18n.setLocale(i18n.locale === 'zh-TW' ? 'en' : 'zh-TW')
}
</script>

<template>
  <main>
    <h1>{{ i18n.t('user.profile.title') }}</h1>
    <p>{{ i18n.t('greeting.hello', { name: 'invest' }) }}</p>

    <button type="button" @click="counter.increment">
      {{ i18n.t('common.confirm') }} ({{ counter.count }})
    </button>

    <button type="button" @click="toggleLocale">{{ i18n.locale }}</button>

    <nav>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/advice">{{ i18n.t('advice.nav') }}</RouterLink>
      <RouterLink to="/order">{{ i18n.t('order.nav') }}</RouterLink>
    </nav>
  </main>
</template>
