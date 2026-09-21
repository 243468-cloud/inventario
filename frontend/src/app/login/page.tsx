'use client';
import { useState } from 'react';
import { HexagonIcon } from '@/components/Icons';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const reset = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        document.cookie = `auth_token=${data.accessToken}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `user_role=${data.role}; path=/; max-age=86400; SameSite=Strict`;
        router.push('/');
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Cuenta creada! Ya puedes iniciar sesión.');
        setTimeout(() => reset('login'), 1500);
      } else {
        setError(data.message || 'Error al registrar usuario.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center relative perspective-1000">
      {/* Decorative floating shapes */}
      <div className="absolute top-1/4 left-[15%] text-[#e07a5f]/15 animate-float hidden md:block"><HexagonIcon /></div>
      <div className="absolute bottom-1/4 right-[20%] text-[#2c4c3b]/10 animate-float-delayed hidden md:block scale-150"><HexagonIcon /></div>
      <div className="absolute top-10 right-[30%] text-[#d4a373]/20 animate-float hidden md:block scale-75"><HexagonIcon /></div>

      <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_30px_80px_-20px_rgba(44,76,59,0.2)] border border-white/60 w-full max-w-md opacity-0 animate-slide-up-fade relative z-10 overflow-hidden group">
        {/* Shine sweep effect */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 group-hover:translate-x-[200%] transition-all duration-1000 ease-in-out pointer-events-none transform -skew-x-12 -translate-x-[150%]" />

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 opacity-0 animate-slide-up-fade delay-100">
          <div className="p-4 bg-gradient-to-tr from-[#2c4c3b] to-[#3a634d] rounded-2xl shadow-xl shadow-[#2c4c3b]/30 text-[#fffdf5] mb-4 transform -rotate-6 group-hover:rotate-12 transition-transform duration-700 ease-out">
            <HexagonIcon />
          </div>
          <h1 className="text-3xl font-black text-[#2c4c3b] tracking-tight">
            {mode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
          </h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">
            {mode === 'login' ? 'Accede al Sistema de Inventario' : 'Regístrate como empleado'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6 gap-1">
          <button
            id="tab-login"
            type="button"
            onClick={() => reset('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              mode === 'login'
                ? 'bg-white text-[#2c4c3b] shadow-sm'
                : 'text-gray-500 hover:text-[#2c4c3b]'
            }`}
          >
            Ingresar
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => reset('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              mode === 'register'
                ? 'bg-white text-[#2c4c3b] shadow-sm'
                : 'text-gray-500 hover:text-[#2c4c3b]'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-4 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 border border-green-100 p-3 rounded-xl mb-4 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Usuario</label>
            <input
              id="input-username"
              type="text"
              required
              pattern="^[A-Za-z0-9_]{3,20}$"
              title="Solo letras, números y guiones bajos (3-20 caracteres)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-[#2c4c3b]/20 focus:border-[#2c4c3b] transition-all font-medium text-[#2c4c3b] hover:bg-white/80"
              placeholder={mode === 'login' ? 'Tu usuario' : 'Elige un nombre de usuario'}
              minLength={3}
              maxLength={20}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Contraseña</label>
            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                required
                pattern="^[^<>]{6,50}$"
                title="La contraseña no debe contener los caracteres < o >"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 rounded-xl p-4 pr-12 focus:outline-none focus:ring-4 focus:ring-[#2c4c3b]/20 focus:border-[#2c4c3b] transition-all font-medium text-[#2c4c3b] hover:bg-white/80"
                placeholder="••••••••"
                minLength={6}
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2c4c3b] transition-colors p-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Confirmar Contraseña</label>
              <input
                id="input-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                pattern="^[^<>]{6,50}$"
                title="La contraseña no debe contener los caracteres < o >"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-[#2c4c3b]/20 focus:border-[#2c4c3b] transition-all font-medium text-[#2c4c3b] hover:bg-white/80"
                placeholder="Repite tu contraseña"
                minLength={6}
                maxLength={50}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-submit"
              type="submit"
              disabled={isLoading}
              className="relative overflow-hidden w-full bg-gradient-to-r from-[#e07a5f] to-[#d46d53] text-white font-bold text-base py-4 rounded-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 group/btn"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </>
                ) : mode === 'login' ? 'Ingresar al Sistema' : 'Crear mi Cuenta'}
              </span>
            </button>
          </div>
        </form>

        {mode === 'register' && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Al registrarte tendrás acceso como empleado.<br/>
            Solo el administrador puede cambiar tu rol.
          </p>
        )}
      </div>
    </div>
  );
}
