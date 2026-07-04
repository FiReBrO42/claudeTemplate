import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from './i18n.mjs';

const messages = {
  'zh-TW': {
    common: { confirm: '確認', cancel: '取消' },
    greeting: { hello: '哈囉，{name}' },
    user: { profile: { title: '個人資料' } },
  },
  en: {
    common: { confirm: 'Confirm', cancel: 'Cancel' },
    greeting: { hello: 'Hello, {name}' },
    user: { profile: { title: 'Profile' } },
  },
};

test('t() 依 locale 回傳對應翻譯', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('common.confirm'), '確認');
});

test('t() 支援巢狀 dot path key', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('user.profile.title'), '個人資料');
});

test('t() 支援參數插值', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('greeting.hello', { name: '小明' }), '哈囉，小明');
});

test('t() 當前語系查無 key 時改查 fallbackLocale', () => {
  const partialMessages = {
    'zh-TW': { common: { confirm: '確認' } },
    en: { common: { confirm: 'Confirm', cancel: 'Cancel' } },
  };
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages: partialMessages });
  assert.equal(i18n.t('common.cancel'), 'Cancel');
});

test('t() 當前語系與 fallbackLocale 皆查無 key 時回傳 key 字串本身且不拋錯', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('not.exist.key'), 'not.exist.key');
});

test('setLocale() 切換語系後 t() 立即生效', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('common.confirm'), '確認');
  i18n.setLocale('en');
  assert.equal(i18n.t('common.confirm'), 'Confirm');
});

test('getLocale() 回傳當前語系', () => {
  const i18n = createI18n({ locale: 'zh-TW', fallbackLocale: 'en', messages });
  assert.equal(i18n.getLocale(), 'zh-TW');
  i18n.setLocale('en');
  assert.equal(i18n.getLocale(), 'en');
});

test('locale 檔內容：zh-TW.json 與 en.json 涵蓋必要 key 且結構一致', async () => {
  const zhTW = (await import('./locales/zh-TW.json', { with: { type: 'json' } })).default;
  const en = (await import('./locales/en.json', { with: { type: 'json' } })).default;

  const i18nZh = createI18n({
    locale: 'zh-TW',
    fallbackLocale: 'en',
    messages: { 'zh-TW': zhTW, en },
  });
  assert.equal(i18nZh.t('common.confirm'), '確認');
  assert.equal(i18nZh.t('common.cancel'), '取消');
  assert.equal(typeof i18nZh.t('greeting.hello', { name: '小明' }), 'string');
  assert.notEqual(i18nZh.t('user.profile.title'), 'user.profile.title');

  const i18nEn = createI18n({
    locale: 'en',
    fallbackLocale: 'zh-TW',
    messages: { 'zh-TW': zhTW, en },
  });
  assert.equal(i18nEn.t('common.confirm'), 'Confirm');
  assert.equal(i18nEn.t('common.cancel'), 'Cancel');
  assert.notEqual(i18nEn.t('user.profile.title'), 'user.profile.title');
});
