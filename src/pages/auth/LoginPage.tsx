import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Loader2, X, Info } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { loginRequest, msalConfig } from '@/config/msalConfig';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { role: 'Employee',   email: 'aman@atomberg.com',   color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { role: 'Manager',    email: 'rahul@atomberg.com',  color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { role: 'Admin / HR', email: 'kavita@atomberg.com', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
];

const FEATURES = [
  { icon: '🎯', text: 'SMART Goal Creation' },
  { icon: '✅', text: 'Manager Approval Workflow' },
  { icon: '📊', text: 'Quarterly Check-ins & Analytics' },
  { icon: '🔔', text: 'Teams & Email Notifications' },
  { icon: '🛡️', text: 'Azure AD SSO Ready' },
];

const LoginPage: React.FC = () => {
  const navigate  = useNavigate();
  const { login } = useAuthStore();
  const { instance: msalInstance } = useMsal();
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [showAzureInfo, setShowAzureInfo] = useState(false);

  // Detect if Azure AD is configured with real credentials
  const isAzureConfigured = (() => {
    try {
      const auth = msalConfig.auth;
      return auth.clientId &&
        auth.clientId !== 'your-azure-client-id' &&
        !auth.clientId.includes('your-') &&
        auth.authority &&
        !auth.authority.includes('your-tenant-id');
    } catch { return false; }
  })();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(data.email, data.password);
    setLoading(false);
    if (!result.success) { toast.error(result.error || 'Login failed'); return; }
    const user = useAuthStore.getState().user;
    toast.success(`Welcome back, ${user?.name?.split(' ')[0]}!`);
    navigate(`/${user?.role}`);
  };

  const handleMsalLogin = async () => {
    // If not configured, show info modal instead of crashing to Microsoft error page
    if (!isAzureConfigured) {
      setShowAzureInfo(true);
      return;
    }
    setSsoLoading(true);
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      const account  = response.account;
      if (!account) throw new Error('No account returned');
      const email  = account.username;
      const result = login(email, 'demo123');
      if (result.success) {
        const user = useAuthStore.getState().user;
        toast.success(`Welcome, ${user?.name?.split(' ')[0]}! Signed in via Microsoft`);
        navigate(`/${user?.role}`);
      } else {
        toast.success(`Signed in as ${account.name} via Azure AD`);
        login('aman@atomberg.com', 'demo123');
        navigate('/employee');
      }
    } catch (err: any) {
      if (err.errorCode !== 'user_cancelled') {
        toast.error('Azure AD sign-in failed. Use demo login below.');
      }
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex gap-0 bg-white rounded-3xl shadow-elevated overflow-hidden">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-violet-600 to-violet-800 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute bottom-20 -left-10 w-64 h-64 bg-white/5 rounded-full" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold text-lg">AtomQuest</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-3">Set goals.<br />Track progress.<br />Achieve more.</h2>
            <p className="text-violet-200 text-sm leading-relaxed">
              The structured goal-setting and tracking portal for high-performing teams.
            </p>
          </div>
          <div className="relative space-y-2.5">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5">
                <span>{f.icon}</span>
                <span className="text-sm font-medium text-violet-100">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-8 md:p-10">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-zinc-900">AtomQuest</span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Welcome back 👋</h1>
          <p className="text-zinc-500 text-sm mb-6">Sign in to your Goal Tracker portal</p>

          {/* Azure AD SSO Button */}
          <button
            type="button"
            onClick={handleMsalLogin}
            disabled={ssoLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-zinc-200 hover:border-blue-300 hover:bg-blue-50 transition-all mb-4 group relative"
          >
            {ssoLoading ? (
              <Loader2 size={18} className="animate-spin text-blue-600" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
            )}
            <span className="text-sm font-semibold text-zinc-700 group-hover:text-blue-700">
              {ssoLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </span>
            <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isAzureConfigured
                ? 'bg-blue-100 text-blue-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {isAzureConfigured ? 'Azure AD' : 'Setup Required'}
            </span>
          </button>

          {/* Azure AD Info Modal */}
          {showAzureInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAzureInfo(false)} />
              <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Info size={17} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Azure AD SSO — Setup Required</h3>
                      <p className="text-xs text-zinc-500">Configure your Microsoft tenant to enable SSO</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAzureInfo(false)} className="p-1.5 rounded-lg hover:bg-zinc-100">
                    <X size={15} className="text-zinc-400" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Azure AD SSO is fully implemented using <strong>MSAL.js</strong>. To activate it, add your Microsoft tenant credentials:
                  </p>
                  <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs space-y-1">
                    <p className="text-zinc-400"># In <span className="text-amber-300">.env.local</span></p>
                    <p><span className="text-blue-400">VITE_AZURE_TENANT_ID</span>=<span className="text-emerald-400">your-actual-tenant-id</span></p>
                    <p><span className="text-blue-400">VITE_AZURE_CLIENT_ID</span>=<span className="text-emerald-400">your-actual-client-id</span></p>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-700">How to get these values:</p>
                    <p>1. Go to <strong>portal.azure.com</strong> → Azure Active Directory</p>
                    <p>2. App Registrations → New Registration → name it "AtomQuest"</p>
                    <p>3. Copy <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong></p>
                    <p>4. Add redirect URI: <code className="bg-zinc-100 px-1 rounded">http://localhost:5173</code></p>
                  </div>
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      💡 For this demo, use the <strong>Quick Demo Login</strong> buttons below instead.
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-zinc-100 flex justify-end gap-2">
                  <button onClick={() => setShowAzureInfo(false)} className="btn-secondary text-sm">Got it</button>
                  <button onClick={() => { setShowAzureInfo(false); (document.querySelector('button.\\!bg-violet-50') as HTMLButtonElement)?.click(); }}
                    className="btn-primary text-sm">Use Demo Login</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400">or use demo account</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Demo Quick Login */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} type="button" onClick={() => { setValue('email', acc.email); setValue('password', 'demo123'); }}
                  className={`text-xs font-medium py-2 px-3 rounded-xl border transition-all ${acc.color}`}>
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" placeholder="you@atomberg.com" className="input" autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Enter your password" className="input pr-11" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-xs text-violet-600 hover:text-violet-800 font-medium">Forgot password?</button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} />Sign In</>}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-zinc-400">
            Demo password: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
