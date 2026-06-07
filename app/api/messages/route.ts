import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, withRetry } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  const firstId = searchParams.get('first_id')
  const limit = Number(searchParams.get('limit') || 20)
  if (!conversationId) {
    return NextResponse.json({ data: [], has_more: false, limit: 0 }, {
      headers: setSession(sessionId),
    })
  }
  try {
    const { data }: any = await withRetry(() => client.getConversationMessages(user, conversationId as string, firstId, limit))
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    return NextResponse.json({ data: [], error: error.message }, {
      headers: setSession(sessionId),
    })
  }
}
