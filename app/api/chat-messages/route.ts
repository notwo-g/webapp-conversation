import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

async function sendWithRetry(
  inputs: any,
  query: string,
  user: string,
  responseMode: string,
  conversationId: string | null,
  files: any[] | undefined,
  maxRetries = 3,
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await client.createChatMessage(inputs, query, user, responseMode, conversationId, files)
      return res
    }
    catch (error: any) {
      const status = error?.response?.status || 0
      // Retry on any server error (5xx) or network errors
      const shouldRetry = status >= 500
        || error?.code === 'ECONNRESET'
        || error?.code === 'ETIMEDOUT'
        || error?.code === 'ERR_BAD_RESPONSE'
        || !status // no status = network error

      console.error(`[Dify] attempt ${attempt + 1} failed: status=${status}, code=${error?.code}, msg=${error?.message}`)

      if (shouldRetry && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
    files,
    conversation_id: conversationId,
    response_mode: responseMode,
  } = body
  const { user } = getInfo(request)
  try {
    const res = await sendWithRetry(inputs, query, user, responseMode, conversationId, files)
    return new Response(res.data as any)
  }
  catch (error: any) {
    const status = error?.response?.status || 503
    const errMsg = error?.response?.data?.message
      || error?.message
      || 'service temporarily unavailable, please try again later'
    return NextResponse.json({ message: errMsg, code: 'api_error' }, { status })
  }
}
