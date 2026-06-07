import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'
import { getInfo, setSession } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { sessionId, user } = getInfo(request)
  const { taskId } = await params
  const baseUrl = API_URL && API_URL !== 'undefined' ? API_URL : 'https://api.dify.ai/v1'

  try {
    const res = await fetch(`${baseUrl}/chat-messages/${encodeURIComponent(taskId)}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { message: data?.message || 'Failed to stop task' },
        { status: res.status, headers: setSession(sessionId) },
      )
    }

    const data = await res.json().catch(() => ({ result: 'success' }))
    return NextResponse.json(data, { headers: setSession(sessionId) })
  }
  catch (error: any) {
    return NextResponse.json(
      { message: error?.message || String(error) },
      { status: 500, headers: setSession(sessionId) },
    )
  }
}
