<template>
  <div class="left-menu">
    <div class="app-title">
      <span class="app-name vue">daily-report</span>
    </div>
    <nav class="menu-nav">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeItem === item.id }"
        @click="handleMenuClick(item.id)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.name }}</span>
      </div>
    </nav>
    <div class="menu-footer">
      <button
        class="generate-btn"
        :class="{ loading: isGenerating }"
        :disabled="isGenerating"
        @click="generateReport"
      >
        <i v-if="!isGenerating" class="i-carbon-document-report"></i>
        <i v-else class="i-carbon-circle-dash animate-spin"></i>
        <span>{{ isGenerating ? '生成中...' : '生成日报' }}</span>
      </button>
    </div>

    <ReportModal
      v-model:show="showReport"
      :content="reportContent.content"
      @copy="copyReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReportModal from './ReportModal.vue'

interface MenuItem {
  id: string
  name: string
  icon: string
}

interface ReportContent {
  content: string
}

interface Props {
  paths: string[]
}

const props = defineProps<Props>()

const menuItems: MenuItem[] = [
  {
    id: 'workspace',
    name: '我的工作区',
    icon: 'i-carbon-workspace'
  },
  {
    id: 'logs',
    name: '我的日志',
    icon: 'i-carbon-document'
  }
]

const activeItem = ref('workspace')
const isGenerating = ref(false)
const showReport = ref(false)
const reportContent = ref<ReportContent>({
  content: ''
})
const isCopying = ref(false)

const emit = defineEmits<{
  (e: 'update:active', id: string): void
}>()

const handleMenuClick = (id: string) => {
  activeItem.value = id
  emit('update:active', id)
}

const generateReport = async () => {
  isGenerating.value = true

  try {
    // Get commits from all repositories
    const results = await Promise.all(
      props.paths.map(path => window.electronAPI.getGitCommits(path))
    )

    const allCommits = results.flatMap((result, index) => {
      if ('error' in result) {
        console.error(`Error fetching commits from ${props.paths[index]}:`, result.error)
        return []
      }
      return result.map((commit) => ({
        ...commit,
        repo: props.paths[index]
      }))
    })

    // Filter commits for today only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCommits = allCommits.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= today;
    });

    if (todayCommits.length === 0) {
      throw new Error('今天还没有提交记录')
    }

    // Sort commits by date
    const sortedCommits = todayCommits.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Generate report using OpenAI
    const response = await window.electronAPI.generateDailyReport(sortedCommits)
    
    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.report) {
      throw new Error('No report generated')
    }

    reportContent.value = {
      content: response.report
    }

    showReport.value = true
  } catch (error) {
    console.error('Failed to generate report:', error)
    // Show error message to user
    if (error instanceof Error) {
      alert(error.message)
    }
  } finally {
    isGenerating.value = false
  }
}

const copyReport = async () => {
  if (isCopying.value) return

  isCopying.value = true

  try {
    await navigator.clipboard.writeText(reportContent.value.content)

    // Reset copying state after 2 seconds
    setTimeout(() => {
      isCopying.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy report:', error)
    isCopying.value = false
  }
}
</script>

<style scoped>
.left-menu {
  width: 240px;
  height: 100%;
  display: flex;
  padding: 0 10px;
  flex-direction: column;
  position: relative;
}

.app-title {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.app-name {
  font-size: 30px;
  font-weight: 600;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.menu-nav {
  padding: 16px 0;
  flex: 1;
}

.menu-item {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #595959;
  position: relative;
}

.menu-item:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.menu-item.active {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #1890ff;
}

.menu-item i {
  font-size: 18px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.menu-item span {
  font-size: 14px;
  font-weight: 500;
}

.menu-footer {
  padding: 20px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.generate-btn {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.generate-btn:hover {
  background: #40a9ff;
}

.generate-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.generate-btn.loading {
  background: #1890ff;
  opacity: 0.8;
}

.generate-btn i {
  font-size: 16px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
