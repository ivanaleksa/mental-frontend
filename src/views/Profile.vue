<template>
  <div class="profile-container">
    <h1 class="title">Mental</h1>
    <div class="profile-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item active">Профиль</router-link>
        <router-link to="/notes" class="sidebar-item">Управление записками</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/stats" class="sidebar-item">Статистика</router-link>
        <router-link to="/psychologists" class="sidebar-item">Список психологов</router-link>
      </div>
      <div class="main-content">
        <div class="profile-header">
          <div class="actions">
            <button class="action-button" @click="$router.push('/forgot-password')">Сменить пароль</button>
            <button v-if="userData.user_type === 'клиент'" class="action-button" @click="alert('Подать документы')">Подать документы</button>
            <button v-else class="action-button" @click="alert('Выйти из статуса психолога')">Выйти из статуса психолога</button>
            <button class="action-button logout" @click="logout">Выйти</button>
          </div>
          <div class="profile-details">
            <button @click="openUploadDialog" class="photo-button">
              <img :src="userData.client_photo ? `http://127.0.0.1:8000/public/user_photos/${userData.client_photo}` : 'https://via.placeholder.com/150'" alt="Profile Photo" class="profile-photo" />
            </button>
            <div v-if="showUploadDialog" class="modal">
              <div class="modal-content">
                <input type="file" @change="handleFileUpload" ref="fileInput" />
                <button @click="closeUploadDialog">Закрыть</button>
              </div>
            </div>
            <div class="info-section" @dblclick="toggleEdit">
              <p><strong>Логин:</strong> {{ userData.login }}</p>
              <p><strong>Email:</strong> {{ userData.email }}</p>
              <p><strong>Имя:</strong> {{ userData.first_name }}</p>
              <p><strong>Фамилия:</strong> {{ userData.last_name }}</p>
              <p><strong>Дата рождения:</strong> {{ userData.birthAt.split('T')[0] }}</p>
              <p><strong>Пол:</strong> {{ userData.sex }}</p>
              <div v-if="isEditing" class="edit-form">
                <input v-model="editData.first_name" placeholder="Имя" />
                <input v-model="editData.last_name" placeholder="Фамилия" />
                <input v-model="editData.birthAt" type="date" placeholder="Дата рождения" />
                <button @click="saveChanges">Сохранить</button>
              </div>
              <p v-if="!isEditing" class="edit-hint">Двойной клик для редактирования</p>
            </div>
          </div>
        </div>
        <div class="requests-section">
          <h2>Заявки от психологов</h2>
          <div v-if="userData.user_type === 'клиент' && psychologistRequests.length" class="requests-list"">
            <div v-for="request in psychologistRequests" :key="request.request_id" class="request-item">
              <img :src="request.psychologist_photo ? `http://127.0.0.1:8000/public/user_photos/${request.psychologist_photo}` : 'https://via.placeholder.com/50'" alt="Psychologist Photo" class="request-photo" />
              <div>
                <p><strong>{{ request.first_name }} {{ request.last_name }}</strong></p>
                <p>Логин: {{ request.login }}</p>
                <p>Пол: {{ request.sex }}</p>
              </div>
              <button @click="acceptRequest(request.request_id)" class="action-button small">Подтвердить</button>
              <button @click="rejectRequest(request.request_id)" class="action-button small reject">Отвергнуть</button>
            </div>
          </div>
          <div v-else-if="userData.user_type === 'психолог'" class="requests-list">
            <p>Документ подтверждения:</p>
            <button @click="openPdf" class="action-button">Открыть PDF</button>
            <div v-if="showPdf" class="pdf-modal">
              <div class="pdf-content">
                <iframe :src="'https://example.com/sample.pdf'" width="100%" height="600px"></iframe>
                <button @click="closePdf">Закрыть</button>
              </div>
            </div>
          </div>
          <p v-else>Нет заявок</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'Profile',
  data() {
    return {
      userData: {
        user_id: 0,
        login: '',
        email: '',
        first_name: '',
        last_name: '',
        birthAt: '',
        sex: '',
        client_photo: '',
        is_verified: false,
        user_type: 'клиент',
      },
      psychologistRequests: [] as { request_id: number; login: string; first_name: string; last_name: string; sex: string; psychologist_photo?: string }[],
      isEditing: false,
      editData: {
        first_name: '',
        last_name: '',
        birthAt: '',
      },
      showUploadDialog: false,
      showPdf: false,
      errorMessage: '',
    };
  },
  mounted() {
    this.fetchUserData();
    this.fetchPsychologistRequests();
  },
  methods: {
    async fetchUserData() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.ME, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.userData = response.data;
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки данных пользователя';
          console.error(error);
        }
      }
    },
    async fetchPsychologistRequests() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.PSYCHOLOGIST_REQUESTS, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.psychologistRequests = response.data;
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки заявок';
          console.error(error);
        }
      }
    },
    openUploadDialog() {
      this.showUploadDialog = true;
      (this.$refs.fileInput as HTMLInputElement).value = '';
    },
    closeUploadDialog() {
      this.showUploadDialog = false;
    },
    async handleFileUpload(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const formData = new FormData();
        formData.append('photo', target.files[0]);
        formData.append('user_type', this.userData.user_type);

        const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
        if (jwtToken) {
          try {
            await axios.patch(API_ENDPOINTS.UPDATE_PHOTO, formData, {
              headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'multipart/form-data' },
            });
            this.fetchUserData(); // Обновляем фото
            this.closeUploadDialog();
          } catch (error) {
            this.errorMessage = 'Ошибка загрузки фото: ' + (error.response?.data?.detail || 'Попробуйте снова');
            console.error(error);
          }
        }
      }
    },
    toggleEdit() {
      if (!this.isEditing) {
        this.editData = { ...this.userData };
      }
      this.isEditing = !this.isEditing;
    },
    async saveChanges() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.patch(API_ENDPOINTS.UPDATE_PROFILE, this.editData, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.userData = response.data;
          this.isEditing = false;
        } catch (error) {
          this.errorMessage = 'Ошибка обновления данных: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    async acceptRequest(requestId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.post(API_ENDPOINTS.ACCEPT_REQUEST(requestId), {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.fetchPsychologistRequests();
          window.location.reload(); // Обновляем страницу
        } catch (error) {
          this.errorMessage = 'Ошибка принятия заявки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    async rejectRequest(requestId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.post(API_ENDPOINTS.REJECT_REQUEST(requestId), {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.fetchPsychologistRequests();
          window.location.reload(); // Обновляем страницу
        } catch (error) {
          this.errorMessage = 'Ошибка отклонения заявки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    openPdf() {
      this.showPdf = true;
    },
    closePdf() {
      this.showPdf = false;
    },
    logout() {
      document.cookie = 'jwt_token=; Max-Age=0; path=/';
      window.location.reload();
    },
  },
});
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  padding: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  -webkit-background-clip: text;
  background-clip: text;
  color: #333;
  text-align: left;
  margin-bottom: 1rem;
}

