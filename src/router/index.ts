import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting：進站時才載入 About chunk
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/advice',
      name: 'advice',
      // route level code-splitting：進站時才載入 Advice chunk
      component: () => import('@/views/AdviceView.vue'),
    },
    {
      path: '/order',
      name: 'order',
      // route level code-splitting：進站時才載入 Order chunk
      component: () => import('@/views/OrderView.vue'),
    },
    {
      path: '/health',
      name: 'health',
      // route level code-splitting：進站時才載入 HealthCheck chunk
      component: () => import('@/views/HealthCheckView.vue'),
    },
  ],
})

export default router
