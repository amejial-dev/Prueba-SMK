<script>
import GlassCard from '../components/GlassCard.vue'
import CsvUploader from '../components/CsvUploader.vue'
import DocumentsTable from '../components/DocumentsTable.vue'
import api from '../services/api'
import { session, clearSession } from '../services/session'

export default {
  name: 'DashboardView',
  components: { GlassCard, CsvUploader, DocumentsTable },
  data() {
    return {
      session,
      documentos: [],
      errorCarga: null,
      successMessage: '',
    }
  },
  computed: {
    role() {
      return session.user ? session.user.rol : null
    },
  },
  mounted() {
    this.fetchDocuments()
  },
  methods: {
    logout() {
      clearSession()
      this.$router.push('/login')
    },
    async fetchDocuments() {
      try {
        const { data } = await api.get('/documents')
        this.documentos = data
      } catch {
        // El interceptor de api.js ya maneja el 401 global; para otros errores
        // dejamos la tabla como estaba y no bloqueamos la vista.
      }
    },
    handleUploaded() {
      this.errorCarga = null
      this.successMessage = 'Documento cargado correctamente.'
      this.fetchDocuments()
    },
    handleUploadError(detalle) {
      this.successMessage = ''
      this.errorCarga = detalle
    },
    async handleDownload(id) {
      const documento = this.documentos.find((doc) => doc.id === id)
      const nombreDescarga = documento ? documento.nombreOriginal : 'documento.csv'

      try {
        const response = await api.get(`/documents/${id}/download`, {
          responseType: 'blob',
        })
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = nombreDescarga
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch {
        this.errorCarga = { message: 'No se pudo descargar el documento.' }
      }
    },
    async handleDelete(id) {
      try {
        await api.delete(`/documents/${id}`)
        this.documentos = this.documentos.filter((doc) => doc.id !== id)
      } catch {
        this.errorCarga = { message: 'No se pudo eliminar el documento.' }
      }
    },
  },
}
</script>

<template>
  <div class="dashboard-view">
    <header class="dashboard-header glass">
      <div>
        <h1>Bienvenido{{ session.user && session.user.nombre ? `, ${session.user.nombre}` : '' }}</h1>
        <p v-if="session.user" class="role-label">Rol: {{ session.user.rol }}</p>
      </div>
      <button type="button" class="btn-glass" @click="logout">Cerrar sesión</button>
    </header>

    <GlassCard class="section-card">
      <h2>Cargar documento CSV</h2>
      <CsvUploader @uploaded="handleUploaded" @upload-error="handleUploadError" />

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

      <div v-if="errorCarga" class="error-message">
        <p>{{ errorCarga.message }}</p>
        <ul v-if="errorCarga.details && errorCarga.details.length" class="error-details">
          <li v-for="(detalle, index) in errorCarga.details" :key="index">
            fila {{ detalle.fila }}: {{ detalle.campo }} — {{ detalle.mensaje }}
          </li>
        </ul>
      </div>
    </GlassCard>

    <GlassCard class="section-card">
      <h2>Documentos cargados</h2>
      <DocumentsTable
        :documentos="documentos"
        :role="role"
        @download="handleDownload"
        @delete="handleDelete"
      />
    </GlassCard>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100vh;
  padding: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.4rem;
}

.role-label {
  margin: 0.25rem 0 0;
  color: var(--text-color-muted);
  font-size: 0.9rem;
}

.section-card h2 {
  margin: 0 0 1rem;
  font-size: 1.15rem;
}

.success-message {
  color: var(--success-color);
  font-size: 0.9rem;
  margin: 1rem 0 0;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin: 1rem 0 0;
}

.error-details {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
</style>
