import { useState, type FormEvent } from 'react';
import { Building2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignInView: React.FC = () => {
  const { signIn, completeSetup, needsSetup } = useAuth();
  const [isSetupMode, setIsSetupMode] = useState(needsSetup);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (isSetupMode) {
      if (password.length < 8) {
        setError('يجب أن تتكون كلمة السر من 8 أحرف على الأقل.');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمتا السر غير متطابقتين.');
        return;
      }
    }

    setIsSubmitting(true);
    const message = isSetupMode
      ? await completeSetup({ username: username.trim(), full_name: fullName.trim(), password })
      : await signIn(username.trim(), password);
    setIsSubmitting(false);

    if (message) setError(message);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900" dir="rtl">
      <div className="h-1 bg-emerald-700" />
      <div className="grid min-h-[calc(100vh-4px)] lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.9fr)]">
        <section className="hidden flex-col justify-between bg-[#102b36] px-12 py-10 text-white lg:flex xl:px-20">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-emerald-300">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-300">AREF ORIENTAL</p>
              <p className="text-sm font-bold">الأكاديمية الجهوية لجهة الشرق</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold tracking-wide text-emerald-300">منصة إدارية</p>
            <h1 className="text-3xl font-bold leading-relaxed">
              تدبير السكن الإداري والوظيفي
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              الأكاديمية الجهوية للتربية والتكوين لجهة الشرق
            </p>
            <div className="mt-8 h-px w-24 bg-emerald-500/70" />
            <p className="mt-4 text-xs text-slate-400">المذكرة الوزارية رقم 40</p>
          </div>

          <p className="text-[11px] text-slate-400">وجدة · المملكة المغربية</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-2xl">
            <div className="mb-7 flex justify-center">
              <img
                src="/images/header-720.webp"
                width={720}
                height={254}
                alt="logo الأكاديمية الجهوية للتربية والتكوين لجهة الشرق"
                className="h-auto w-full rounded-lg border border-slate-200 bg-white object-contain px-4 py-3 shadow-sm"
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {isSetupMode ? (
                <div className="mb-7">
                  <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>أول تشغيل: يجب ضبط حساب مسؤول النظام قبل استعمال المنصة.</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-950">ضبط حساب مسؤول النظام</h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    هذا الحساب هو الوحيد القادر على إنشاء حسابات المدققين والمديريات الإقليمية.
                  </p>
                </div>
              ) : (
                <div className="mb-7">
                  <h2 className="text-xl font-bold text-slate-950">تسجيل الدخول</h2>
                  <p className="mt-1.5 text-sm text-slate-500">أدخل بيانات حسابك للمتابعة إلى المنصة.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="signin-username" className="block text-xs font-semibold text-slate-700">
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      required
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder={isSetupMode ? 'مثال: admin_aref' : 'مثال: dev_admin'}
                      className="h-11 w-full rounded-md border border-slate-300 bg-white pr-10 pl-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                    />
                  </div>
                </div>

                {isSetupMode && (
                  <div className="space-y-1.5">
                    <label htmlFor="signin-fullname" className="block text-xs font-semibold text-slate-700">
                      الاسم الكامل
                    </label>
                    <input
                      id="signin-fullname"
                      name="full_name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="مثال: المسؤول التقني للنظام"
                      className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="signin-password" className="block text-xs font-semibold text-slate-700">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={isSetupMode ? '8 أحرف على الأقل' : 'أدخل كلمة المرور'}
                      className="h-11 w-full rounded-md border border-slate-300 bg-white py-2 pr-10 pl-11 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSetupMode && (
                  <div className="space-y-1.5">
                    <label htmlFor="signin-confirm" className="block text-xs font-semibold text-slate-700">
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="signin-confirm"
                        name="password_confirmation"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="أعد كتابة كلمة المرور"
                        className="h-11 w-full rounded-md border border-slate-300 bg-white pr-10 pl-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-800 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'جارٍ التحقق…'
                    : isSetupMode
                      ? 'ضبط الحساب والدخول'
                      : 'تسجيل الدخول'}
                </button>
              </form>

              {needsSetup && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSetupMode((mode) => !mode)}
                    className="text-[11px] font-semibold text-slate-500 underline-offset-4 hover:text-emerald-800 hover:underline"
                  >
                    {isSetupMode
                      ? 'ضُبط الحساب مسبقًا؟ انتقل إلى تسجيل الدخول'
                      : 'هذا أول تشغيل؟ اضبط حساب مسؤول النظام'}
                  </button>
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] leading-5 text-slate-500">
                <p>الدخول إلى المنصة مقصور على الحسابات المفعّلة، وكل محاولة تُسجَّل في سجلّ الدخول.</p>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400">AREF Oriental · Gestion des logements</p>
          </div>
        </section>
      </div>
    </main>
  );
};
