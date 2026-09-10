import { defineAsyncComponent } from 'vue'

export const routes = {
  'main': defineAsyncComponent(() => import('./views/MainView.vue')),
  'cve': defineAsyncComponent(() => import('./views/CveView.vue')),
}
