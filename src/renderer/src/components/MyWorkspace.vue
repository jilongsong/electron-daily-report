<template>
  <div class="my-workspace">
    <div class="workspace-header">
      <h2 class="ts">WorkSpace</h2>
      <p class="subtitle">管理您的项目工作区</p>
    </div>

    <div class="workspace-list">
      <div v-for="workspace in workspaces" :key="workspace.id" class="workspace-card">
        <div class="workspace-main">
          <div class="workspace-icon">
            <i :class="workspace.icon"></i>
          </div>
          <div class="workspace-info">
            <h3 class="workspace-name">{{ workspace.name }}</h3>
            <p class="workspace-path">{{ workspace.path }}</p>
          </div>
        </div>
        <div class="workspace-actions">
          <button class="action-btn delete" @click="deleteWorkspace(workspace)">
            <i class="i-carbon-trash-can"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <div class="add-workspace">
      <div class="add-form">
        <div class="input-group">
          <div class="input-wrapper">
            <i class="i-carbon-folder"></i>
            <input 
              v-model="newWorkspacePath" 
              type="text" 
              placeholder="输入工作区路径，例如：D:\zujianhua\edoms-application-ui"
              @keyup.enter="addWorkspace"
            />
          </div>
          <button class="add-btn" @click="addWorkspace" :disabled="!isValidPath">
            <i class="i-carbon-add"></i>
            添加工作区
          </button>
        </div>
        <p v-if="pathError" class="error-message">{{ pathError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

const STORAGE_KEY = 'electron-daily-report-workspaces';

interface Workspace {
  id: string;
  name: string;
  path: string;
  icon: string;
}

const workspaces = ref<Workspace[]>([]);
const emit = defineEmits(['update:paths']);

// Load workspaces from localStorage
const loadWorkspaces = () => {
  try {
    const savedWorkspaces = localStorage.getItem(STORAGE_KEY);
    if (savedWorkspaces) {
      workspaces.value = JSON.parse(savedWorkspaces);
      emitPaths();
    }
  } catch (error) {
    console.error('Failed to load workspaces from localStorage:', error);
  }
};

// Save workspaces to localStorage
const saveWorkspaces = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces.value));
    emitPaths();
  } catch (error) {
    console.error('Failed to save workspaces to localStorage:', error);
  }
};

const emitPaths = () => {
  console.log('Emitting paths:', workspaces.value.map(w => w.path));
  emit('update:paths', workspaces.value.map(w => w.path));
};

// Watch for changes in workspaces and save to localStorage
watch(workspaces, () => {
  saveWorkspaces();
}, { deep: true });

// Load workspaces on component mount
onMounted(() => {
  loadWorkspaces();
});

const newWorkspacePath = ref('');
const pathError = ref('');

const isValidPath = computed(() => {
  return newWorkspacePath.value.trim() !== '' && !pathError.value;
});

const extractNameFromPath = (path: string): string => {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
};

const validatePath = (path: string): boolean => {
  if (!path.trim()) {
    pathError.value = '请输入工作区路径';
    return false;
  }
  
  // Basic path validation
  if (!path.match(/^[a-zA-Z]:\\.*$/)) {
    pathError.value = '请输入有效的Windows路径';
    return false;
  }

  // Check if path already exists
  if (workspaces.value.some(w => w.path.toLowerCase() === path.toLowerCase())) {
    pathError.value = '该工作区已存在';
    return false;
  }

  pathError.value = '';
  return true;
};

const addWorkspace = () => {
  if (!validatePath(newWorkspacePath.value)) {
    return;
  }

  const newWorkspace: Workspace = {
    id: Date.now().toString(),
    name: extractNameFromPath(newWorkspacePath.value),
    path: newWorkspacePath.value,
    icon: 'i-carbon-folder'
  };

  workspaces.value.push(newWorkspace);
  newWorkspacePath.value = '';
  pathError.value = '';
};

const deleteWorkspace = (workspace: Workspace) => {
  if (confirm(`确定要删除工作区 "${workspace.name}" 吗？`)) {
    workspaces.value = workspaces.value.filter(w => w.id !== workspace.id);
  }
};
</script>

<style scoped>
.my-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0px 10px;
}

.my-workspace::-webkit-scrollbar {
  width: 0px;
  height: 8px;
}

.workspace-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  color: #8c8c8c;
  font-size: 14px;
}

.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.workspace-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.workspace-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.workspace-name {
  color: #c9c9c9;
}

.workspace-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workspace-icon {
  font-size: 24px;
  color: #1890ff;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 112, 221, 0.712);
  border-radius: 8px;
}

.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.workspace-info h3 {
  font-size: 16px;
  font-weight: 600;
}

.workspace-path {
  color: #8c8c8c;
  font-size: 13px;
}

.workspace-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.action-btn.delete {
  background: transparent;
  color: #ff4d4f;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn.delete:hover {
  background: rgba(255, 77, 79, 0.1);
}

.add-workspace {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 12px;
  color: #8c8c8c;
  font-size: 16px;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #d1d1d1;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #1890ff;
  background: rgba(255, 255, 255, 0.1);
}

.input-wrapper input::placeholder {
  color: #8c8c8c;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #dfb707;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.add-btn:hover {
  background: #40a9ff;
}

.add-btn:disabled {
  background: #707070;
  cursor: not-allowed;
}

.error-message {
  color: #ff4d4f;
  font-size: 13px;
  margin-top: 4px;
}

/* Scrollbar styling */
.workspace-list::-webkit-scrollbar {
  width: 6px;
}

.workspace-list::-webkit-scrollbar-track {
  background: transparent;
}

.workspace-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.workspace-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style> 