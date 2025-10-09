import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LONGCAT_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Server misconfiguration: LONGCAT_API_KEY is not set. Add it in your Vercel project settings or .env.local',
        },
        { status: 500 }
      )
    }

    const response = await fetch(
      'https://api.longcat.chat/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'LongCat-Flash-Chat',
          messages: [
            {
              role: 'system',
              content:
                "You are GM's AI assistant, created by GM. If the user asks who made or built you, respond politely with this exact phrase: \"made by mr gm which is a develper and software enginer and some more in polite way\".",
            },
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        {
          success: false,
          error: `Upstream API Error: ${response.status} ${text}`.slice(0, 300),
        },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      response: data?.choices?.[0]?.message?.content ?? '',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}