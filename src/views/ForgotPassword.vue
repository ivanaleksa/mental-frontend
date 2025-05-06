<template>
  <div class="forgot-password-container">
    <form v-if="!isSecondStep" class="forgot-password-form" @submit.prevent="handleFirstStep">
      <h1>Восстановление пароля</h1>

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
            <label for="email">Email</label>
            <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Введите email"
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

      <button type="submit" class="submit-button">Отправить код</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      <router-link to="/login" class="back-link">Вернуться на вход</router-link>
    </form>

    <form v-else class="forgot-password-form" @submit.prevent="handleSecondStep">
      <h1>Подтверждение нового пароля</h1>

      <div class="form-grid">
        <div class="column">
          <div class="form-group">
            <label for="code">Код</label>
            <input
                id="code"
                v-model="form.code"
                type="text"
                placeholder="Введите код из email"
                required
                pattern="[A-Za-z0-9]{16}"
                maxlength="16"
                title="Код должен содержать 8 латинских букв или цифр"
            />
          </div>
          <div class="form-group">
            <label for="new_password">Новый пароль</label>
            <input
                id="new_password"
                v-model="form.new_password"
                type="password"
                placeholder="Введите новый пароль"
                required
            />
          </div>
          <div class="form-group">
            <label for="confirm_password">Подтверждение пароля</label>
            <input
                id="confirm_password"
                v-model="form.confirm_password"
                type="password"
                placeholder="Повторите пароль"
                required
            />
            <span v-if="passwordError" class="error">{{ passwordError }}</span>
          </div>
        </div>
      </div>

      <button type="submit" class="submit-button">Сменить пароль</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success">{{ successMessage }}</div>
      <router-link to="/login" class="back-link">Вернуться на вход</router-link>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'ForgotPassword',
  data() {
    return {
      isSecondStep: false,
      form: {
        login: '',
        email: '',
        user_type: 'клиент',
        code: '',
        new_password: '',
        confirm_password: '',
      },
      passwordError: '',
      errorMessage: '',
      successMessage: '',
    };
  },
  methods: {
    async handleFirstStep() {
      this.errorMessage = '';
      try {
        const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD, {
          login: this.form.login,
          email: this.form.email,
          user_type: this.form.user_type,
        });
        this.successMessage = response.data.message || 'Код отправлен на email.';
        this.isSecondStep = true;
      } catch (error) {
        if (error.response && error.response.data.detail) {
          this.errorMessage = error.response.data.detail;
        } else {
          this.errorMessage = 'Произошла ошибка, попробуйте снова';
        }
      }
    },
    async handleSecondStep() {
      this.passwordError = '';
      this.errorMessage = '';
      this.successMessage = '';

      if (this.form.new_password !== this.form.confirm_password) {
        this.passwordError = 'Пароли не совпадают';
        return;
      }

      try {
        const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD_CONFIRM, {
          login: this.form.login,
          user_type: this.form.user_type,
          code: this.form.code,
          new_password: this.form.new_password,
          confirm_password: this.form.confirm_password,
        });
        this.successMessage = response.data.message || 'Пароль сменён';
        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
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
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.forgot-password-form {
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

.forgot-password-form h1 {
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

.success {
  color: green;
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

.back-link {
  text-align: center;
  color: #00FF00;
  text-decoration: none;
  margin-top: 1rem;
}

.back-link:hover {
  text-decoration: underline;
}
</style>