import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createI18n } from '../i18n/i18n.mjs'
import en from '../i18n/locales/en.json'
import zhTW from '../i18n/locales/zh-TW.json'

export type SupportedLocale = 'zh-TW' | 'en'

const DEFAULT_LOCALE: SupportedLocale = 'zh-TW'
const FALLBACK_LOCALE: SupportedLocale = 'en'

// 框架無關的 i18n 核心（見 src/i18n/i18n.mjs），本身無響應式。
const core = createI18n({
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    'zh-TW': zhTW,
    en,
  },
})

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref<SupportedLocale>(DEFAULT_LOCALE)

  function t(key: string, params?: Record<string, unknown>): string {
    // 先讀取 locale.value 建立響應式相依，setLocale 後模板才會重新求值。
    void locale.value
    return core.t(key, params)
  }

  function setLocale(next: SupportedLocale): void {
    locale.value = next
    core.setLocale(next)
  }

  return { locale, t, setLocale }
})
