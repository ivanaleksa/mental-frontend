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
        path: '/email-confirmation',
        name: 'EmailConfirmation',
        component: () => import('../views/EmailConfirmation.vue'),
    },
    {
        path: '/stats',
        name: 'Stats',
        component: () => import('../views/Stats.vue'),
    },
    {
        path: '/clients',
        name: 'Clients',
        component: () => import('../views/Clients.vue'),
    },
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: () => import('../views/AdminLogin.vue'),
    },
    {
        path: '/admin/clients',
        name: 'AdminClients',
        component: () => import('../views/AdminClients.vue'),
    },
    {
        path: '/admin/psychologists',
        name: 'AdminPsychologists',
        component: () => import('../views/AdminPsychologists.vue'),
    },
    {
        path: '/admin/client-requests',
        name: 'AdminClientRequests',
        component: () => import('../views/AdminClientRequests.vue'),
    },
    {
        path: '/admin/admins',
        name: 'AdminAdmins',
        component: () => import('../views/AdminAdmins.vue'),
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
    if (to.path.startsWith('/admin/')) {
      try {
        const response = await axios.get(API_ENDPOINTS.ADMIN_ME, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        if (response.data) {
          if (to.path === '/admin/login') {
            next('/admin/clients');
            return;
          }
          next();
          return;
        }
      } catch (error) {
        console.error('ADMIN_ME Error:', error);
        document.cookie = 'jwt_token=; Max-Age=0; path=/';
        if (to.path !== '/admin/login') {
          next('/admin/login');
          return;
        }
      }
    } else {
      try {
        const response = await axios.get(API_ENDPOINTS.ME, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        if (response.data) {
          if (!response.data.is_verified && to.path !== '/email-confirmation') {
            next('/email-confirmation');
            return;
          }
          if (response.data.is_verified && to.path === '/email-confirmation') {
            next('/profile');
            return;
          }

          if (to.path === '/login' || to.path === '/register') {
            next('/profile');
            return;
          }

          next();
          return;
        }
      } catch (error) {
        console.error('ME Error:', error);
        document.cookie = 'jwt_token=; Max-Age=0; path=/';
        if (to.path !== '/' && to.path !== '/forgot-password') {
          next('/login');
          return;
        }
      }
    }
  }

  if (to.path.startsWith('/admin/')) {
    if (to.path !== '/admin/login') {
      next('/admin/login');
      return;
    }
  } else if (to.path !== '/' && to.path !== '/forgot-password' && to.path !== '/login' && to.path !== '/register') {
    next('/login');
    return;
  }

  next();
});

export default router;