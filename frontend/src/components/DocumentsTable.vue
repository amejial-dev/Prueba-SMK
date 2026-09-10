<script>
export default {
  name: 'DocumentsTable',
  props: {
    documents: {
      type: Array,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  emits: ['download', 'delete'],
  methods: {
    formatDate(fecha) {
      if (!fecha) return ''
      const date = new Date(fecha)
      if (Number.isNaN(date.getTime())) return fecha
      return date.toLocaleString()
    },
    getUserName(document) {
      return document.user && document.user.nombre ? document.user.nombre : '—'
    },
  },
}
</script>

<template>
  <div class="glass documents-table-wrapper">
    <div v-if="documents.length === 0" class="empty-state">
      <p>Todavía no hay documentos cargados.</p>
    </div>

    <table v-else class="documents-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Usuario</th>
          <th>Fecha de carga</th>
          <th>Registros</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="document in documents" :key="document.id">
          <td>{{ document.originalName }}</td>
          <td>{{ getUserName(document) }}</td>
          <td>{{ formatDate(document.uploadedAt) }}</td>
          <td>{{ document.recordCount }}</td>
          <td class="actions-cell">
            <button type="button" class="btn-glass btn-small" @click="$emit('download', document.id)">
              Descargar
            </button>
            <button
              v-if="role === 'admin'"
              type="button"
              class="btn-glass btn-small btn-danger"
              @click="$emit('delete', document.id)"
            >
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.documents-table-wrapper {
  padding: 1.5rem;
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  color: var(--text-color-muted);
  padding: 1.5rem 0;
}

.documents-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.documents-table th,
.documents-table td {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--glass-border);
  white-space: nowrap;
}

.documents-table th {
  color: var(--text-color-muted);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.btn-danger {
  color: var(--error-color);
}
</style>
