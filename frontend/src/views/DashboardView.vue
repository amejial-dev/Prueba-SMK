<script>
import GlassCard from '../components/GlassCard.vue'
import { session, clearSession } from '../services/session'

export default {
  name: 'DashboardView',
  components: { GlassCard },
  data() {
    return {
      session,
    }
  },
  methods: {
    logout() {
      clearSession()
      this.$router.push('/login')
    },
  },
}
</script>

<template>
  <div class="dashboard-view">
    <GlassCard class="dashboard-card">
      <h1>Bienvenido{{ session.user && session.user.nombre ? `, ${session.user.nombre}` : '' }}</h1>
      <p v-if="session.user">Rol: {{ session.user.rol }}</p>
      <p class="placeholder-note">
        El dashboard de gestión de documentos CSV se implementa en otro change.
      </p>
      <button type="button" class="btn-glass" @click="logout">Cerrar sesión</button>
    </GlassCard>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.dashboard-card {
  max-width: 480px;
  width: 100%;
  text-align: center;
}

h1 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.placeholder-note {
  color: var(--text-color-muted);
  margin: 1rem 0 1.5rem;
}
</style>
