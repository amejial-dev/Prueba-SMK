<script>
import api from '../services/api'

export default {
  name: 'CsvUploader',
  emits: ['uploaded', 'upload-error'],
  data() {
    return {
      dragging: false,
      loading: false,
    }
  },
  methods: {
    triggerFileSelect() {
      if (this.loading) return
      this.$refs.fileInput.click()
    },
    handleDragOver() {
      if (this.loading) return
      this.dragging = true
    },
    handleDragLeave() {
      this.dragging = false
    },
    handleDrop(event) {
      this.dragging = false
      if (this.loading) return
      const archivo = event.dataTransfer.files && event.dataTransfer.files[0]
      if (archivo) {
        this.uploadFile(archivo)
      }
    },
    handleFileChange(event) {
      const archivo = event.target.files && event.target.files[0]
      if (archivo) {
        this.uploadFile(archivo)
      }
      // Permite volver a seleccionar el mismo archivo dos veces seguidas.
      event.target.value = ''
    },
    async uploadFile(archivo) {
      this.loading = true
      const formData = new FormData()
      formData.append('file', archivo)

      try {
        const { data } = await api.post('/documents', formData)
        this.$emit('uploaded', data)
      } catch (err) {
        const detalle =
          (err.response && err.response.data && err.response.data.error) ||
          { message: 'No se pudo subir el archivo. Intenta más tarde.' }
        this.$emit('upload-error', detalle)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <div
    class="glass upload-zone"
    :class="{ 'upload-zone--dragging': dragging, 'upload-zone--loading': loading }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileSelect"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      class="hidden-input"
      @change="handleFileChange"
    />

    <p v-if="loading" class="upload-hint">Subiendo archivo...</p>
    <template v-else>
      <p class="upload-hint">Arrastra un archivo CSV aquí o haz clic para seleccionarlo</p>
      <p class="upload-subhint">Columnas esperadas: correo, nombre, telefono, ciudad, notas (opcional)</p>
    </template>
  </div>
</template>

<style scoped>
.upload-zone {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.upload-zone:hover {
  background: rgba(255, 255, 255, 0.14);
}

.upload-zone--dragging {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.6);
}

.upload-zone--loading {
  cursor: wait;
  opacity: 0.8;
}

.hidden-input {
  display: none;
}

.upload-hint {
  margin: 0;
  font-size: 1rem;
}

.upload-subhint {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--text-color-muted);
}
</style>
