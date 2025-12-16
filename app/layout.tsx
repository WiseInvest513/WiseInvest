import type { Metadata } from 'next'
import { Inter, Nunito } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeAnimationProvider } from '@/components/ThemeAnimationContext'
import { siteConfig } from '@/config/site'

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500'],
  variable: '--font-inter' 
})
const nunito = Nunito({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito' 
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${nunito.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-page-bg font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeAnimationProvider>
            <SiteHeader />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <SiteFooter />
          </ThemeAnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
