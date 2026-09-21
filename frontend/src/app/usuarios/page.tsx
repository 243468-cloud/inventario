'use client';

import { useState, useEffect } from 'react';

import { UserPlusIcon, UsersGroupIcon, TrashIcon } from '@/components/Icons';
import { Usuario } from '@/types';
import { apiFetch } from '@/lib/apiClient';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchUsuarios() {
    try {
      const res = await apiFetch('/users');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch {
      console.error("Error fetching usuarios");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsuarios();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
      });
      if (res.ok) {
        setUsername('');
        setPassword('');
        setRole('USER');
        fetchUsuarios();
      } else {
        const data = await res.json();
        setError(data.message || 'Error al crear usuario');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const res = await apiFetch(`/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsuarios();
      } else {
        const data = await res.json();
        alert(data.message || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center bg-white/60 p-6 rounded-3xl border border-white backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2c4c3b] to-[#4a7c59] bg-clip-text text-transparent">
            Gestión de Usuarios
          </h1>
          <p className="text-[#2c4c3b]/60 mt-1 font-medium">Panel de control Super Admin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Formulario Crear Usuario */}
        <div className="md:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e07a5f]/10 to-[#f4a261]/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h2 className="text-xl font-bold mb-6 text-[#2c4c3b] flex items-center gap-2">
              <UserPlusIcon className="text-[#e07a5f]" />
              Nuevo Usuario
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2c4c3b]/80">Usuario</label>
                <input
                  type="text"
                  required
                  pattern="^[A-Za-z0-9_]{3,20}$"
                  title="Solo letras, números y guiones bajos (3-20 caracteres)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none bg-white/60 shadow-inner focus:ring-2 focus:ring-[#e07a5f]/30 transition-all outline-none"
                  placeholder="ej. empleado1"
                  minLength={3}
                  maxLength={20}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2c4c3b]/80">Contraseña</label>
                <input
                  type="password"
                  required
                  pattern="^[^<>]{8,50}$"
                  title="La contraseña no debe contener los caracteres < o > y debe tener mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none bg-white/60 shadow-inner focus:ring-2 focus:ring-[#e07a5f]/30 transition-all outline-none"
                  placeholder="********"
                  minLength={8}
                  maxLength={50}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2c4c3b]/80">Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none bg-white/60 shadow-inner focus:ring-2 focus:ring-[#e07a5f]/30 transition-all outline-none"
                >
                  <option value="USER">Empleado (USER)</option>
                  <option value="SUPER_ADMIN">Administrador (SUPER_ADMIN)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-[#e07a5f] to-[#f4a261] text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="md:col-span-2">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 h-full">
            <h2 className="text-xl font-bold mb-6 text-[#2c4c3b] flex items-center gap-2">
              <UsersGroupIcon className="text-[#81b29a]" />
              Usuarios Registrados
            </h2>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#2c4c3b]/5 text-[#2c4c3b] font-semibold border-b border-black/5">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-[#81b29a]/5 transition-colors">
                      <td className="px-6 py-4 text-[#2c4c3b]/60">#{u.id}</td>
                      <td className="px-6 py-4 font-medium text-[#2c4c3b]">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${u.role === 'SUPER_ADMIN' ? 'bg-[#e07a5f]/10 text-[#e07a5f]' : 'bg-[#81b29a]/20 text-[#2c4c3b]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== 1 && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Eliminar usuario"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
