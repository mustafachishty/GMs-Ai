import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "GM's AI Chatbot",
  description: 'Professional AI chatbot with LongCat API integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}