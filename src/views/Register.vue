<template>
  <div class="register-container">
    <form class="register-form" @submit.prevent="handleSubmit">
      <h1>Регистрация</h1>

      <div class="form-grid">
        <!-- Столбец 1: Логин, Email, Имя, Фамилия -->
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
            <label for="first_name">Имя</label>
            <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                placeholder="Введите имя"
                required
            />
          </div>
          <div class="form-group">
            <label for="last_name">Фамилия</label>
            <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                placeholder="Введите фамилию"
                required
            />
          </div>
        </div>

        <!-- Столбец 2: Пароль, Подтверждение пароля -->
        <div class="column">
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
            <label for="passwordConfirm">Подтверждение пароля</label>
            <input
                id="passwordConfirm"
                v-model="form.passwordConfirm"
                type="password"
                placeholder="Повторите пароль"
                required
            />
            <span v-if="passwordError" class="error">{{ passwordError }}</span>
          </div>
        </div>

        <!-- Столбец 3: Дата рождения, Пол -->
        <div class="column">
          <div class="form-group">
            <label for="birthAt">Дата рождения</label>
            <input
                id="birthAt"
                v-model="form.birthAt"
                type="date"
                required
            />
          </div>
          <div class="form-group">
            <label for="sex">Пол</label>
            <select id="sex" v-model="form.sex" required>
              <option value="" disabled>Выберите пол</option>
              <option value="муж.">Мужской</option>
              <option value="жен.">Женский</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" class="submit-button">Зарегистрироваться</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

      <router-link to="/login" class="login-link">
        Уже есть аккаунт?
      </router-link>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'Register',
  data() {
    return {
      form: {
        login: '',
        email: '',
        password: '',
        passwordConfirm: '',
        first_name: '',
        last_name: '',
        birthAt: '',
        sex: '',
      },
      passwordError: '',
      errorMessage: '',
    };
  },
  methods: {
    async handleSubmit() {
      this.passwordError = '';
      this.errorMessage = '';

      if (this.form.password !== this.form.passwordConfirm) {
        this.passwordError = 'Пароли не совпадают';
        return;
      }

      try {
        const response = await axios.post(API_ENDPOINTS.REGISTER, {
          login: this.form.login,
          email: this.form.email,
          password: this.form.password,
          first_name: this.form.first_name,
          last_name: this.form.last_name,
          birthAt: this.form.birthAt,
          sex: this.form.sex,
        });

        const { jwt_token } = response.data;

        document.cookie = `jwt_token=${jwt_token}; path=/; max-age=86400`;
        this.$router.push('/profile');
      } catch (error) {
        if (error.response && error.response.data.detail) {
          if (error.response && error.response.data.detail) {
            this.errorMessage = error.response.data.detail;
          }
        }
      }
    },
  },
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #E0E0E0, #E0FFFF);
}

.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.register-form h1 {
  text-align: center;
  color: #333;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group .error {
  color: red;
  font-size: 0.875rem;
  margin-top: 0.25rem;
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

.login-link {
  text-align: center;
  color: #00FF00;
  text-decoration: none;
  margin-top: 1rem;
}

.login-link:hover {
  text-decoration: underline;
}
</style>