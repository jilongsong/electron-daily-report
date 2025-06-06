<template>
  <div v-if="show" class="modal-overlay" @click.self="onClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>我的日报</h3>
        <div class="modal-actions">
          <button class="action-btn copy-btn" :disabled="isCopying" @click="onCopy">
            <i v-if="!isCopying" class="i-carbon-copy"></i>
            <i v-else class="i-carbon-checkmark"></i>
            <span>{{ isCopying ? '已复制' : '复制' }}</span>
          </button>
          <button class="action-btn close-btn" @click="onClose">❎</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="report-content markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

interface Props {
  show: boolean
  content: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'copy'): void
}>()

const isCopying = ref(false)

const renderedContent = computed(() => {
  return md.render(props.content)
})

const onClose = () => {
  emit('update:show', false)
}

const onCopy = async () => {
  if (isCopying.value) return
  isCopying.value = true
  emit('copy')
  setTimeout(() => {
    isCopying.value = false
  }, 2000)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease;
  position: relative;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px 12px 0 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #8c8c8c;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  border-radius: 4px;
}

.action-btn:hover {
  color: #1a1a1a;
  background: rgba(0, 0, 0, 0.05);
}

.action-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.copy-btn {
  color: #1890ff;
}

.copy-btn:hover {
  color: #40a9ff;
  background: rgba(24, 144, 255, 0.1);
}

.copy-btn i {
  font-size: 16px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.3);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(24, 144, 255, 0.5);
}

.report-content {
  line-height: 1.6;
  color: #1a1a1a;
}

:deep(.markdown-body) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

:deep(.markdown-body h1) { font-size: 2em; }
:deep(.markdown-body h2) { font-size: 1.5em; }
:deep(.markdown-body h3) { font-size: 1.25em; }
:deep(.markdown-body h4) { font-size: 1em; }
:deep(.markdown-body h5) { font-size: 0.875em; }
:deep(.markdown-body h6) { font-size: 0.85em; }

:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 16px;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

:deep(.markdown-body li) {
  margin: 0.25em 0;
}

:deep(.markdown-body code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

:deep(.markdown-body pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-bottom: 16px;
}

:deep(.markdown-body pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
  word-break: normal;
  white-space: pre;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style> 