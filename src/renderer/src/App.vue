<template>
  <div class="my-app">
    <div class="daily-wrapper">
      <LeftMenu v-model:active="activeComponent" :paths="workspacePaths" />
      <div class="content">
        <component 
          :is="currentComponent" 
          v-if="currentComponent === MyLogs"
          :paths="workspacePaths"
        />
        <component 
          :is="currentComponent" 
          v-else
          v-model:paths="workspacePaths"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LeftMenu from './components/LeftMenu.vue';
import MyLogs from './components/MyLogs.vue';
import MyWorkspace from './components/MyWorkspace.vue';

const activeComponent = ref('workspace');
const workspacePaths = ref<string[]>([]);

const currentComponent = computed(() => {
  switch (activeComponent.value) {
    case 'logs':
      return MyLogs;
    case 'workspace':
      return MyWorkspace;
    default:
      return MyWorkspace;
  }
});
</script>

<style scoped>
.my-app {
  width: 100%;
  height: 100vh;
  /* background: #f5f5f5; */
}

.daily-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
}

.content {
  flex: 1;
  padding: 24px;
  background: #ffffff0c;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
