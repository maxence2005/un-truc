import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
    ...toolRoutes
  ]
})

export default router
export { tools }