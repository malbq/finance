import { PrismaClient } from '@prisma-app/client'
import type { Account } from '~/domain/accounts/entities/Account'
import { AccountService } from '~/domain/accounts/services/AccountService'
import type { Transaction } from '~/domain/transactions/entities/Transaction'
import { TransactionService } from '../../domain/transactions/services/TransactionService'

export type AccountWithTransactions = Account & {
  transactions: Transaction[]
}

export interface TransactionsData {
  accounts: Array<AccountWithTransactions>
}

export class GetTransactionsData {
  private transactionService: TransactionService
  private accountService: AccountService

  constructor(prisma: PrismaClient) {
    this.transactionService = new TransactionService(prisma)
    this.accountService = new AccountService(prisma)
  }

  async execute(): Promise<TransactionsData> {
    try {
      const accounts = await this.accountService.findAll()

      const accountsWithTransactions = await Promise.all(
        accounts.map<Promise<AccountWithTransactions>>(async (account) => {
          try {
            const transactions = await this.transactionService.findByAccountId(
              account.id
            )
            const accountWithTx: AccountWithTransactions = {
              ...account,
              transactions,
            }
            return accountWithTx
          } catch (transactionError) {
            console.error(
              `Error loading transactions for account ${account.id}:`,
              transactionError
            )
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
