import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import NavBar from '@/components/NavBar'
import PushNotificationSetup from '@/components/PushNotificationSetup'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const viewport: Viewport = {
  themeColor: '#fffdf5',
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Miel de las Abejas de la Selva Maya',
  description: 'Sistema de Gestión de Inventario Premium',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Selva Maya',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('user_role')?.value;

  return (
    <html lang="es">
      <head>
        {/* iOS Apple Touch Icon - REQUIRED for home screen icon on iPhone/iPad */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png?v=2" />
        <link rel="shortcut icon" href="/apple-touch-icon.png?v=2" />
      </head>
      <body className={`${outfit.variable} font-sans bg-[#fafaf9] min-h-screen text-stone-900 selection:bg-stone-800 selection:text-white`}>

        {token && <NavBar role={role} />}
        {token && <PushNotificationSetup />}

        <main className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${token ? 'pt-24 pb-12' : 'min-h-screen flex items-center justify-center'}`}>
          {children}
        </main>
      </body>
    </html>
  )
}
