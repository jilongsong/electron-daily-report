<template>
  <div class="git-path-manager">
    <div class="path-list">
      <div v-for="(path, index) in paths" :key="index" class="path-item">
        <input v-model="paths[index]" placeholder="输入Git仓库路径" />
        <button @click="removePath(index)" class="remove-btn">删除</button>
      </div>
    </div>
    <button @click="addPath" class="add-btn">添加仓库路径</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const paths = ref<string[]>(['']);

const emit = defineEmits<{
  (e: 'update:paths', paths: string[]): void
}>();

const addPath = () => {
  paths.value.push('');
};

const removePath = (index: number) => {
  paths.value.splice(index, 1);
  if (paths.value.length === 0) {
    paths.value.push('');
  }
};

watch(paths, (newPaths) => {
  // Filter out empty paths before emitting
  const validPaths = newPaths.filter(path => path.trim() !== '');
  emit('update:paths', validPaths);
}, { deep: true });
</script>

<style scoped>
.git-path-manager {
  margin: 20px 0;
}

.path-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.path-item {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 8px;
}

.remove-btn {
  padding: 8px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #ff7875;
}

.add-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #40a9ff;
}
</style> 