/**
 * Client-side demo authentication and registration.
 *
 * CRIMEMAP ships as an offline demo with no backend, so this module fakes
 * accounts entirely in the browser. A fixed demo account always works, and new
 * "officer" accounts registered from the sign-in screen are persisted in
 * localStorage. This is NOT real security — credentials are stored locally in
 * plain text and never sent anywhere. Do not reuse for production.
 */

export interface AuthUser {
  name: string
  role: string
  email: string
  initials: string
  /** Posting details captured at registration. */
  stationName: string
  deptId: string
  mobile: string
  area: string
}

/** Registration payload collected by the sign-up form. */
export interface RegistrationInput {
  name: string
  role: string
  stationName: string
  deptId: string
  mobile: string
  area: string
  email: string
  password: string
}

/** Designations offered on the sign-up form. */
export const DESIGNATIONS = [
  'Station Officer',
  'Field Officer',
  'Crime Analyst',
  'Supervisor',
]

/** The always-available account accepted by the demo sign-in screen. */
export const DEMO_CREDENTIALS = {
  email: 'demo.analyst@police.gov.in',
  password: 'crimemap',
}

export const DEMO_USER: AuthUser = {
  name: 'Demo Analyst',
  role: 'Crime Analyst',
  email: DEMO_CREDENTIALS.email,
  initials: 'DA',
  stationName: 'Central Precinct',
  deptId: 'DEPT-0001',
  mobile: '+91 90000 00000',
  area: 'Central District',
}

/** Session key is per-tab so closing the tab signs the user out. */
const SESSION_KEY = 'crimemap.session'
/** Registered officer accounts persist across tabs and reloads. */
const USERS_KEY = 'crimemap.users'

interface StoredAccount extends AuthUser {
  password: string
}

/** Project a stored account down to the public user shape (drops password). */
function toUser(account: StoredAccount): AuthUser {
  return {
    name: account.name,
    role: account.role,
    email: account.email,
    initials: account.initials,
    stationName: account.stationName,
    deptId: account.deptId,
    mobile: account.mobile,
    area: account.area,
  }
}

/** Derive up-to-two-letter initials from a full name. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(accounts))
  } catch {
    /* storage unavailable (private mode) — account is not persisted */
  }
}

/** Strip formatting from a phone number and check it looks plausible. */
function normalizeMobile(mobile: string): string {
  return mobile.replace(/[^\d+]/g, '')
}

/** Result of a registration attempt: either a user or a readable error. */
export type RegisterResult = { user: AuthUser } | { error: string }

/**
 * Validate and persist a new officer account.
 *
 * Returns `{ user }` on success (ready to sign in) or `{ error }` with an
 * English message the form displays via `t()`.
 */
export function registerUser(input: RegistrationInput): RegisterResult {
  const name = input.name.trim()
  const stationName = input.stationName.trim()
  const deptId = input.deptId.trim().toUpperCase()
  const area = input.area.trim()
  const email = input.email.trim().toLowerCase()
  const mobile = normalizeMobile(input.mobile)
  const password = input.password

  if (!name) return { error: 'Please enter your full name.' }
  if (!stationName) return { error: 'Please enter your station name.' }
  if (!deptId) return { error: 'Please enter your department ID.' }
  if (!/^\+?\d{10,15}$/.test(mobile)) {
    return { error: 'Please enter a valid mobile number (10–15 digits).' }
  }
  if (!area) return { error: 'Please enter your area of jurisdiction.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const accounts = readAccounts()
  const takenByDemo = email === DEMO_CREDENTIALS.email
  if (takenByDemo || accounts.some((account) => account.email === email)) {
    return { error: 'An account with this email already exists.' }
  }
  if (accounts.some((account) => account.deptId.toUpperCase() === deptId)) {
    return { error: 'This department ID is already registered.' }
  }

  const account: StoredAccount = {
    name,
    role: input.role || DESIGNATIONS[1],
    email,
    initials: initialsFrom(name),
    stationName,
    deptId,
    mobile,
    area,
    password,
  }
  writeAccounts([...accounts, account])

  return { user: toUser(account) }
}

/** Validate credentials against the demo account or a registered account. */
export function authenticate(email: string, password: string): AuthUser | null {
  const normalized = email.trim().toLowerCase()
  if (normalized === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    return DEMO_USER
  }
  const match = readAccounts().find(
    (account) => account.email === normalized && account.password === password,
  )
  if (!match) return null
  return toUser(match)
}

/** Restore a previously signed-in user for this browser tab, if any. */
export function readSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function writeSession(user: AuthUser): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable (e.g. private mode) — session stays in memory only */
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
