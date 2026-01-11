import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { Account } from '../../domain/Account'
import type { Transaction } from '../../domain/Transaction'
import { AccountService } from './AccountService'
import { TransactionService } from './TransactionService'

type AccountWithTransactions = Account & {
  transactions: Transaction[]
}

export interface TransactionsData {
  accounts: Array<AccountWithTransactions>
}

export class GetTransactionsData {
  private transactionService: TransactionService
  private accountService: AccountService

  constructor(db: ReturnType<typeof drizzle>) {
    this.transactionService = new TransactionService(db)
    this.accountService = new AccountService(db)
  }

  async execute(): Promise<TransactionsData> {
    try {
      const accounts = await this.accountService.findAll()

      const accountsWithTransactions = await Promise.all(
        accounts.map<Promise<AccountWithTransactions>>(async (account) => {
          try {
            const transactions = await this.transactionService.findByAccountId(account.id)
            const accountWithTx: AccountWithTransactions = {
              ...account,
              transactions,
            }
            return accountWithTx
          } catch (transactionError) {
            console.error(`Error loading transactions for account ${account.id}:`, transactionError)
            return {
              ...account,
              transactions: [],
            } as AccountWithTransactions
          }
        })
      )

      return {
        accounts: accountsWithTransactions,
      }
    } catch (error) {
      console.error('Error loading transactions data:', error)
      if (error instanceof Error) {
        console.error('Transactions error details:', {
          message: error.message,
          stack: error.stack,
        })
      }
      return {
        accounts: [],
      }
    }
  }
}
