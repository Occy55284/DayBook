import './globals.css'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import NavBar from './components/NavBar'
import ShareButton from './components/ShareButton'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata = {
  title: 'GMC Tracker',
  description: 'Hospitality charging capture and reporting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <Image src="/logo.png" alt="GMC Tracker" width={42} height={42} className="brand-mark" priority />
              <span className="brand-text">
                <span className="brand-title">GMC Tracker</span>
                <span className="brand-sub">Hospitality charging</span>
              </span>
            </div>
            <NavBar />
            <ShareButton />
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  )
}
