import { createRequestHandler } from 'react-router'
// @ts-ignore - build output doesn't have types
import * as build from './build/server/index.js'

const clientBuild = './build/client'

Bun.serve({
  port: 7777,
  hostname: '0.0.0.0',
  routes: {
    '/.well-known/appspecific/com.chrome.devtools.json': () =>
      new Response(null, { status: 204 }),
    '/favicon.ico': async () =>
      new Response(await Bun.file(`${clientBuild}/favicon.ico`).bytes(), {
        headers: {
          'Content-Type': 'image/x-icon',
        },
      }),
    '/assets/:asset': async (request) => {
      const asset = Bun.file(`${clientBuild}/assets/${request.params.asset}`)
      return new Response(await asset.bytes(), {
        headers: {
          'Content-Type': asset.type,
        },
      })
    },
  },
  fetch: (request) => createRequestHandler(build, 'development')(request),
})

console.log('Server started on port 7777')

export {}
