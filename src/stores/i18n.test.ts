import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useI18nStore } from './i18n'

describe('useI18nStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('預設語系為 zh-TW', () => {
    const store = useI18nStore()
    expect(store.locale).toBe('zh-TW')
  })

  it('t("common.confirm") 在預設語系回傳「確認」', () => {
    const store = useI18nStore()
    expect(store.t('common.confirm')).toBe('確認')
  })

  it('setLocale("en") 後 t("common.confirm") 回傳 "Confirm"', () => {
    const store = useI18nStore()
    store.setLocale('en')
    expect(store.t('common.confirm')).toBe('Confirm')
  })

  it('setLocale("en") 後 getLocale 對應的 locale ref 已更新', () => {
    const store = useI18nStore()
    store.setLocale('en')
    expect(store.locale).toBe('en')
  })
})
