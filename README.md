# GM's AI Chatbot

Professional Next.js AI chatbot with LongCat API integration.

## 🚀 One-Click Deploy (Vercel)

Click the button below. You will be prompted to add the required environment variable LONGCAT_API_KEY during setup.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mustafachishty/GMs-Ai&env=LONGCAT_API_KEY&envDescription=API%20key%20for%20LongCat%20Chat%20Completions%20API&envLink=https%3A%2F%2Flongcat.chat%2F&project-name=gms-ai-chatbot&repository-name=gms-ai-chatbot)

Required env vars:
- LONGCAT_API_KEY: Your LongCat API key

## 📁 Project Structure

```
GM's-Ai/
├── app/                            # Next.js App Router
│   ├── api/chat/                   # API Routes
│   │   └── route.js                # Chat API endpoint (server-only)
│   ├── layout.js                   # Root layout
│   ├── page.js                     # Homepage
│   └── globals.css                 # Global styles
│
├── components/                     # React Components
│   └── ChatInterface.js            # Main chat component
│
├── public/                         # Static Assets
│   └── script.js                   # Client-side script (optional/legacy)
│
├── package.json                    # Dependencies & scripts
├── next.config.mjs                 # Next.js configuration
└── README.md                       # This file
```

## 🔧 Local Development

1) Set your environment variable:
- Copy .env.example to .env.local
- Put your LongCat API key in LONGCAT_API_KEY

2) Run the app:
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## ✨ Features

- ChatGPT-style interface
- Next.js 14 with App Router
- LongCat API integration (server-side, secure)
- One-click Vercel deployment
- Mobile responsive design

## 🌐 After Deployment

Your app will be available at: https://your-project-name.vercel.app