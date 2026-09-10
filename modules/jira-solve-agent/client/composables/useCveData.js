import { ref } from 'vue';
import { apiRequest } from '@shared/client/services/api.js';

export function useCveData() {
  const data = ref(null);
  const loading = ref(true);
  const refreshing = ref(false);
  const error = ref(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await apiRequest('/modules/jira-solve-agent/cve-data');
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    refreshing.value = true;
    error.value = null;
    try {
      await apiRequest('/modules/jira-solve-agent/cve-refresh', { method: 'POST' });
      await load();
    } catch (e) {
      error.value = e.message;
    } finally {
      refreshing.value = false;
    }
  }

  load();
  return { data, loading, refreshing, error, load, refresh };
}
