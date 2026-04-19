import { useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#141414] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-[#E4E3E0]" />
          </div>
          <h1 className="font-serif text-4xl italic mb-2">LicitIA</h1>
          <p className="text-xs font-mono uppercase tracking-widest opacity-50">Consultoría Estratégica de Contratación Pública</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="font-serif text-2xl italic mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono text-sm"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-[#F5F5F3] border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest text-sm hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin" size={18} /> Entrando...</> : 'Entrar'}
          </button>

        </form>
      </div>
    </div>
  );
}
