/**
 * 型別橋接檔：為零依賴、純 JS 的 i18n.mjs 提供 strict TS 型別宣告。
 * 不改動 i18n.mjs 本體；TS 依「同名 + .d.mts」慣例自動關聯此宣告檔。
 */

export interface I18nMessages {
  [locale: string]: Record<string, unknown>
}

export interface CreateI18nOptions {
  locale: string
  fallbackLocale?: string
  messages?: I18nMessages
}

export interface I18nInstance {
  t(key: string, params?: Record<string, unknown>): string
  setLocale(nextLocale: string): void
  getLocale(): string
}

export function createI18n(options: CreateI18nOptions): I18nInstance
