<template>
  <div class="admin-container">
    <h1 class="title">Mental - dashboard</h1>
    <div class="admin-content">
      <div class="sidebar">
        <router-link to="/admin/clients" class="sidebar-item active">Клиенты</router-link>
        <router-link to="/admin/psychologists" class="sidebar-item">Психологи</router-link>
        <router-link to="/admin/client-requests" class="sidebar-item">Заявки</router-link>
        <router-link to="/admin/admins" class="sidebar-item">Админы</router-link>
      </div>

      <div class="clients-section">
        <h2>Клиенты</h2>
        <div class="clients-list">
          <div class="client-header">
            <span class="photo-column"></span>
            <span>Имя</span>
            <span>Логин</span>
            <span>Email</span>
            <span>Дата рождения</span>
            <span>Пол</span>
            <span>Верифицирован</span>
            <span class="action-column"></span>
          </div>
          <div v-for="client in clients" :key="client.client_id" class="client-item">
            <span class="photo-column">
              <img v-if="client.client_photo && client.client_photo !== 'none'" :src="`${baseUrl}/public/user_photos/${client.client_photo}`" alt="Client Photo" class="client-photo" />
              <svg v-else class="client-photo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
              </svg>
            </span>
            <span class="cell" :title="client.first_name + ' ' + client.last_name">
              <strong>{{ client.first_name }} {{ client.last_name }}</strong>
            </span>
            <span class="cell" :title="client.login">
              {{ client.login }}
            </span>
            <span class="cell" :title="client.email">
              {{ client.email }}
            </span>
            <span class="cell" :title="formatDate(client.birthAt)">
              {{ formatDate(client.birthAt) }}
            </span>
            <span class="cell" :title="client.sex">
              {{ client.sex }}
            </span>
            <span class="cell" :title="client.is_verified ? 'Да' : 'Нет'">
              {{ client.is_verified ? 'Да' : 'Нет' }}
            </span>
            <span class="action-column">
              <button @click="confirmDelete(client.client_id)" class="action-button small reject">Удалить</button>
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
        <p>Вы уверены, что хотите удалить клиента?</p>
        <div class="modal-actions">
          <button @click="deleteClient" class="action-button">Да</button>
          <button @click="closeDeleteModal" class="action-button" style="background: #1a1a1a">Нет</button>
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
  name: 'AdminClients',
  data() {
    return {
      clients: [] as { client_id: number; login: string; email: string; first_name: string; last_name: string; birthAt: string; sex: string; client_photo: string; is_verified: boolean }[],
      totalClients: 0,
      currentPage: 1,
      pageSize: 10,
      clientToDelete: null as number | null,
      showDeleteModal: false,
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
    totalPages(): number {
      return Math.ceil(this.totalClients / this.pageSize);
    },
  },
  watch: {
    currentPage() {
      this.fetchClients();
    },
  },
  mounted() {
    this.fetchClients();
  },
  methods: {
    formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    async fetchClients() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.ADMIN_CLIENTS(this.currentPage, this.pageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.clients = response.data.items;
          this.totalClients = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки списка клиентов:', error);
        }
      }
    },
    confirmDelete(clientId: number) {
      this.clientToDelete = clientId;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.clientToDelete = null;
      this.showDeleteModal = false;
    },
    async deleteClient() {
      if (this.clientToDelete) {
        const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
        if (jwtToken) {
          try {
            await axios.delete(`${API_ENDPOINTS.ADMIN_CLIENT_DELETE(this.clientToDelete)}`, {
              headers: { Authorization: `Bearer ${jwtToken}` },
            });
            this.fetchClients();
            this.closeDeleteModal();
          } catch (error) {
            console.error('Ошибка удаления клиента:', error);
          }
        }
      }
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