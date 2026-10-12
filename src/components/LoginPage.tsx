import { Eye, EyeOff, LoaderCircle, Lock, Mail, MapPin, Phone, ShieldCheck, User, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import {
  authenticate,
  DEMO_CREDENTIALS,
  DESIGNATIONS,
  registerUser,
  type AuthUser,
} from '../auth/auth'
import { useI18n } from '../i18n/useI18n'
import { LanguageSelect } from './LanguageSelect'

interface LoginPageProps {
  /** Called with the user once signed in or newly registered. */
  onAuthenticated: (user: AuthUser) => void
}

type Mode = 'signin' | 'register'

/** Feature bullets shown on the brand panel (desktop only). */
const HIGHLIGHTS = [
  'Interactive crime mapping across demo precincts',
  'Automated risk zoning and 28-day forecasting',
  'Patrol dispatch planning and critical-incident alerts',
]

/** Text input with a leading icon, styled to the Police Blue theme. */
function Field({
  label,
  icon,
  ...props
}: { label: string; icon: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">{label}</span>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40">
        <span className="shrink-0 text-steel-400">{icon}</span>
        <input
          {...props}
          className="h-full min-w-0 flex-1 bg-transparent t-base text-steel-100 outline-none placeholder:text-steel-500"
        />
      </div>
    </label>
  )
}

/** Password input with a show/hide toggle. */
function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  return (
    <label className="block">
      <span className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">{label}</span>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40">
        <Lock className="size-4 shrink-0 text-steel-400" aria-hidden />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          required
          className="h-full min-w-0 flex-1 bg-transparent t-base text-steel-100 outline-none placeholder:text-steel-500"
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          aria-label={t(show ? 'Hide password' : 'Show password')}
          className="grid size-7 shrink-0 place-items-center rounded-full text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
        >
          {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </label>
  )
}

/**
 * Full-screen sign-in / registration gate for the demo console.
 *
 * There is no backend: sign-in validates against the demo account or a locally
 * registered officer account, and registration stores the new officer profile
 * (station, department ID, mobile, area …) in localStorage before signing in.
 */
export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('signin')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sign-in fields.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Registration fields.
  const [name, setName] = useState('')
  const [role, setRole] = useState(DESIGNATIONS[0])
  const [stationName, setStationName] = useState('')
  const [deptId, setDeptId] = useState('')
  const [mobile, setMobile] = useState('')
  const [area, setArea] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const handleSignIn = (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    // Short delay so the pending state is perceptible; validates synchronously.
    window.setTimeout(() => {
      const user = authenticate(email, password)
      if (user) {
        onAuthenticated(user)
      } else {
        setSubmitting(false)
        setError(t('Incorrect email or password. Use the demo credentials below.'))
      }
    }, 450)
  }

  const handleRegister = (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setError(null)
    if (regPassword !== confirmPassword) {
      setError(t('Passwords do not match.'))
      return
    }
    setSubmitting(true)
    const result = registerUser({
      name,
      role,
      stationName,
      deptId,
      mobile,
      area,
      email: regEmail,
      password: regPassword,
    })
    window.setTimeout(() => {
      if ('error' in result) {
        setSubmitting(false)
        setError(t(result.error))
      } else {
        onAuthenticated(result.user)
      }
    }, 350)
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setError(null)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-navy-950 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — decorative, hidden on small screens. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-police-navy p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-police-blue/30 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-police-blue shadow-[0_10px_30px_rgba(38,118,210,0.45)]">
            <ShieldCheck className="size-6 text-white" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="t-md font-bold tracking-[0.14em]">CRIMEMAP</p>
            <p className="t-xs uppercase tracking-[0.16em] text-white/60">
              {t('Crime Analytics Console')}
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="t-title font-bold leading-tight">
            {t('Safer cities start with clearer data.')}
          </h1>
          <p className="mt-3 t-base leading-relaxed text-white/75">
            {t(
              'Explore incident patterns, forecast risk and coordinate patrols from a single command view.',
            )}
          </p>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((line) => (
              <li key={line} className="flex items-start gap-2.5 t-sm text-white/85">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-police-teal" aria-hidden />
                <span>{t(line)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative t-xs text-white/50">
          {t('Demonstration environment · Synthetic data only')}
        </p>
      </aside>

      {/* Auth column. */}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-police-blue">
              <ShieldCheck className="size-5 text-white" aria-hidden />
            </span>
            <span className="t-md font-bold tracking-[0.12em] text-steel-100">CRIMEMAP</span>
          </div>
          <div className="ml-auto">
            <LanguageSelect />
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center px-5 pb-10 sm:px-8 lg:items-center">
          <div className="w-full max-w-md">
            {/* Mode switch. */}
            <div className="flex rounded-lg border border-navy-700 bg-navy-850 p-1">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                aria-pressed={mode === 'signin'}
                className={`flex-1 rounded-md px-3 py-2 t-sm font-semibold transition-colors ${
                  mode === 'signin'
                    ? 'bg-police-blue text-white'
                    : 'text-steel-300 hover:text-steel-100'
                }`}
              >
                {t('Sign in')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                aria-pressed={mode === 'register'}
                className={`flex-1 rounded-md px-3 py-2 t-sm font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-police-blue text-white'
                    : 'text-steel-300 hover:text-steel-100'
                }`}
              >
                {t('Register')}
              </button>
            </div>

            <h2 className="mt-5 t-view-title font-bold text-steel-100">
              {mode === 'signin' ? t('Sign in') : t('Create officer account')}
            </h2>
            <p className="mt-1.5 t-base leading-relaxed text-steel-300">
              {mode === 'signin'
                ? t('Enter your credentials to access the crime analytics console.')
                : t('Register your posting details to request console access.')}
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 t-sm font-medium text-risk-critical"
              >
                {error}
              </p>
            ) : null}

            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="mt-5 space-y-4" noValidate>
                <Field
                  label={t('Email')}
                  icon={<Mail className="size-4" aria-hidden />}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={DEMO_CREDENTIALS.email}
                  autoComplete="username"
                  required
                />
                <PasswordField
                  label={t('Password')}
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-police-blue t-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden />
                  )}
                  {submitting ? t('Signing in…') : t('Sign in')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-5 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('Full name')}
                    icon={<User className="size-4" aria-hidden />}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('e.g. R. Kumar')}
                    autoComplete="name"
                    required
                  />
                  <label className="block">
                    <span className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
                      {t('Designation')}
                    </span>
                    <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40">
                      <ShieldCheck className="size-4 shrink-0 text-steel-400" aria-hidden />
                      <select
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent t-base text-steel-100 outline-none"
                      >
                        {DESIGNATIONS.map((option) => (
                          <option key={option} value={option}>
                            {t(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <Field
                    label={t('Station name')}
                    icon={<ShieldCheck className="size-4" aria-hidden />}
                    value={stationName}
                    onChange={(event) => setStationName(event.target.value)}
                    placeholder={t('e.g. Central Precinct')}
                    required
                  />
                  <Field
                    label={t('Department ID')}
                    icon={<UserPlus className="size-4" aria-hidden />}
                    value={deptId}
                    onChange={(event) => setDeptId(event.target.value)}
                    placeholder={t('e.g. DEPT-0421')}
                    required
                  />
                  <Field
                    label={t('Mobile number')}
                    icon={<Phone className="size-4" aria-hidden />}
                    type="tel"
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder={t('e.g. +91 90000 00000')}
                    autoComplete="tel"
                    required
                  />
                  <Field
                    label={t('Area')}
                    icon={<MapPin className="size-4" aria-hidden />}
                    value={area}
                    onChange={(event) => setArea(event.target.value)}
                    placeholder={t('e.g. Mission Street')}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label={t('Email')}
                      icon={<Mail className="size-4" aria-hidden />}
                      type="email"
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      placeholder={t('name@police.gov.in')}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <PasswordField
                    label={t('Password')}
                    value={regPassword}
                    onChange={setRegPassword}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label={t('Confirm password')}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-police-blue t-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <UserPlus className="size-4" aria-hidden />
                  )}
                  {submitting ? t('Creating account…') : t('Create account')}
                </button>
              </form>
            )}

            {/* Demo affordance so reviewers don't have to guess the login. */}
            {mode === 'signin' ? (
              <div className="mt-5 rounded-lg border border-navy-700 bg-navy-850 px-3 py-3">
                <p className="t-xs leading-relaxed text-steel-500">
                  {t('Demo access — no real credentials required.')}
                </p>
                <p className="mt-1.5 t-sm leading-relaxed text-steel-300">
                  <span className="font-semibold text-steel-200">{t('Email')}:</span>{' '}
                  {DEMO_CREDENTIALS.email}
                  <br />
                  <span className="font-semibold text-steel-200">{t('Password')}:</span>{' '}
                  {DEMO_CREDENTIALS.password}
                </p>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 t-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600/10"
                >
                  {t('Use demo credentials')}
                </button>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="px-5 pb-5 sm:px-8">
          <p className="t-xs leading-relaxed text-steel-500">
            {t('This is a simulated demonstration. Do not enter real or sensitive credentials.')}
          </p>
        </footer>
      </div>
    </div>
  )
}
