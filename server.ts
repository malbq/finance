import os from 'node:os'
import { createRequestHandler } from 'react-router'
// @ts-ignore - build output doesn't have types
import * as build from './build/server/index.js'

const clientBuild = './build/client'

Bun.serve({
  port: Number(import.meta.env.PORT),
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

const port = Number(import.meta.env.PORT)
const urls = Object.values(os.networkInterfaces())
  .flatMap((netifs) => netifs ?? [])
  .filter((details) => {
    const family = (details as unknown as { family: string | number }).family
    const isIPv4 = family === 'IPv4' || family === 4
    return !details.internal && isIPv4
  })
  .map((details) => `${details.address}:${port}`)

if (urls.length > 0) {
  console.log(`Server started on ${urls.join(', ')}`)
} else {
  console.log(`Server started on port ${port}`)
}

export { }

