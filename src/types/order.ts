/**
 * 委託單記錄的共用型別。
 * 跨 store（src/stores/order.ts）、view（OrderView.vue）與 components
 * （OrderForm.vue）共用，集中於此避免重複定義。
 */

export type OrderSide = 'buy' | 'sell'

export type OrderStatus = 'filled' | 'unfilled' | 'cancelled'

export interface OrderRecord {
  /** 唯一鍵，供編輯/刪除使用；由 crypto.randomUUID() 生成 */
  id: string
  /** 'YYYY-MM-DD'，對應 <input type="date"> 原生格式 */
  date: string
  /** 標的代號，存前 trim + 轉大寫 */
  symbol: string
  side: OrderSide
  /** 委託價，須 > 0 */
  price: number
  /** 股數，正整數，須 > 0 */
  shares: number
  status: OrderStatus
  /** 可選：關聯的 AI 建議 id（一鍵帶入時填入） */
  adviceId?: string
  /** 可選：停損價，須 > 0；供委託單健檢的風控完整性面向使用 */
  stopLoss?: number
  /** 可選：停利價，須 > 0；供委託單健檢的風控完整性面向使用 */
  takeProfit?: number
}
