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
    <nav className="fixed w-full z-50 top-0 bg-white/80 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
            <HexagonIcon className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-stone-900">
            Selva Maya
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-1 items-center">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isActive(href)
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors ml-2"
          >
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Hamburger button - mobile only */}
        <button
          id="nav-hamburger"
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
          aria-label="Abrir menú"
        >
          <span className={`block w-5 h-0.5 bg-stone-900 transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-stone-900 my-1 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-stone-900 transition-all duration-300 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive(href)
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
          >
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
