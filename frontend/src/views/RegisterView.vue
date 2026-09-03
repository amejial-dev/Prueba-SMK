<script>
import GlassCard from '../components/GlassCard.vue'
import api from '../services/api'

export default {
  name: 'RegisterView',
  components: { GlassCard },
  data() {
    return {
      nombre: '',
      password: '',
      confirmPassword: '',
      rol: 'user',
      errorMessage: '',
      successMessage: '',
      loading: false,
    }
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = ''
      this.successMessage = ''

      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden.'
        return
      }

      this.loading = true
      try {
        await api.post('/auth/register', {
          nombre: this.nombre,
          contraseña: this.password,
          confirmarContraseña: this.confirmPassword,
          rol: this.rol,
        })
        this.successMessage = 'Registro exitoso. Ya puedes iniciar sesión.'
        this.nombre = ''
        this.password = ''
        this.confirmPassword = ''
        this.rol = 'user'
      } catch (err) {
        this.errorMessage =
          (err.response && err.response.data && err.response.data.error && err.response.data.error.message) ||
          'No se pudo completar el registro. Intenta más tarde.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <div class="register-view">
    <GlassCard class="register-card">
      <h1>Crear cuenta</h1>

      <form v-if="!successMessage" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="nombre">Nombre</label>
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
            autocomplete="new-password"
            required
          />
        </div>
        <div class="field">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="input-glass"
            autocomplete="new-password"
            required
          />
        </div>
        <div class="field">
          <label for="rol">Rol</label>
          <select id="rol" v-model="rol" class="input-glass">
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="btn-glass" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Registrarme' }}
        </button>
      </form>

      <div v-else class="success-block">
        <p class="success-message">{{ successMessage }}</p>
        <router-link to="/login" class="btn-glass link-btn">Ir a iniciar sesión</router-link>
      </div>

      <p v-if="!successMessage" class="alt-action">
        ¿Ya tienes cuenta?
        <router-link to="/login">Inicia sesión</router-link>
      </p>
    </GlassCard>
  </div>
</template>

<style scoped>
.register-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.register-card {
  max-width: 400px;
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

select.input-glass {
  appearance: none;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin: -0.5rem 0 1rem;
}

.success-message {
  color: var(--success-color);
  font-size: 0.95rem;
  margin: 0 0 1.25rem;
  text-align: center;
}

.success-block {
  text-align: center;
}

.link-btn {
  text-decoration: none;
  width: 100%;
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
