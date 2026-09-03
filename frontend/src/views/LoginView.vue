<script>
import GlassCard from '../components/GlassCard.vue'
import api from '../services/api'
import { setSession } from '../services/session'

export default {
  name: 'LoginView',
  components: { GlassCard },
  data() {
    return {
      nombre: '',
      password: '',
      errorMessage: '',
      loading: false,
    }
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = ''
      this.loading = true
      try {
        const { data } = await api.post('/auth/login', {
          nombre: this.nombre,
          contraseña: this.password,
        })
        setSession(data.token, data.user)
        this.$router.push('/')
      } catch (err) {
        this.errorMessage =
          (err.response && err.response.data && err.response.data.error && err.response.data.error.message) ||
          'No se pudo iniciar sesión. Verifica tus credenciales o intenta más tarde.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <div class="login-view">
    <GlassCard class="login-card">
      <h1>Iniciar sesión</h1>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="nombre">Usuario</label>
          <input
            id="nombre"
            v-model="nombre"
            type="text"
            class="input-glass"
            autocomplete="username"
            required
          />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input-glass"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="btn-glass" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="alt-action">
        ¿No tienes cuenta?
        <router-link to="/register">Regístrate</router-link>
      </p>
    </GlassCard>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.login-card {
  max-width: 380px;
  width: 100%;
}

h1 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  text-align: center;
}

.field {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.9rem;
  color: var(--text-color-muted);
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin: -0.5rem 0 1rem;
}

button[type='submit'] {
  width: 100%;
}

.alt-action {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-color-muted);
}

.alt-action a {
  color: var(--text-color);
  font-weight: 600;
}
</style>
