/**
 * AI 投資建議紀錄的共用型別。
 * 跨 store（src/stores/advice.ts）、view（AdviceView.vue）與 components
 * （AdviceForm.vue／StarRating.vue）共用，集中於此避免重複定義。
 */

export type AdviceAction = 'buy' | 'sell' | 'hold'

export interface AdviceRecord {
  /** 唯一鍵，供刪除使用；由 crypto.randomUUID() 生成 */
  id: string
  /** 'YYYY-MM-DD'，對應 <input type="date"> 原生格式 */
  date: string
  /** 標的代號，存前 trim + 轉大寫 */
  symbol: string
  action: AdviceAction
  /** 建議價位，單一數字、不綁幣別，須 > 0 */
  price: number
  /** AI 分析摘要 */
  summary: string
  /** 信心度星等，1–5 整數 */
  confidence: number
}
