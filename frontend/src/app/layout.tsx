import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import NavBar from '@/components/NavBar'
import PushNotificationSetup from '@/components/PushNotificationSetup'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Miel de las Abejas de la Selva Maya',
  description: 'Sistema de Gestión de Inventario Premium',
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
      <body className={`${outfit.variable} font-sans bg-gradient-to-br from-[#fffdf5] via-[#f1f6f3] to-[#e8f0eb] min-h-screen text-[#2c4c3b] selection:bg-[#e07a5f] selection:text-white`}>
        {/* Decorative background shapes */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#e07a5f] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob" />
          <div className="absolute top-1/3 -left-24 w-96 h-96 bg-[#2c4c3b] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-[#d4a373] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-4000" />
        </div>

        {token && <NavBar role={role} />}
        {token && <PushNotificationSetup />}

        <main className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${token ? 'pt-24 pb-12' : 'min-h-screen flex items-center justify-center'}`}>
          {children}
        </main>
      </body>
    </html>
  )
}
