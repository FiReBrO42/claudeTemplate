<script setup lang="ts">
import { useI18nStore } from '@/stores/i18n'

const i18n = useI18nStore()
</script>

<template>
  <main>
    <h1>{{ i18n.t('user.profile.title') }}</h1>
  </main>
</template>
