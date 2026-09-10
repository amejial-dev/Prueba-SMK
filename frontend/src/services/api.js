import axios from 'axios'
import router from '../router'
import { session, clearSession } from './session'

// El fallback es solo para desarrollo local sin Docker; en docker-compose.yml
// el servicio `frontend` inyecta VITE_API_URL vía `frontend/.env`.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  if (session.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearSession()
      if (router.currentRoute.value.name !== 'login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
