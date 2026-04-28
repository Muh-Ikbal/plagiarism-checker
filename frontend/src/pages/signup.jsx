import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, ArrowRight, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi frontend
    if (username.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await authApi.register(username, email, password);
      setSuccess(true);
      // Redirect ke login setelah 2 detik
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
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
          <p className="text-slate-500 mt-2 font-medium">Buat akun baru</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">Registrasi berhasil! Mengalihkan ke halaman login...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Daftar Akun</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Isi form di bawah untuk membuat akun baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Username */}
              <div className="space-y-2 relative group">
                <Label htmlFor="username" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Username</Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="johndoe" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading || success}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 relative group">
                <Label htmlFor="signup-email" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Email</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="anda@email.com" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || success}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 relative group">
                <Label htmlFor="signup-password" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="Minimal 6 karakter" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || success}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 relative group">
                <Label htmlFor="confirm-password" className="text-slate-700 font-semibold transition-colors group-focus-within:text-teal-700">Konfirmasi Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Ulangi password" 
                    className="pl-10 py-6 bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:ring-teal-600/20 focus-visible:border-teal-600 transition-all rounded-xl"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || success}
                className="w-full py-6 mt-2 rounded-xl text-md font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Link ke Login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                  Masuk di sini
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
