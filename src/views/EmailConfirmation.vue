<template>
  <div class="confirmation-container">
    <div class="confirmation-content">
      <h1 class="title">Подтверждение почты</h1>
      <p style="color: #333">Введите код, отправленный на вашу почту, чтобы подтвердить email.</p>
      <div class="input-group">
        <input
            v-model="confirmationCode"
            placeholder="Введите код"
            class="code-input"
            style="color: white"
            @keyup.enter="confirmEmail"
        />
      </div>
      <div class="action-buttons">
        <button @click="confirmEmail" class="action-button confirm">Подтвердить</button>
        <button @click="sendNewCode" class="action-button resend">Отправить новый код</button>
      </div>
      <div v-if="showNotification" class="notification" :class="{ 'success': notificationType === 'success', 'error': notificationType === 'error' }">
        {{ notificationMessage }}
      </div>
    </div>
    <div v-if="isLoading" class="loader-overlay">
      <div class="loader"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'EmailConfirmation',
  data() {
    return {
      confirmationCode: '',
      isLoading: false,
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
    };
  },
  methods: {
    async confirmEmail() {
      if (!this.confirmationCode) {
        this.showNotificationMessage('Введите код', 'error');
        return;
      }

      const jwtToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('jwt_token='))
          ?.split('=')[1];

      if (!jwtToken) {
        this.showNotificationMessage('Токен отсутствует, войдите заново', 'error');
        this.$router.push('/login');
        return;
      }

      this.isLoading = true;
      try {
        await axios.post(`${API_ENDPOINTS.EMAIL_CONFIRM}/${this.confirmationCode}`, {}, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        this.showNotificationMessage('Почта успешно подтверждена! Скоро вы будете перенаправлены', 'success');
        setTimeout(() => {
          this.$router.push('/profile');
        }, 2000); // Редирект на /profile через 2 секунды после успешного подтверждения
      } catch (error) {
        this.showNotificationMessage('Ошибка подтверждения: ' + (error.response?.data?.detail || 'Попробуйте снова'), 'error');
        console.error('Ошибка подтверждения почты:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async sendNewCode() {
      const jwtToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('jwt_token='))
          ?.split('=')[1];

      if (!jwtToken) {
        this.showNotificationMessage('Токен отсутствует, войдите заново', 'error');
        this.$router.push('/login');
        return;
      }

      this.isLoading = true;
      try {
        await axios.post(API_ENDPOINTS.EMAIL_SEND_NEW, {}, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        this.showNotificationMessage('Новый код отправлен на вашу почту!', 'success');
      } catch (error) {
        this.showNotificationMessage('Ошибка отправки кода: ' + (error.response?.data?.detail || 'Попробуйте снова'), 'error');
        console.error('Ошибка отправки нового кода:', error);
      } finally {
        this.isLoading = false;
      }
    },
    showNotificationMessage(message: string, type: string) {
      this.notificationMessage = message;
      this.notificationType = type;
      this.showNotification = true;
      setTimeout(() => {
        this.showNotification = false;
      }, 3000);
    },
  },
});
</script>

<style scoped>
.confirmation-container {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.confirmation-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.input-group {
  margin-bottom: 1.5rem;
}

.code-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  color: #333;
}

.code-input:focus {
  outline: none;
  border-color: #00FF00;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
}

.action-button.confirm {
  background: linear-gradient(135deg, #00FF00, #00FFFF);
}

.action-button.resend {
  background: linear-gradient(135deg, #FFA500, #FFD700);
}

.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 2rem;
  border-radius: 5px;
  color: white;
  z-index: 1000;
  opacity: 0;
  animation: fadeInOut 3s ease-in-out forwards;
}

.notification.success {
  background-color: #28a745;
}

.notification.error {
  background-color: #dc3545;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #00FFFF;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>