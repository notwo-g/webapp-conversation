import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_ID, APP_INFO } from '@/config'

const userPrefix = `user_${APP_ID}:`

export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
  }
}

export const setSession = (sessionId: string) => {
  if (APP_INFO.disable_session_same_site)
  { return { 'Set-Cookie': `session_id=${sessionId}; SameSite=None; Secure` } }

  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client = new ChatClient(API_KEY, API_URL || undefined)

// Retry wrapper for Dify API calls that may fail with transient errors
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error: any) {
      // Check multiple places where the error message could be:
      // 1. error.message (AxiosError message or network error)
      // 2. error.response?.data (AxiosError parsed response body)
      const msg = error?.message || ''
      const dataMsg = typeof error?.response?.data === 'string'
        ? error.response.data
        : JSON.stringify(error?.response?.data || '')
      const combinedMsg = `${msg} ${dataMsg}`

      const isRetryable = combinedMsg.includes('service temporarily unavailable')
        || combinedMsg.includes('api_error')
        || combinedMsg.includes('timeout')
        || error?.code === 'ECONNRESET'
        || error?.code === 'ETIMEDOUT'
        || error?.code === 'ERR_BAD_RESPONSE'
        || [502, 503, 504].includes(error?.response?.status)

      if (isRetryable && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
