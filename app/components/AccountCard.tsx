import type { Account } from '~/domain/accounts/entities/Account'

interface AccountCardProps {
  account: Account
  isActive: boolean
  onClick: () => void
}

export function AccountCard({ account, isActive, onClick }: AccountCardProps) {
  const utilizationRate =
    account.type === 'CREDIT'
      ? (account.creditData?.creditLimit ?? 1) > 0
        ? (account.balance / (account.creditData?.creditLimit ?? 1)) * 100
        : 0
      : 0

  return (
    <button
      onClick={onClick}
      className={`bg-zinc-800 rounded-lg p-4 border text-left transition-all hover:bg-slate-800 ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
          : 'border-zinc-600 hover:border-slate-500'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-white">{account.name}</h3>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            account.type === 'BANK'
              ? 'bg-blue-900 text-blue-300'
              : 'bg-purple-800 text-purple-200'
          }`}
        >
          {account.type === 'BANK' ? 'Banco' : 'Cartão'}
        </span>
      </div>

      {account.type === 'BANK' ? (
        <div className="flex justify-between text-sm text-zinc-400">
          Saldo
          <span className="font-medium text-green-400">
            {account.balanceFormatted}
          </span>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-sm text-zinc-400">
            <div className="text-zinc-400">
              <span className="text-red-400">{account.balanceFormatted}</span>
              {' / '}
              <span className="font-medium text-zinc-300">
                {account.creditData?.creditLimitFormatted}
              </span>
            </div>
            <span className="font-medium">
              <span className="text-green-400">
                {account.creditData?.availableCreditLimitFormatted}
              </span>
            </span>
          </div>
          <div className="h-0.5 flex rounded-full overflow-hidden bg-green-500/50">
            <div
              className="h-full bg-red-500/50"
              style={{
                width: `${utilizationRate}%`,
              }}
            ></div>
          </div>
        </>
      )}
    </button>
  )
}
