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
      className={`relative overflow-hidden bg-zinc-800 rounded-lg px-3 py-1 space-y-2 border text-left transition-all hover:bg-slate-800 ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
          : 'border-zinc-600 hover:border-slate-500'
      }`}
    >
      <div className='flex justify-between items-start'>
        <h3 className='font-medium truncate'>{account.name}</h3>
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
        <div className='flex justify-between text-sm'>
          <span className='text-zinc-400'>Saldo</span>
          <span className='text-green-400'>{account.balanceFormatted}</span>
        </div>
      ) : (
        <>
          <div className='flex justify-between text-sm'>
            <div>
              <span className='text-red-400'>{account.balanceFormatted}</span>
              {' / '}
              <span className='text-zinc-300'>
                {account.creditData?.creditLimitFormatted}
              </span>
            </div>
            <span className='text-green-400'>
              {account.creditData?.availableCreditLimitFormatted}
            </span>
          </div>
          <div className='absolute bottom-0 left-0 right-0 h-0.5 flex rounded-full overflow-hidden bg-green-500'>
            <div
              className='h-full bg-red-500'
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
