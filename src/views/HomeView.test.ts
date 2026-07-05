import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'

async function mountHomeView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/about', name: 'about', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()

  return mount(HomeView, {
    global: {
      plugins: [router],
    },
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('預設以 zh-TW 顯示 i18n 文案，且含前往 About 的 router-link', async () => {
    const wrapper = await mountHomeView()

    expect(wrapper.text()).toContain('個人資料')
    expect(wrapper.text()).toContain('確認')
    expect(wrapper.find('a[href="/about"]').exists()).toBe(true)
  })

  it('點擊按鈕會透過 Pinia counter store 累加', async () => {
    const wrapper = await mountHomeView()

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('確認 (1)')
  })
})
