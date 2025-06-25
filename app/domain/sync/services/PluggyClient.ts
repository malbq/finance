export interface PluggyAuthResponse {
  apiKey: string
}

export interface PluggyApiResponse<T> {
  results: T[]
}

export class PluggyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'PluggyApiError'
  }
}

export const PluggyClient = {
  async authenticate(): Promise<string> {
    const clientId = process.env.PLUGGY_CLIENT_ID
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new PluggyApiError('Pluggy credentials not configured')
    }

    try {
      const response = await fetch('https://api.pluggy.ai/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PluggyApiError(
          `Authentication failed: ${errorData.message || response.statusText}`,
          response.status
        )
      }

      const data: PluggyAuthResponse = await response.json()
      return data.apiKey
    } catch (error) {
      if (error instanceof PluggyApiError) {
        throw error
      }
      throw new PluggyApiError(
        `Authentication request failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  },

  async fetchData<T>(
    apiKey: string,
    endpoint: string,
    params?: Record<string, string>
  ): Promise<PluggyApiResponse<T>> {
    const url = new URL(`https://api.pluggy.ai${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new PluggyApiError(
          `API request failed: ${errorData.message || response.statusText}`,
          response.status,
          endpoint
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof PluggyApiError) {
        throw error
      }
      throw new PluggyApiError(
        `Request to ${endpoint} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        undefined,
        endpoint
      )
    }
  },

  getItemIds(): string[] {
    const itemIdsEnv = process.env.PLUGGY_ITEM_ID

    if (!itemIdsEnv) {
      throw new PluggyApiError('PLUGGY_ITEM_ID not configured')
    }

    return itemIdsEnv.includes(',')
      ? itemIdsEnv.split(',').map((id) => id.trim())
      : [itemIdsEnv.trim()]
  },
}
