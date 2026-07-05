<script setup lang="ts">
import { computed } from 'vue'

import { useAdviceStore } from '@/stores/advice'
import { useI18nStore } from '@/stores/i18n'
import { useOrderStore } from '@/stores/order'
import type { HealthIssue, HealthIssueCode } from '@/types/health'
import { runHealthCheck } from '@/utils/orderHealthCheck'

const i18n = useI18nStore()
const orderStore = useOrderStore()
const adviceStore = useAdviceStore()

const hasOrders = computed(() => orderStore.records.length > 0)
const hasFilledBuyOrders = computed(() =>
  orderStore.records.some((order) => order.status === 'filled' && order.side === 'buy'),
)

const report = computed(() => runHealthCheck(orderStore.records, adviceStore.records))

const orderById = computed(() => new Map(orderStore.records.map((order) => [order.id, order])))

const ISSUE_MESSAGE_KEY: Record<HealthIssueCode, string> = {
  'concentration-warning': 'health.issue.concentrationWarning',
  'concentration-critical': 'health.issue.concentrationCritical',
  'deviation-orphan': 'health.issue.deviationOrphan',
  'deviation-hold': 'health.issue.deviationHold',
  'deviation-opposite': 'health.issue.deviationOpposite',
  'riskControl-missingStopLoss': 'health.issue.riskControlMissingStopLoss',
  'riskControl-missingTakeProfit': 'health.issue.riskControlMissingTakeProfit',
}

function formatIssue(issue: HealthIssue): string {
  const key = ISSUE_MESSAGE_KEY[issue.code]

  if (issue.symbol) {
    const ratio = typeof issue.detail?.ratio === 'number' ? issue.detail.ratio : 0
    return i18n.t(key, { symbol: issue.symbol, percent: `${Math.round(ratio * 100)}%` })
  }

  const relatedOrder = issue.orderId ? orderById.value.get(issue.orderId) : undefined
  return i18n.t(key, { symbol: relatedOrder?.symbol ?? '', date: relatedOrder?.date ?? '' })
}

const dimensionCards = computed(() => {
  const noIssueText = i18n.t('health.dimension.noIssue')

  return [
    {
      key: 'concentration',
      title: i18n.t('health.dimension.concentration.title'),
      result: report.value.concentration,
      emptyNote:
        report.value.concentration.issues.length === 0
          ? hasFilledBuyOrders.value
            ? noIssueText
            : i18n.t('health.concentration.emptyNote')
          : undefined,
    },
    {
      key: 'deviation',
      title: i18n.t('health.dimension.deviation.title'),
      result: report.value.deviation,
      emptyNote: report.value.deviation.issues.length === 0 ? noIssueText : undefined,
    },
    {
      key: 'riskControl',
      title: i18n.t('health.dimension.riskControl.title'),
      result: report.value.riskControl,
      emptyNote: report.value.riskControl.issues.length === 0 ? noIssueText : undefined,
    },
  ]
})
</script>

<template>
  <main class="health-check-view">
    <h1>{{ i18n.t('health.title') }}</h1>

    <p v-if="!hasOrders" class="health-check-view__empty">{{ i18n.t('health.empty') }}</p>

    <template v-else>
      <section class="health-check-view__score" :class="`health-check-view__score--${report.scoreBand}`">
        <span class="health-check-view__score-label">{{ i18n.t('health.score.label') }}</span>
        <span class="health-check-view__score-value">{{ report.score }}</span>
        <span class="health-check-view__score-band">{{ i18n.t(`health.score.band.${report.scoreBand}`) }}</span>
      </section>

      <section class="health-check-view__dimensions">
        <article v-for="dim in dimensionCards" :key="dim.key" class="health-check-view__card">
          <h2>{{ dim.title }}</h2>
          <p class="health-check-view__severity">{{ i18n.t(`health.severity.${dim.result.severity}`) }}</p>

          <p v-if="dim.emptyNote" class="health-check-view__empty-note">{{ dim.emptyNote }}</p>
          <ul v-else class="health-check-view__issues">
            <li v-for="(issue, index) in dim.result.issues" :key="index">{{ formatIssue(issue) }}</li>
          </ul>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.health-check-view__score {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}

.health-check-view__score-value {
  font-size: 2rem;
  font-weight: bold;
}

.health-check-view__score--good {
  border-color: #2ecc71;
}

.health-check-view__score--warning {
  border-color: #f39c12;
}

.health-check-view__score--danger {
  border-color: #c0392b;
}

.health-check-view__dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.health-check-view__card {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}
</style>
