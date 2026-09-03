import { reactive } from 'vue'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function readUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const session = reactive({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: readUser(),
})

export function setSession(token, user) {
  session.token = token
  session.user = user
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  session.token = null
  session.user = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return !!session.token
}

export function getRole() {
  return session.user ? session.user.rol : null
}
