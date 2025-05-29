<template>
  <div class="admin-container">
    <h1 class="title">Mental - dashboard</h1>
    <div class="admin-content">
      <div class="sidebar">
        <router-link to="/admin/clients" class="sidebar-item">Клиенты</router-link>
        <router-link to="/admin/psychologists" class="sidebar-item">Психологи</router-link>
        <router-link to="/admin/client-requests" class="sidebar-item active">Заявки</router-link>
        <router-link to="/admin/admins" class="sidebar-item">Админы</router-link>
      </div>

      <div class="clients-section">
        <h2>Заявки</h2>
        <div class="clients-list">
          <div class="client-header">
            <span>ID клиента</span>
            <span>Документ</span>
            <span>Статус</span>
            <span>Дата создания</span>
            <span class="action-column">Действия</span>
          </div>
          <div v-for="request in requests" :key="request.request_id" class="client-item">
            <span class="cell" :title="request.client_id.toString()">
              {{ request.client_id }}
            </span>
            <span class="cell">
              <button @click="openDocument(request.document)" class="action-button small">Документ</button>
            </span>
            <span class="cell" :title="request.status">
              {{ request.status }}
            </span>
            <span class="cell" :title="formatDate(request.created_at)">
              {{ formatDate(request.created_at) }}
            </span>
            <span class="action-column">
              <button
                @click="updateRequestStatus(request.request_id, 'принять', '')"
                class="action-button small accept"
                :disabled="request.status !== 'ожидание'"
              >
                &#10004
              </button>
              <button
                @click="confirmReject(request.request_id)"
                class="action-button small reject"
                :disabled="request.status !== 'ожидание'"
              >
                &#10006
              </button>
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

    <div v-if="showRejectModal" class="modal">
      <div class="modal-content" style="color: #1a1a1a;">
        <h3>Отклонение заявки</h3>
        <p>Укажите причину отклонения:</p>
        <textarea
          v-model="rejectionReason"
          placeholder="Причина отклонения"
          class="rejection-input"
        ></textarea>
        <div class="modal-actions">
          <button @click="updateRequestStatus(requestToReject, 'отвергнут', rejectionReason)" class="action-button reject">Отвергнуть</button>
          <button @click="closeRejectModal" class="action-button" style="background: #1a1a1a">Отмена</button>
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
  name: 'AdminClientRequests',
  data() {
    return {
      requests: [] as { request_id: number; client_id: number; document: string; status: string; rejection_reason: string; created_at: string; updated_at: string }[],
      totalRequests: 0,
      currentPage: 1,
      pageSize: 10,
      requestToReject: null as number | null,
      showRejectModal: false,
      rejectionReason: '',
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
    totalPages(): number {
      return Math.ceil(this.totalRequests / this.pageSize);
    },
  },
  watch: {
    currentPage() {
      this.fetchRequests();
    },
  },
  mounted() {
    this.fetchRequests();
  },
  methods: {
    formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    async fetchRequests() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.ADMIN_CLIENT_REQUESTS(this.currentPage, this.pageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.requests = response.data.items;
          this.totalRequests = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки списка заявок:', error);
        }
      }
    },
    async updateRequestStatus(requestId: number, status: string, rejectionReason: string) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.patch(
            `${API_ENDPOINTS.ADMIN_CLIENT_REQUEST_UPDATE(requestId)}`,
            { status, rejection_reason: status === 'отвергнут' ? rejectionReason : '' },
            { headers: { Authorization: `Bearer ${jwtToken}` } }
          );
          this.fetchRequests();
          if (this.showRejectModal) {
            this.closeRejectModal();
          }
        } catch (error) {
          console.error('Ошибка обновления статуса заявки:', error);
        }
      }
    },
    confirmReject(requestId: number) {
      this.requestToReject = requestId;
      this.rejectionReason = '';
      this.showRejectModal = true;
    },
    closeRejectModal() {
      this.requestToReject = null;
      this.showRejectModal = false;
      this.rejectionReason = '';
    },
    openDocument(docPath: string) {
      window.open(`${this.baseUrl}/public/${docPath}`, '_blank');
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

.action-column {
  flex: 0 0 150px !important;
  min-width: 150px !important;
  text-align: right;
  display: flex;
  gap: 0.5rem;
}

.action-button.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.action-button.accept {
  background: linear-gradient(135deg, #00ff00, #00bf4d);
}

.action-button.reject {
  background: linear-gradient(135deg, #ff4444, #ff0000);
}

.action-button:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.rejection-input {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
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