import './globals.css'

export const metadata = {
  title: "GM's AI Chatbot",
  description: 'Professional AI chatbot with LongCat API integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}