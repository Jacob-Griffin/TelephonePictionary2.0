import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: 'Blow Your Face Off',
      },
      component: HomeView,
    },
    {
      path: '/game/:gameid',
      name: 'game',
      meta: {
        title: 'Game - Blow Your Face Off',
      },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Gameplay.vue'),
    },
    {
      path: '/lobby/:gameid',
      name: 'lobby',
      meta: {
        title: 'Lobby - Blow Your Face Off',
      },
      component: () => import('../views/Lobby.vue'),
    },
    {
      path: '/review/:gameid',
      name: 'review',
      meta: {
        title: 'Review - Blow Your Face Off',
      },
      component: () => import('../views/UpdatedReview.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'redirect404',
      meta: {
        title: 'Redirecting - Blow Your Face Off',
      },
      component: () => import('../views/RedirectHome.vue'),
    },
  ],
});

export default router;
