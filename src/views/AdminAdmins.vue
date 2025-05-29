<template>
  <div class="admin-container">
    <div class="header-section">
      <h1 class="title">Mental - dashboard</h1>
      <button @click="openAddAdminModal" class="action-button add-admin">Добавить администратора</button>
    </div>
    <div class="admin-content">
      <div class="sidebar">
        <router-link to="/admin/clients" class="sidebar-item">Клиенты</router-link>
        <router-link to="/admin/psychologists" class="sidebar-item">Психологи</router-link>
        <router-link to="/admin/client-requests" class="sidebar-item">Заявки</router-link>
        <router-link to="/admin/admins" class="sidebar-item active">Админы</router-link>
      </div>

      <div class="clients-section">
        <h2>Админы</h2>
        <div class="clients-list">
          <div class="client-header">
            <span>ID администратора</span>
            <span>Логин</span>
          </div>
          <div v-for="admin in admins" :key="admin.admin_id" class="client-item">
            <span class="cell" :title="admin.admin_id.toString()">
              {{ admin.admin_id }}
            </span>
            <span class="cell" :title="admin.login">
              {{ admin.login }}
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

    <div v-if="showAddAdminModal" class="modal">
      <div class="modal-content" style="color: #1a1a1a;">
        <h3>Добавить администратора</h3>
        <input
          v-model="newAdminLogin"
          placeholder="Логин"
          class="admin-input"
        />
        <input
          v-model="newAdminPassword"
          type="password"
          placeholder="Пароль"
          class="admin-input"
        />
        <div class="modal-actions">
          <button @click="addAdmin" class="action-button">Добавить</button>
          <button @click="closeAddAdminModal" class="action-button" style="background: #1a1a1a">Отмена</button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-notification">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { BASE_URL, API_ENDPOINTS } from '../config/api';

export default defineComponent({
  name: 'AdminAdmins',
  data() {
    return {
      admins: [] as { admin_id: number; login: string }[],
      totalAdmins: 0,
      currentPage: 1,
      pageSize: 10,
      showAddAdminModal: false,
      newAdminLogin: '',
      newAdminPassword: '',
      errorMessage: '',
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
    totalPages(): number {
      return Math.ceil(this.totalAdmins / this.pageSize);
    },
  },
  watch: {
    currentPage() {
      this.fetchAdmins();
    },
  },
  mounted() {
    this.fetchAdmins();
  },
  methods: {
    async fetchAdmins() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.ADMIN_ADMINS(this.currentPage, this.pageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.admins = response.data.items;
          this.totalAdmins = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки списка администраторов:', error);
        }
      }
    },
    openAddAdminModal() {
      this.newAdminLogin = '';
      this.newAdminPassword = '';
      this.showAddAdminModal = true;
    },
    closeAddAdminModal() {
      this.showAddAdminModal = false;
      this.newAdminLogin = '';
      this.newAdminPassword = '';
    },
    async addAdmin() {
      if (!this.newAdminLogin.trim() || !this.newAdminPassword.trim()) {
        this.showError('Логин и пароль не могут быть пустыми');
        return;
      }

      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.post(
            `${API_ENDPOINTS.ADMIN_CREATE}`,
            { login: this.newAdminLogin, password: this.newAdminPassword },
            { headers: { Authorization: `Bearer ${jwtToken}` } }
          );
          this.fetchAdmins();
          this.closeAddAdminModal();
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Ошибка добавления администратора';
          this.showError(errorMsg);
        }
      }
    },
    showError(message: string) {
      this.errorMessage = message;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    },
  },
});
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  padding: 1rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: left;
}

.add-admin {
  background: linear-gradient(135deg, #00ff00, #00bf4d);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  border: none;
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

.admin-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
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

.error-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ff4444;
  color: white;
  padding: 1rem;
  border-radius: 5px;
  z-index: 2000;
  max-width: 300px;
  text-align: center;
}
</style>