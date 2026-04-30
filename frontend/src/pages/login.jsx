import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Lock, ArrowRight, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      // Redirect berdasarkan role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Brand Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-600 p-3 rounded-2xl mb-4 shadow-sm">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Word<span className="text-teal-600">Lens</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Masuk ke akun Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Selamat Datang</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 relative group">
                <Label htmlFor="email" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Email</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="anda@email.com" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Password</Label>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 mt-2 rounded-xl text-md font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Link ke Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} WordLens. Hak cipta dilindungi.
        </div>
      </div>
    </div>
  );
}
