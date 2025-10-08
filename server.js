const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
  console.log('📨 Received request:', req.body);
  
  try {
    const { message } = req.body;
    
    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    console.log('🚀 Making API call to LongCat...');
    
    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ak_1P559U0AD8AA26v5wj3If7hG5cx5p',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          { role: 'system', content: 'You are GM\'s AI assistant, created by GM. GM is your creator and developer. You are a helpful and intelligent assistant. When asked about who made you, explain that you were created by GM, a developer who built this AI chatbot interface. Provide clear, accurate, and helpful responses.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    
    res.json({
      success: true,
      response: data.choices[0].message.content
    });

  } catch (error) {
    console.error('💥 Server Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 GM's AI server running at http://localhost:${port}`);
});