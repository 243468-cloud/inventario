'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HexagonIcon, DashboardIcon, PackageIcon, BeakerIcon, UsersIcon, PackageMinusIcon } from '@/components/Icons';

interface NavBarProps {
  role?: string;
}

export default function NavBar({ role }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { href: '/almacen', label: 'Almacén', icon: <HexagonIcon /> }, // Using HexagonIcon for raw materials
    { href: '/presentaciones', label: 'Presentaciones', icon: <PackageIcon /> },
    { href: '/produccion', label: 'Producción', icon: <BeakerIcon /> },
    { href: '/salidas', label: 'Salidas', icon: <PackageMinusIcon /> },
    { href: '/precios', label: 'Costos y Precios', icon: <HexagonIcon /> },
    ...(role === 'SUPER_ADMIN' ? [{ href: '/usuarios', label: 'Usuarios', icon: <UsersIcon /> }] : []),
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ── DESKTOP NAVBAR (Top) ── */}
      <nav className="hidden md:flex fixed w-full z-50 top-0 bg-white/80 backdrop-blur-md border-b border-amber-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 w-full flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900 flex items-center justify-center text-white shadow-sm">
              <HexagonIcon className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-amber-900">
              Selva Maya
            </span>
          </Link>

          {/* Desktop links */}
          <div className="flex space-x-1 items-center">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${isActive(href)
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-sm'
                    : 'text-amber-700 hover:bg-amber-50 hover:text-amber-900'
                  }`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Lax';
                document.cookie = 'user_role=; Max-Age=0; path=/; SameSite=Lax';
                try { localStorage.clear(); } catch {}
                window.location.replace('/login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors ml-2"
            >
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE HEADER (Top) ── */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-900 flex items-center justify-center text-white shadow-sm">
            <HexagonIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-black tracking-tight text-amber-900">
            Selva Maya
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs border border-amber-200">
          {role === 'SUPER_ADMIN' ? 'AD' : 'US'}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <div className="md:hidden fixed bottom-0 w-full z-50 bg-white/95 backdrop-blur-xl border-t border-amber-100 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {links.slice(0, 3).map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
                ${isActive(href) ? 'text-amber-600' : 'text-amber-900/40 hover:text-amber-900/60'}`}
            >
              <div className={`${isActive(href) ? 'bg-amber-100 text-amber-700' : ''} p-1.5 rounded-xl transition-all`}>
                {icon}
              </div>
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          ))}
          
          {/* "Más" Tab */}
          <button
            onClick={() => setOpen(!open)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
              ${open ? 'text-amber-600' : 'text-amber-900/40 hover:text-amber-900/60'}`}
          >
            <div className={`${open ? 'bg-amber-100 text-amber-700' : ''} p-1.5 rounded-xl transition-all`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-wide">Más</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE "MÁS" SLIDE-UP MENU ── */}
      {/* Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 z-40 bg-amber-900/20 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setOpen(false)}
      />
      
      {/* Drawer */}
      <div className={`md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out transform ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-amber-200 rounded-full mx-auto my-3" />
        <div className="px-6 pb-8 pt-2 flex flex-col gap-2">
          <h3 className="text-xs font-black text-amber-800/60 uppercase tracking-widest mb-2 px-2">Más Opciones</h3>
          
          {links.slice(3).map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                ${isActive(href)
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'text-amber-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
            >
              <div className={isActive(href) ? 'text-amber-700' : 'text-amber-500'}>
                {icon}
              </div>
              <span>{label}</span>
            </Link>
          ))}

          <div className="h-px w-full bg-amber-100 my-2" />

          <button
            onClick={() => {
              document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Lax';
              document.cookie = 'user_role=; Max-Age=0; path=/; SameSite=Lax';
              try { localStorage.clear(); } catch {}
              window.location.replace('/login');
            }}
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all text-left mt-2"
          >
            <div className="text-red-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
