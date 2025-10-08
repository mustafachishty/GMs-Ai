import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }
    
    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ak_1P559U0AD8AA26v5wj3If7hG5cx5p',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          { role: 'system', content: 'You are GM\'s AI assistant, created by GM.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}