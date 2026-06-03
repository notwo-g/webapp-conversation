import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, withRetry } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    const { data }: any = await withRetry(() => client.getConversations(user))
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      data: [],
      error: error.message,
    })
  }
}

export async function DELETE(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')

  if (!conversationId) {
    return NextResponse.json({
      result: 'error',
      error: 'conversation_id is required',
    }, {
      status: 400,
      headers: setSession(sessionId),
    })
  }

  try {
    await withRetry(() => client.deleteConversation(conversationId, user))
    return NextResponse.json({
      result: 'success',
    }, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      result: 'error',
      error: error.message,
    }, {
      status: 500,
      headers: setSession(sessionId),
    })
  }
}
