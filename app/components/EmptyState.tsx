interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-16 h-16 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )

  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <div className="text-center py-12">
        <div className="text-zinc-400 mb-4">{icon || defaultIcon}</div>
        <h3 className="text-xl font-medium text-zinc-300 mb-2">{title}</h3>
        <p className="text-zinc-400">{description}</p>
      </div>
    </div>
  )
}
