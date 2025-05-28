<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleSubmit">
      <h1>Mental - admin</h1>

      <div class="form-grid">
        <div class="column">
          <div class="form-group">
            <label for="login">Логин</label>
            <input
              id="login"
              v-model="form.login"
              type="text"
              placeholder="Введите логин"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Введите пароль"
              required
            />
          </div>
        </div>
      </div>

      <button type="submit" class="submit-button">Войти</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { API_ENDPOINTS } from '../config/api';

export default defineComponent({
  name: 'AdminLogin',
  setup() {
    const router = useRouter();
    const form = ref({
      login: '',
      password: '',
    });
    const errorMessage = ref('');

    const handleSubmit = async () => {
      errorMessage.value = '';

      try {
        const response = await axios.post(API_ENDPOINTS.ADMIN_LOGIN, {
          login: form.value.login,
          password: form.value.password,
        });
        const { jwt_token } = response.data;
        document.cookie = `jwt_token=${jwt_token}; path=/; max-age=86400`;
        router.push('/admin/dashboard');
      } catch (error) {
        if (error.response && error.response.data.detail) {
          errorMessage.value = error.response.data.detail;
        } else {
          errorMessage.value = 'Произошла ошибка, попробуйте снова';
        }
      }
    };

    return { form, errorMessage, handleSubmit };
  },
});
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #E0E0E0, #E0FFFF);
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form h1 {
  text-align: center;
  color: #333;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

.error {
  color: red;
  text-align: center;
  margin-top: 1rem;
}

.submit-button {
  padding: 0.75rem;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-button:hover {
  opacity: 0.9;
}
</style>