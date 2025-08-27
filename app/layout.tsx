import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Dashboard • Supabase',
  description: 'Live-Dashboard für Supabase public.measurements',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-dvh bg-neutral-950 text-neutral-50 antialiased selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  )
}

