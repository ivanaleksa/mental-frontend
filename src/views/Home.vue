<template>
  <div class="home-container">
    <h1 class="title">Mental</h1>
    <div class="button-group">
      <router-link to="/register" class="action-button register-button">
        Зарегистрироваться
      </router-link>
      <router-link to="/login" class="action-button login-button">
        Войти
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
});
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.title {
  font-size: 10rem;
  font-weight: bold;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradientAnimation 5ms ease infinite;
}

.button-group {
  display: flex;
  gap: 1.5rem;
}

.action-button {
  padding: 1rem 2rem;
  border-radius: 5px;
  color: white;
  font-size: 1.2rem;
  text-decoration: none;
  transition: opacity 0.3s;
}

.action-button:hover {
  opacity: 0.9;
}

.register-button {
  background: #00FF00;
}

.login-button {
  background: #00FFFF;
}
</style>