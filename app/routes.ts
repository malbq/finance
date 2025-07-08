import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/dashboard.tsx'),
  route('/transactions', 'routes/transactions.tsx'),
  route('/investments', 'routes/investments.tsx'),
  route('/cashflow', 'routes/cashflow.tsx'),
  route('/api/sync', 'routes/api.sync.tsx'),
] satisfies RouteConfig
