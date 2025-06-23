import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('/transactions', 'routes/transactions.tsx'),
  route('/investments', 'routes/investments.tsx'),
  route('/sync', 'routes/sync.tsx'),
] satisfies RouteConfig
