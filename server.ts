import { createBootstrapHandler } from './api/bootstrap'
import { createDatabase } from './api/db/drizzle'
import { createSpendingGoalsHandler } from './api/spending-goals'
import { createSyncHandler } from './api/sync'
import { createTransactionsHandler } from './api/transactions'
import indexHtml from './app/index.html'

const db = createDatabase()

Bun.serve({
  port: parseInt(process.env.PORT || '7777'),
  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
  routes: {
    '/api/bootstrap': createBootstrapHandler(db),
    '/api/spending-goals': createSpendingGoalsHandler(db),
    '/api/transactions': createTransactionsHandler(db),
    '/api/sync': createSyncHandler(db),
    '/favicon.ico': new Response(await Bun.file('public/favicon.ico').bytes()),
    '/*': indexHtml,
  },
})
