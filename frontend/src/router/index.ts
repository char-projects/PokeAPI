import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Creator from '../views/Creator.vue'

const routes = [
    { path: '/', name: 'Home', component: Home },
    { path: '/create', name: 'Creator', component: Creator },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
