<script>
export default {
  name: 'GlassCard',
  props: {
    padded: {
      type: Boolean,
      default: true,
    },
  },
}
</script>

<template>
  <div class="glass glass-card" :class="{ 'glass-card--padded': padded }">
    <slot />
  </div>
</template>

<style scoped>
.glass-card {
  width: 100%;
}

.glass-card--padded {
  padding: 2rem;
}
</style>
