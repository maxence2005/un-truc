<script setup lang="ts">
import { computed } from 'vue'
import type { Annotation } from '../types'
import DraggableAnnotation from './DraggableAnnotation.vue'

interface Props {
  pageNumber: number
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
  annotations: Annotation[]
  selectedId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => [],
  selectedId: null
})

const emit = defineEmits<{
  (e: 'update:annotation', annotation: Annotation): void
  (e: 'delete', id: string): void
  (e: 'select', id: string): void
}>()

const effectiveWidth = computed(() => props.containerWidth ?? props.width ?? 0)
const effectiveHeight = computed(() => props.containerHeight ?? props.height ?? 0)

const pageAnnotations = computed(() => {
  return props.annotations.filter((ann) => ann.pageNumber === props.pageNumber)
})
</script>

<template>
  <div
    class="pdf-overlay-layer"
    :data-overlay-page="pageNumber"
  >
    <template v-if="effectiveWidth > 0 && effectiveHeight > 0">
      <DraggableAnnotation
        v-for="annotation in pageAnnotations"
        :key="annotation.id"
        :annotation="annotation"
        :container-width="effectiveWidth"
        :container-height="effectiveHeight"
        :is-selected="annotation.id === selectedId"
        @update:annotation="emit('update:annotation', $event)"
        @delete="emit('delete', $event)"
        @select="emit('select', $event)"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.pdf-overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 2;

  & > * {
    pointer-events: auto;
  }
}
</style>
