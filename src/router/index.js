import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import FlowAssembly from '../views/FlowAssembly.vue'
import GanttChart from '../views/GanttChart.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/editor',
    name: 'editor',
    component: FlowAssembly,
  },
  {
    path: '/gantt',
    name: 'gantt',
    component: GanttChart,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
