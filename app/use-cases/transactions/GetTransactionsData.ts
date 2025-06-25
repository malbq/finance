import { PrismaClient } from '@prisma-app/client'
import type { Account } from '~/domain/accounts/entities/Account'
import { AccountService } from '~/domain/accounts/services/AccountService'
import type { Category } from '~/domain/transactions/entities/Categories'
import type { Transaction } from '~/domain/transactions/entities/Transaction'
import { CategoryService } from '../../domain/transactions/services/CategoryService'
import { TransactionService } from '../../domain/transactions/services/TransactionService'

export type AccountWithTransactions = Account & {
  transactions: Transaction[]
}

export interface TransactionsData {
  accounts: Array<AccountWithTransactions>
  categories: Array<Category>
}

export class GetTransactionsData {
  private transactionService: TransactionService
  private categoryService: CategoryService
  private accountService: AccountService

  constructor(prisma: PrismaClient) {
    this.transactionService = new TransactionService(prisma)
    this.categoryService = new CategoryService(prisma)
    this.accountService = new AccountService(prisma)
  }

  async execute(): Promise<TransactionsData> {
    try {
      const [accounts, categories] = await Promise.all([
        this.accountService.findAll(),
        this.categoryService.findAll(),
      ])

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
        categories,
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
        categories: [],
      }
    }
  }
}
