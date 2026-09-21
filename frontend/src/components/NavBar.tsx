'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HexagonIcon, DashboardIcon, PackageIcon, BeakerIcon, UsersIcon } from '@/components/Icons';

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
    { href: '/precios', label: 'Costos y Precios', icon: <HexagonIcon /> },
    ...(role === 'SUPER_ADMIN' ? [{ href: '/usuarios', label: 'Usuarios', icon: <UsersIcon /> }] : []),
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group" onClick={() => setOpen(false)}>
          <div className="p-2 bg-gradient-to-tr from-[#2c4c3b] to-[#3a634d] rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 text-[#fffdf5]">
            <HexagonIcon />
          </div>
          <span className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#2c4c3b] to-[#e07a5f]">
            Selva Maya
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-2 items-center font-medium">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200
                ${isActive(href)
                  ? 'bg-[#2c4c3b] text-white shadow-md'
                  : 'text-[#2c4c3b]/80 hover:bg-[#2c4c3b]/10 hover:text-[#2c4c3b]'
                }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Hamburger button - mobile only */}
        <button
          id="nav-hamburger"
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-[#2c4c3b]/10 hover:bg-[#2c4c3b]/20 transition-colors"
          aria-label="Abrir menú"
        >
          <span className={`block w-5 h-0.5 bg-[#2c4c3b] transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#2c4c3b] my-1 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#2c4c3b] transition-all duration-300 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
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
                  ? 'bg-[#2c4c3b] text-white shadow-md'
                  : 'text-[#2c4c3b]/80 hover:bg-[#2c4c3b]/10 hover:text-[#2c4c3b]'
                }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
