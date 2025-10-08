# GM's AI Chatbot

Professional ChatGPT/Gemini-style AI chatbot with LongCat API integration.

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Method 2: GitHub + Vercel
1. Upload this folder to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Import from GitHub
4. Deploy automatically

## 📁 Files Structure
```
GM's-Ai/
├── index.html          # Main chatbot interface
├── script.js           # Frontend JavaScript
├── styles.css          # Styling
├── api/chat.js         # Vercel serverless function
├── vercel.json         # Vercel configuration
├── package.json        # Dependencies
└── README.md           # This file
```

## 🔧 Local Development
```bash
npm install
npm start
# Open http://localhost:3000
```

## ✨ Features
- Professional ChatGPT/Gemini-style interface
- Chat sessions with rename/delete
- Mobile responsive design
- LongCat API integration
- Smooth animations

## 🌐 Live Demo
After deployment: `https://your-project-name.vercel.app`