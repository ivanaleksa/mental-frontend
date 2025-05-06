<template>
  <div class="not-found-container">
    <h1 class="not-found-title">404</h1>
    <p class="not-found-text">Страница не найдена</p>
    <router-link to="/" class="back-button">Вернуться на главную</router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NotFound',
});
</script>

<style scoped>

.not-found-title {
  font-size: 6rem;
  font-weight: bold;
  color: #333;
}

.not-found-text {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 2rem;
}

.back-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border-radius: 5px;
  color: white;
  font-size: 1.2rem;
  text-decoration: none;
  transition: opacity 0.3s;
}

.back-button:hover {
  opacity: 0.9;
}
</style>