import { PrismaClient } from '@prisma-app/client'
import { Account } from '../entities/Account'
import { BankAccount } from '../entities/BankAccount'

export interface BalanceCalculation {
  bankBalance: number
  investmentBalance: number
  totalBalance: number
}

export class BalanceService {
  constructor(private prisma: PrismaClient) {}

  async calculateTotalBalances(
    accounts: Account[]
  ): Promise<BalanceCalculation> {
    const bankBalance = this.calculateBankBalance(accounts)
    const investmentBalance = await this.calculateInvestmentBalance()
    const totalBalance = bankBalance + investmentBalance

    return {
      bankBalance,
      investmentBalance,
      totalBalance,
    }
  }

  private calculateBankBalance(accounts: Account[]): number {
    return accounts.reduce((total, account) => {
      if (account instanceof BankAccount) {
        return total + account.balance
      }
      if (account instanceof CreditAccount) {
        return total + account.balance
      }
      return total + account.balance
    }, 0)
  }

  private async calculateInvestmentBalance(): Promise<number> {
    const result = await this.prisma.investment.aggregate({
      _sum: {
        balance: true,
      },
    })
    return Number(result._sum.balance) || 0
  }

  calculateAvailableBalance(account: Account): number {
    if (account instanceof BankAccount) {
      return account.getAvailableBalance()
    }
    if (account instanceof CreditAccount) {
      return account.availableCreditLimit ?? 0
    }
    return account.balance
  }
}
