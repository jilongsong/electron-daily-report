<template>
  <div class="my-logs">
    <div class="header">
      <h2 class="ts">Logs</h2>
      <p class="subtitle">查看您最近的代码提交记录</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div v-for="i in 3" :key="i" class="skeleton-item">
        <div class="skeleton-header"></div>
        <div class="skeleton-message"></div>
        <div class="skeleton-author"></div>
      </div>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="i-carbon-warning"></i>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="!commits.length" class="empty-state">
      <i class="i-carbon-document"></i>
      <p>暂无提交记录</p>
    </div>

    <div v-else class="commits-list">
      <div v-for="commit in commits" :key="commit.hash" class="commit-item">
        <div class="commit-header">
          <div class="commit-info">
            <span class="repo-name">{{ getRepoName(commit.repo) }}</span>
            <span class="commit-hash">{{ abbreviateHash(commit.hash) }}</span>
          </div>
          <span class="commit-date">{{ formatDate(commit.date) }}</span>
        </div>
        <div class="commit-message">{{ abbreviateMessage(commit.message) }}</div>
        <div class="commit-footer">
          <span class="commit-author">
            <i class="i-carbon-user"></i>
            {{ commit.author_name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  repo: string;
}

type GitCommitResult = GitCommit[] | { error: string };

interface Props {
  paths: string[];
}

const props = defineProps<Props>();

const commits = ref<GitCommit[]>([]);
const loading = ref(false);
const error = ref('');

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString();
  }
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  // Otherwise show full date
  return date.toLocaleDateString();
};

const abbreviateHash = (hash: string) => {
  return hash.substring(0, 7);
};

const abbreviateMessage = (message: string) => {
  const maxLength = 100;
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

const getRepoName = (path: string) => {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
};

const fetchCommits = async () => {
  if (!props.paths.length) {
    error.value = '请至少添加一个Git仓库路径';
    commits.value = [];
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    console.log('Fetching commits for paths:', props.paths);
    const results = await Promise.all(
      props.paths.map(path => window.electronAPI.getGitCommits(path))
    ) as GitCommitResult[];

    const allCommits = results.flatMap((result, index) => {
      if ('error' in result) {
        console.error(`Error fetching commits from ${props.paths[index]}:`, result.error);
        return [];
      }
      return result.map(commit => ({
        ...commit,
        repo: props.paths[index]
      }));
    });

    commits.value = allCommits.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    console.log('Fetched commits:', commits.value.length);
  } catch (err: unknown) {
    console.error('Failed to fetch commits:', err);
    error.value = `获取提交日志时出错：${err instanceof Error ? err.message : String(err)}`;
    commits.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for changes in paths and refetch commits
watch(() => props.paths, async (newPaths, oldPaths) => {
  console.log('Paths changed:', { newPaths, oldPaths });
  if (JSON.stringify(newPaths) !== JSON.stringify(oldPaths)) {
    await nextTick();
    await fetchCommits();
  }
}, { deep: true, immediate: true });

onMounted(async () => {
  console.log('MyLogs mounted, paths:', props.paths);
  await nextTick();
  await fetchCommits();
});
</script>

<style scoped>
.my-logs {
  height: 100%;
  overflow-y: auto;
  padding: 0px 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
}

/* Webkit scrollbar styling */
.my-logs::-webkit-scrollbar {
  width: 0px;
  height: 8px;
}
.header {
  margin-bottom: 24px;
}

.subtitle {
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.skeleton-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-header {
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 12px;
  width: 60%;
}

.skeleton-message {
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 12px;
  width: 90%;
}

.skeleton-author {
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  width: 30%;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
}

.error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #8c8c8c;
  gap: 16px;
}

.error-state i, .empty-state i {
  font-size: 48px;
  color: #ff4d4f;
}

.error-state p, .empty-state p {
  font-size: 16px;
}

.commits-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.commit-item {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.commit-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.commit-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repo-name {
  font-weight: 600;
  color: #c9c9c9;
  font-size: 14px;
}

.commit-hash {
  font-family: monospace;
  color: #272727;
  font-size: 13px;
  background: rgba(136, 247, 192, 0.432);
  padding: 0px 6px;
  border-radius: 4px;
}

.commit-date {
  color: #8c8c8c;
  font-size: 13px;
}

.commit-message {
  margin-bottom: 12px;
  font-size: 15px;
  color: #8c8c8c;
  line-height: 1.5;
}

.commit-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.commit-author {
  color: #8c8c8c;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.commit-author i {
  font-size: 14px;
  color: #8c8c8c;
}
</style> 