import type { LoaderFunctionArgs } from 'react-router'

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs
  export interface LoaderData {
    transactions: Array<{
      id: string
      bankId: string
      accountId: string
      transactionType: string
      postedDate: string
      amount: number
      currency: string
      fitId: string | null
      checkNum: string | null
      memo: string | null
    }>
    error?: string
  }
}
