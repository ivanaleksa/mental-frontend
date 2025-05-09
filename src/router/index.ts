import { createRouter, createWebHistory } from 'vue-router';
import Register from '../views/Register.vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/ForgotPassword.vue'),
    },
    {
        path: '/psychologists',
        name: 'Psychologists',
        component: () => import('../views/Psychologists.vue'),
    },
    {
        path: '/notes',
        name: 'Notes',
        component: () => import('../views/Notes.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const jwtToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt_token='))
        ?.split('=')[1];

    if (jwtToken) {
        try {
            const response = await axios.get(API_ENDPOINTS.ME, {
                headers: { Authorization: `Bearer ${jwtToken}` },
            });

            if (response.data) {
                if (to.path === '/login' || to.path === '/register') {
                    next('/profile');
                } else {
                    next();
                }
                return;
            }
        } catch (error) {
            console.error('ME Error:', error);
            document.cookie = 'jwt_token=; Max-Age=0; path=/';
            if (to.path !== '/' && to.path !== '/forgot-password') {
                next('/login');
            }
            return;
        }
    }

    if (to.path !== '/' && to.path !== '/forgot-password' && to.path !== '/login' && to.path !== '/register') {
        next('/login');
    } else {
        next();
    }
});

export default router;