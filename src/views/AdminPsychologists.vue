<template>
  <div class="admin-container">
    <h1 class="title">Mental - Dashboard</h1>
    <div class="admin-content">
      <div class="sidebar">
        <router-link to="/admin/clients" class="sidebar-item">Клиенты</router-link>
        <router-link to="/admin/psychologists" class="sidebar-item active">Психологи</router-link>
        <router-link to="/admin/client-requests" class="sidebar-item">Заявки</router-link>
        <router-link to="/admin/admin" class="sidebar-item">Администраторы</router-link>
      </div>

      <div class="clients-section">
        <h2>Психологи</h2>
        <div class="clients-list">
          <div class="client-header">
            <span class="photo-column"></span>
            <span>Имя</span>
            <span>Логин</span>
            <span>Email</span>
            <span>Дата рождения</span>
            <span>Пол</span>
            <span></span>
            <span class="action-column"></span>
          </div>
          <div v-for="psychologist in psychologists" :key="psychologist.psychologist_id" class="client-item">
            <span class="photo-column">
              <img
                v-if="psychologist.psychologist_photo && psychologist.psychologist_photo !== 'none'"
                :src="`${baseUrl}/public/user_photos/${psychologist.psychologist_photo}`"
                alt="Psychologist Photo"
                class="client-photo"
                @click="openPhotoModal(`${baseUrl}/public/user_photos/${psychologist.psychologist_photo}`)"
              />
              <svg
                v-else
                class="client-photo"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
              </svg>
            </span>
            <span class="cell" :title="psychologist.first_name + ' ' + psychologist.last_name">
              <strong>{{ psychologist.first_name }} {{ psychologist.last_name }}</strong>
            </span>
            <span class="cell" :title="psychologist.login">
              {{ psychologist.login }}
            </span>
            <span class="cell" :title="psychologist.email">
              {{ psychologist.email }}
            </span>
            <span class="cell" :title="formatDate(psychologist.birthAt)">
              {{ formatDate(psychologist.birthAt) }}
            </span>
            <span class="cell" :title="psychologist.sex">
              {{ psychologist.sex }}
            </span>
            <span class="cell">
              <button @click="openDocument(psychologist.psychologist_docs)" class="action-button small">Документ</button>
            </span>
            <span class="action-column">
              <button @click="confirmDelete(psychologist.psychologist_id)" class="action-button small reject">Удалить</button>
            </span>
          </div>
        </div>
        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--" class="pagination-button">Предыдущая</button>
          <span>Стр. {{ currentPage }} из {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++" class="pagination-button">Следующая</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content" style="color: #1a1a1a;">
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить психолога?</p>
        <div class="modal-actions">
          <button @click="deletePsychologist" class="action-button">Да</button>
          <button @click="closeDeleteModal" class="action-button" style="background: #1a1a1a">Нет</button>
        </div>
      </div>
    </div>

    <div v-if="showPhotoModal" class="modal" @click="closePhotoModal">
      <div class="modal-content photo-modal" @click.stop>
        <button class="close-button" @click="closePhotoModal">&times;</button>
        <img :src="selectedPhoto" alt="Enlarged Photo" class="enlarged-photo" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { BASE_URL, API_ENDPOINTS } from '../config/api';

export default defineComponent({
  name: 'AdminPsychologists',
  data() {
    return {
      psychologists: [] as { psychologist_id: number; login: string; email: string; first_name: string; last_name: string; birthAt: string; sex: string; psychologist_photo: string; psychologist_docs: string }[],
      totalPsychologists: 0,
      currentPage: 1,
      pageSize: 10,
      psychologistToDelete: null as number | null,
      showDeleteModal: false,
      showPhotoModal: false,
      selectedPhoto: '' as string,
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
    totalPages(): number {
      return Math.ceil(this.totalPsychologists / this.pageSize);
    },
  },
  watch: {
    currentPage() {
      this.fetchPsychologists();
    },
  },
  mounted() {
    this.fetchPsychologists();
  },
  methods: {
    formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    async fetchPsychologists() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.ADMIN_PSYCHOLOGISTS(this.currentPage, this.pageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.psychologists = response.data.items;
          this.totalPsychologists = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки списка психологов:', error);
        }
      }
    },
    confirmDelete(psychologistId: number) {
      this.psychologistToDelete = psychologistId;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.psychologistToDelete = null;
      this.showDeleteModal = false;
    },
    async deletePsychologist() {
      if (this.psychologistToDelete) {
        const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
        if (jwtToken) {
          try {
            await axios.delete(`${API_ENDPOINTS.ADMIN_PSYCHOLOGIST_DELETE(this.psychologistToDelete)}`, {
              headers: { Authorization: `Bearer ${jwtToken}` },
            });
            this.fetchPsychologists();
            this.closeDeleteModal();
          } catch (error) {
            console.error('Ошибка удаления психолога:', error);
          }
        }
      }
    },
    openDocument(docPath: string) {
      window.open(`${this.baseUrl}/public/${docPath}`, '_blank');
    },
    openPhotoModal(photoUrl: string) {
      this.selectedPhoto = photoUrl;
      this.showPhotoModal = true;
    },
    closePhotoModal() {
      this.showPhotoModal = false;
      this.selectedPhoto = '';
    },
  },
});
</script>

<style scoped>
.admin-container {
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

.admin-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
}

.sidebar {
  width: 200px;
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 5px;
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
  background: linear-gradient(135deg, #00ff00, #00ffff);
  color: white;
}

.clients-section {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.clients-section h2 {
  text-align: left;
  margin-bottom: 1rem;
}

.clients-list {
  max-height: 500px;
  overflow-y: auto;
  position: relative;
}

.client-header,
.client-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}

.client-header {
  font-weight: bold;
  background: #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.client-header span,
.client-item span {
  flex: 1;
  min-width: 100px;
}

.cell {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-all;
}

.photo-column {
  flex: 0 0 50px !important;
  min-width: 50px !important;
}

.action-column {
  flex: 0 0 80px !important;
  min-width: 80px !important;
  text-align: right;
}

.client-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  color: #666;
  cursor: pointer;
}

.action-button.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.action-button.reject {
  background: linear-gradient(135deg, #ff4444, #ff0000);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.pagination-button:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
}

.modal-content.photo-modal {
  max-width: 600px;
  padding: 1rem;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #333;
}

.enlarged-photo {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.modal-actions .action-button {
  flex: 1;
  padding: 0.5rem;
}
</style>