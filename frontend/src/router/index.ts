import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Creator from '../views/Creator.vue'
import Login from '../views/Login.vue'
import MyPokemons from '../views/MyPokemons.vue'
import AuthCallback from '../views/AuthCallback.vue'
import { isAuthenticated } from '../services/auth'

const routes = [
    { path: '/', name: 'home', component: Home },
    { path: '/create', name: 'create', component: Creator, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login },
    { path: '/mypokemons', name: 'mypokemons', component: MyPokemons, meta: { requiresAuth: true } },
    { path: '/auth/callback', name: 'auth-callback', component: AuthCallback },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from, next) => {
    const authed = isAuthenticated()
    if (to.name === 'home' || to.name === 'auth-callback' || to.name === 'login') {
        if (to.name === 'login' && authed) return next({ name: 'create' })
        return next()
    }
    if (!authed) return next({ name: 'home' })
    return next()
})

export default router
