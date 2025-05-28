<template>
  <div class="profile-container">
    <h1 class="title">Mental</h1>
    <div class="profile-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item active">Профиль</router-link>
        <router-link v-if="userData.user_type === 'психолог'" to="/clients" class="sidebar-item">Клиенты</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/notes" class="sidebar-item">Управление записками</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/stats" class="sidebar-item">Статистика</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/psychologists" class="sidebar-item">Список психологов</router-link>
      </div>
      <div class="main-content">
        <div class="profile-header">
          <div class="actions">
            <button class="action-button" @click="openChangePasswordDialog">Сменить пароль</button>
            <button v-if="userData.user_type === 'клиент' && !requestStatus.has_application" class="action-button" @click="openApplyDialog">Подать документы</button>
            <p v-else-if="userData.user_type === 'клиент' && requestStatus.has_application && requestStatus.status === 'ожидание'" class="status-message" style="color: #333">Ожидание проверки документа</p>
            <button v-else-if="userData.user_type === 'клиент' && requestStatus.has_application && requestStatus.status === 'отвергнут'" class="action-button rejected" @click="openRejectedApplyDialog">{{ requestStatus.rejection_reason || 'Отвергнуто' }}</button>
            <button v-else class="action-button" @click="openRevertToClientDialog">Выйти из статуса психолога</button>
            <button class="action-button logout" @click="logout">Выйти</button>
          </div>
          <div class="profile-details">
            <div class="photo-container">
              <button @click="openUploadDialog" class="photo-button">
                <div v-if="!userData.client_photo || userData.client_photo === 'none'" class="photo-placeholder">
                  Ваше фото здесь
                </div>
                <img v-else :src="`${baseUrl}/public/user_photos/${userData.client_photo}`" alt="Profile Photo" class="profile-photo" />
              </button>
              <p class="photo-hint">Нажмите, чтобы изменить фото</p>
            </div>
            <div v-if="showUploadDialog" class="modal">
              <div class="modal-content">
                <input type="file" @change="handleFileUpload" accept="image/*" ref="fileInput" />
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
          <div v-if="userData.user_type === 'клиент' && psychologistRequests.length" class="requests-list">
            <div v-for="request in psychologistRequests" :key="request.request_id" class="request-item">
              <img :src="request.psychologist_photo ? `${baseUrl}/public/user_photos/${request.psychologist_photo}` : 'https://via.placeholder.com/50'" alt="Psychologist Photo" class="request-photo" />
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
                <p v-if="!pdfUrl" class="error">Документа нет</p>
                <iframe v-else :src="pdfUrl" width="100%" height="600px"></iframe>
                <button @click="closePdf">Закрыть</button>
              </div>
            </div>
          </div>
          <p v-else>Нет заявок</p>
        </div>
        <!-- Модальное окно для смены пароля -->
        <div v-if="showChangePasswordDialog" class="modal">
          <div class="modal-content">
            <h3>Смена пароля</h3>
            <input v-model="passwordData.old_password" type="password" placeholder="Старый пароль" />
            <input v-model="passwordData.new_password" type="password" placeholder="Новый пароль" />
            <input v-model="passwordData.confirm_password" type="password" placeholder="Подтвердите пароль" />
            <button @click="changePassword">Сохранить</button>
            <button @click="closeChangePasswordDialog" style="background: #1a1a1a">Закрыть</button>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            <p v-if="successMessage" class="success">{{ successMessage }}</p>
          </div>
        </div>
        <!-- Модальное окно для подачи документов -->
        <div v-if="showApplyDialog" class="modal">
          <div class="modal-content">
            <h3>Подать документы</h3>
            <input type="file" @change="handleApplyUpload" ref="applyFileInput" />
            <button @click="submitApplication">Сохранить</button>
            <button @click="closeApplyDialog">Закрыть</button>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          </div>
        </div>
        <!-- Модальное окно для повторной подачи документов -->
        <div v-if="showRejectedApplyDialog" class="modal">
          <div class="modal-content">
            <h3>Повторная подача документов</h3>
            <p>Причина отклонения: {{ requestStatus.rejection_reason }}</p>
            <input type="file" @change="handleRejectedApplyUpload" ref="rejectedApplyFileInput" />
            <button @click="submitRejectedApplication">Сохранить</button>
            <button @click="closeRejectedApplyDialog">Закрыть</button>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          </div>
        </div>
        <!-- Модальное окно для подтверждения выхода из статуса психолога -->
        <div v-if="showRevertToClientDialog" class="modal">
          <div class="modal-content">
            <h3>Подтверждение</h3>
            <p style="color: #333;">Вы уверены, что хотите выйти из статуса психолога?<br>Это действие удалит ваш статус и переведёт вас в статус клиента.</p>
            <button @click="revertToClient">Подтвердить</button>
            <button @click="closeRevertToClientDialog" style="background-color: #333;">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { BASE_URL, API_ENDPOINTS } from '../config/api';

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
      showChangePasswordDialog: false,
      showApplyDialog: false,
      showRejectedApplyDialog: false,
      showRevertToClientDialog: false,
      passwordData: {
        user_id: 0,
        user_type: 'клиент',
        old_password: '',
        new_password: '',
        confirm_password: '',
      },
      requestStatus: {
        has_application: false,
        status: null,
        rejection_reason: null,
      },
      errorMessage: '',
      successMessage: '',
      applyFile: null as File | null,
      rejectedApplyFile: null as File | null,
      pdfUrl: '',
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
  },
  mounted() {
    this.fetchUserData();
    this.fetchPsychologistRequests();
    this.fetchRequestStatus();
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
          this.passwordData.user_id = this.userData.user_id;
          this.passwordData.user_type = this.userData.user_type;
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
          this.psychologistRequests = response.data.requests;
          console.log(this.psychologistRequests);
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки заявок';
          console.error(error);
        }
      }
    },
    async fetchRequestStatus() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken && this.userData.user_type === 'клиент') {
        try {
          const response = await axios.get(API_ENDPOINTS.CLIENT_REQUEST_STATUS, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.requestStatus = response.data;
        } catch (error) {
          this.errorMessage = 'Ошибка проверки статуса заявки';
          console.error(error);
        }
      }
    },
    async fetchDocumentPath() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.PSYCHOLOGIST_DOCUMENT, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          const documentPath = response.data.document_path;
          this.pdfUrl = documentPath ? `${BASE_URL}${documentPath}` : '';
        } catch (error) {
          this.errorMessage = 'Ошибка получения пути к документу';
          console.error(error);
          this.pdfUrl = '';
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
            this.fetchUserData();
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
          await axios.patch(API_ENDPOINTS.ACCEPT_REQUEST(requestId), {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          await this.fetchPsychologistRequests();
          window.location.reload();
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
          await axios.patch(API_ENDPOINTS.REJECT_REQUEST(requestId), {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.fetchPsychologistRequests();
          window.location.reload();
        } catch (error) {
          this.errorMessage = 'Ошибка отклонения заявки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    openPdf() {
      this.fetchDocumentPath();
      this.showPdf = true;
    },
    closePdf() {
      this.showPdf = false;
    },
    logout() {
      document.cookie = 'jwt_token=; Max-Age=0; path=/';
      window.location.reload();
    },
    openChangePasswordDialog() {
      this.showChangePasswordDialog = true;
      this.passwordData.old_password = '';
      this.passwordData.new_password = '';
      this.passwordData.confirm_password = '';
      this.errorMessage = '';
      this.successMessage = '';
    },
    closeChangePasswordDialog() {
      this.showChangePasswordDialog = false;
    },
    async changePassword() {
      if (this.passwordData.new_password !== this.passwordData.confirm_password) {
        this.errorMessage = 'Новый пароль и подтверждение не совпадают';
        return;
      }
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.CHANGE_PASSWORD, {
            user_id: this.passwordData.user_id,
            user_type: this.passwordData.user_type,
            old_password: this.passwordData.old_password,
            new_password: this.passwordData.new_password,
          }, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.userData = response.data;
          document.cookie = `jwt_token=${response.data.jwt_token}; path=/`;
          this.successMessage = 'Пароль успешно изменён';
          this.errorMessage = '';
          this.closeChangePasswordDialog();
        } catch (error) {
          this.errorMessage = 'Ошибка смены пароля: ' + (error.response?.data?.detail || 'Попробуйте снова');
          this.successMessage = '';
          console.error(error);
        }
      }
    },
    openApplyDialog() {
      this.showApplyDialog = true;
      (this.$refs.applyFileInput as HTMLInputElement).value = '';
      this.errorMessage = '';
    },
    closeApplyDialog() {
      this.showApplyDialog = false;
    },
    openRejectedApplyDialog() {
      this.showRejectedApplyDialog = true;
      (this.$refs.rejectedApplyFileInput as HTMLInputElement).value = '';
      this.errorMessage = '';
    },
    closeRejectedApplyDialog() {
      this.showRejectedApplyDialog = false;
    },
    async handleApplyUpload(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.applyFile = target.files[0];
      }
    },
    async submitApplication() {
      if (!this.applyFile) {
        this.errorMessage = 'Выберите файл для отправки';
        return;
      }
      const formData = new FormData();
      formData.append('document', this.applyFile);

      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.APPLY_FOR_PSYCHOLOGIST, formData, {
            headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'multipart/form-data' },
          });
          this.requestStatus = response.data;
          this.fetchRequestStatus();
          this.closeApplyDialog();
          this.errorMessage = '';
        } catch (error) {
          this.errorMessage = 'Ошибка подачи заявки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    async handleRejectedApplyUpload(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.rejectedApplyFile = target.files[0];
      }
    },
    async submitRejectedApplication() {
      if (!this.rejectedApplyFile) {
        this.errorMessage = 'Выберите файл для отправки';
        return;
      }
      const formData = new FormData();
      formData.append('document', this.rejectedApplyFile);

      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.APPLY_FOR_PSYCHOLOGIST, formData, {
            headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'multipart/form-data' },
          });
          this.requestStatus = response.data;
          this.fetchRequestStatus();
          this.closeRejectedApplyDialog();
          this.errorMessage = '';
        } catch (error) {
          this.errorMessage = 'Ошибка подачи заявки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
    openRevertToClientDialog() {
      this.showRevertToClientDialog = true;
    },
    closeRevertToClientDialog() {
      this.showRevertToClientDialog = false;
    },
    async revertToClient() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.patch(API_ENDPOINTS.REVERT_TO_CLIENT, {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          document.cookie = 'jwt_token=; Max-Age=0; path=/';
          window.location.reload();
        } catch (error) {
          this.errorMessage = 'Ошибка смены статуса: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
          this.closeRevertToClientDialog();
        }
      }
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

.photo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-button {
  border: none;
  background: none;
  cursor: pointer;
}

.photo-placeholder {
  width: 250px;
  height: 300px;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  text-align: center;
  padding: 1rem;
}

.profile-photo {
  width: 250px;
  height: 300px;
  object-fit: cover;
}

.photo-hint {
  font-size: 0.9rem;
  color: #666;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.info-section {
  flex: 1;
  text-align: left;
}

.info-section p {
  margin: 0.5rem 0;
  color: #333;
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
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.action-button {
  padding: 0.75rem 1.5rem;
  background: #00bf4d;
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

.action-button.rejected {
  background: linear-gradient(135deg, #FF8888, #FF4444);
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

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-content button {
  padding: 0.5rem;
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.modal-content .error {
  color: #FF4444;
}

.modal-content .success {
  color: #00FF00;
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