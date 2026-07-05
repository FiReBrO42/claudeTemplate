import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      // src/i18n/i18n.test.mjs 是 node:test 案例，交由 npm run test 的第二段
      // `node --test` 執行；此處排除避免 Vitest 誤抓並嘗試打包 node:test。
      include: ['src/**/*.test.ts'],
      exclude: [...configDefaults.exclude],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
