<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleSubmit">
      <h1>Вход</h1>

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
          <div class="form-group">
            <label>Тип пользователя</label>
            <div class="radio-group">
              <label>
                <input
                    type="radio"
                    v-model="form.user_type"
                    value="клиент"
                    required
                />
                Клиент
              </label>
              <label>
                <input
                    type="radio"
                    v-model="form.user_type"
                    value="психолог"
                    required
                />
                Психолог
              </label>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" class="submit-button">Войти</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

      <router-link to="/register" class="register-link">
        Нет аккаунта? Зарегистрироваться
      </router-link>
      <router-link to="/forgot-password" class="forgot-password-link">
        Восстановить пароль
      </router-link>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'Login',
  data() {
    return {
      form: {
        login: '',
        password: '',
        user_type: 'клиент', // Значение по умолчанию
      },
      errorMessage: '',
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';

      try {
        const response = await axios.post(API_ENDPOINTS.LOGIN, {
          login: this.form.login,
          password: this.form.password,
          user_type: this.form.user_type,
        });

        const { jwt_token } = response.data;
        document.cookie = `jwt_token=${jwt_token}; path=/; max-age=86400`;
        this.$router.push('/profile');
      } catch (error) {
        if (error.response && error.response.data.detail) {
          this.errorMessage = error.response.data.detail;
        } else {
          this.errorMessage = 'Произошла ошибка, попробуйте снова';
        }
      }
    },
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

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.register-link,
.forgot-password-link {
  text-align: center;
  color: #00FF00;
  text-decoration: none;
  margin-top: 1rem;
}

.register-link:hover,
.forgot-password-link:hover {
  text-decoration: underline;
}
</style>