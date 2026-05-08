import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LegalView from '../views/LegalView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import ContactView from '../views/ContactView.vue'

const modules = import.meta.glob('../tools/*/config.ts', { eager: true })
const tools = Object.values(modules).map((m: any) => m.default)

const toolRoutes = tools.map(tool => ({
  path: `/tools/${tool.id}`,
  name: tool.id,
  component: tool.component
}))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/legal', name: 'legal', component: LegalView },
    { path: '/privacy', name: 'privacy', component: PrivacyView },
    { path: '/contact', name: 'contact', component: ContactView },
    ...toolRoutes
  ]
})

export default router
export { tools }
