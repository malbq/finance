export default function Investments() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Investments</h1>
        <p className="text-zinc-300">
          Track and manage your investment portfolio
        </p>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-zinc-400 mb-4">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-zinc-300 mb-2">
            Investments Coming Soon
          </h3>
          <p className="text-zinc-400">
            Investment portfolio management features will be implemented here
          </p>
        </div>
      </div>
    </div>
  )
}