.profile-content {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  width: 200px;
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 5px;
  margin-right: 2rem;
}

.sidebar-item {
  display: block;
  padding: 0.5rem 1rem;
  margin: 0.5rem 0;
  text-decoration: none;
  color: #333;
  background: #ddd;
  border-radius: 5px;
  text-align: center;
}

.sidebar-item.active {
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  color: white;
}

.main-content {
  flex: 1;
}

.profile-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.profile-details {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.photo-button {
  border: none;
  background: none;
  cursor: pointer;
}

.profile-photo {
  width: 250px;
  height: 300px; /* Фиксированная высота, можно настроить под твои нужды */
  object-fit: cover; /* Сохраняет пропорции изображения */
}

.info-section {
  flex: 1;
  text-align: left; /* Выровнять текст слева */
}

.info-section p {
  margin: 0.5rem 0;
  color: #333; /* Убедимся, что текст виден */
}

.edit-hint {
  font-size: 0.9rem;
  color: #666;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.edit-form input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.edit-form button {
  padding: 0.5rem;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: opacity 0.3s;
}

.action-button:hover {
  opacity: 0.9;
}

.action-button.logout {
  background: linear-gradient(135deg, #FF0000, #FF4444);
}

.modal {
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

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pdf-modal {
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

.pdf-content {
  background: white;
  padding: 1rem;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.requests-section {
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.requests-list {
  max-height: 300px;
  overflow-y: auto;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}

.request-item p {
  margin: 0.2rem 0;
  color: #333;
}

.request-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.action-button.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.action-button.reject {
  background: linear-gradient(135deg, #FF4444, #FF0000);
}
</style>