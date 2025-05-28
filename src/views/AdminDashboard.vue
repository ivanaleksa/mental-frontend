<template>
  <div class="dashboard-container">
    <h1 class="title">Mental - Админ-панель</h1>
    <div class="dashboard-content">
      <h2>Добро пожаловать, админ!</h2>
      <p>Здесь будет отображаться информация и управление.</p>
      <button @click="logout" class="action-button">Выход</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'AdminDashboard',
  setup() {
    const router = useRouter();

    const logout = () => {
      document.cookie = 'jwt_token=; Max-Age=0; path=/';
      router.push('/admin/login');
    };

    return { logout };
  },
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-content {
  background: white;
  padding: 2rem;
  border-radius: 5px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dashboard-content h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff4444, #ff0000);
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.action-button:hover {
  opacity: 0.9;
}
</style>