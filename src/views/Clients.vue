<template>
  <div class="clients-container">
    <div class="header">
      <h1 class="title">Mental</h1>
      <button @click="openRequestModal" class="action-button">Отправить запрос</button>
    </div>
    <div class="clients-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item">Профиль</router-link>
        <router-link to="/clients" class="sidebar-item active">Клиенты</router-link>
      </div>

      <div class="clients-list-section">
        <h2>Список клиентов</h2>
        <div class="clients-list">
          <div v-for="client in clients" :key="client.client_id" class="client-item" @click="selectClient(client)">
            <img :src="client.client_photo && client.client_photo !== 'none' ? `${baseUrl}/public/user_photos/${client.client_photo}` : 'https://via.placeholder.com/50'" alt="Client Photo" class="client-photo" />
            <div class="client-info">
              <p><strong>{{ client.first_name }} {{ client.last_name }}</strong></p>
              <p>Логин: {{ client.login }}</p>
            </div>
            <button @click.stop="removeClient(client.client_id)" class="action-button small reject">Удалить</button>
          </div>
        </div>
        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">Предыдущая</button>
          <span>Страница {{ currentPage }} из {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">Следующая</button>
        </div>
      </div>

      <div class="notes-section">
        <h2>Заметки клиента</h2>
        <div v-if="!selectedClient" class="empty-message">
          <p>Выберите клиента</p>
        </div>
        <div v-else>
          <div v-if="clientNotes.length" class="notes-list">
            <div v-for="note in clientNotes" :key="note.note_id" class="note-item" @click="openNoteModal(note)">
              <p><strong>{{ note.title }}</strong></p>
              <p>{{ note.createdAt.split('T')[0] }}</p>
            </div>
          </div>
          <p v-else>Заметок нет</p>
          <div v-if="clientNotes.length" class="pagination">
            <button :disabled="currentNotesPage === 1" @click="currentNotesPage--">Предыдущая</button>
            <span>Страница {{ currentNotesPage }} из {{ totalNotesPages }}</span>
            <button :disabled="currentNotesPage === totalNotesPages" @click="currentNotesPage++">Следующая</button>
          </div>
        </div>
      </div>

      <div v-if="showNoteModal" class="modal">
        <div class="modal-content">
          <h3>{{ selectedNote.title }}</h3>
          <p><strong>Дата создания:</strong> {{ selectedNote.createdAt.split('T')[0] }}</p>
          <p><strong>Эмоциональный окрас:</strong> {{ selectedNote.emotions.join(', ') }}</p>
          <p><strong>Текст:</strong></p>
          <p>{{ selectedNote.body }}</p>
          <button @click="closeNoteModal">Закрыть</button>
        </div>
      </div>

      <div v-if="showRequestModal" class="modal">
        <div class="modal-content">
          <h3>Поиск клиента</h3>
          <div class="search-form">
            <input v-model="searchLogin" placeholder="Введите логин клиента" />
            <button @click="searchClient" class="action-button">Поиск</button>
          </div>

          <div v-if="searchPerformed" class="search-results">
            <div v-if="foundClient" class="client-item">
              <img :src="foundClient.client_photo && foundClient.client_photo !== 'none' ? `${baseUrl}/public/user_photos/${foundClient.client_photo}` : 'https://via.placeholder.com/50'" alt="Client Photo" class="client-photo" />
              <div class="client-info">
                <p><strong>{{ foundClient.first_name }} {{ foundClient.last_name }}</strong></p>
                <p>Логин: {{ foundClient.login }}</p>
              </div>
              <button @click="sendRequest" class="action-button">Отправить запрос</button>
            </div>
            <p v-else class="empty-message">Клиент не найден</p>
          </div>

          <button @click="closeRequestModal" style="background: #1a1a1a">Закрыть</button>

          <div v-if="notificationMessage" class="notification" :class="{ error: isError, success: !isError }">
            {{ notificationMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import axios from 'axios';
import { BASE_URL, API_ENDPOINTS } from '../config/api';

export default defineComponent({
  name: 'Clients',
  data() {
    return {
      clients: [] as { client_id: number; login: string; first_name: string; last_name: string; client_photo: string }[],
      totalClients: 0,
      currentPage: 1,
      pageSize: 10,
      selectedClient: null as { client_id: number } | null,
      clientNotes: [] as { note_id: number; title: string; body: string; createdAt: string; emotions: string[] }[],
      totalNotes: 0,
      currentNotesPage: 1,
      notesPageSize: 5,
      showNoteModal: false,
      selectedNote: {} as { note_id: number; title: string; body: string; createdAt: string; emotions: string[] },
      showRequestModal: false,
      searchLogin: '',
      foundClient: null as { client_id: number; login: string; first_name: string; last_name: string; client_photo: string } | null,
      searchPerformed: false,
      notificationMessage: '',
      isError: false,
    };
  },
  computed: {
    baseUrl(): string {
      return BASE_URL;
    },
    totalPages(): number {
      return Math.ceil(this.totalClients / this.pageSize);
    },
    totalNotesPages(): number {
      return Math.ceil(this.totalNotes / this.notesPageSize);
    },
  },
  watch: {
    currentPage() {
      this.fetchClients();
    },
    currentNotesPage() {
      if (this.selectedClient) {
        this.fetchClientNotes(this.selectedClient.client_id);
      }
    },
  },
  mounted() {
    this.fetchClients();
  },
  methods: {
    async fetchClients() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.PSYCHOLOGIST_CLIENTS(this.currentPage, this.pageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.clients = response.data.items;
          this.totalClients = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки списка клиентов:', error);
        }
      }
    },
    async fetchClientNotes(clientId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.PSYCHOLOGIST_CLIENT_NOTES(clientId, this.currentNotesPage, this.notesPageSize)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.clientNotes = response.data.items;
          this.totalNotes = response.data.total;
        } catch (error) {
          console.error('Ошибка загрузки заметок клиента:', error);
          this.clientNotes = [];
        }
      }
    },
    async removeClient(clientId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.delete(`${API_ENDPOINTS.PSYCHOLOGIST_REMOVE_CLIENT(clientId)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.fetchClients();
          if (this.selectedClient?.client_id === clientId) {
            this.selectedClient = null;
            this.clientNotes = [];
          }
        } catch (error) {
          console.error('Ошибка удаления клиента:', error);
        }
      }
    },
    selectClient(client: { client_id: number }) {
      this.selectedClient = client;
      this.currentNotesPage = 1;
      this.fetchClientNotes(client.client_id);
    },
    openNoteModal(note: { note_id: number; title: string; body: string; createdAt: string; emotions: string[] }) {
      this.selectedNote = note;
      this.showNoteModal = true;
    },
    closeNoteModal() {
      this.showNoteModal = false;
      this.selectedNote = {} as { note_id: number; title: string; body: string; createdAt: string; emotions: string[] };
    },
    openRequestModal() {
      this.showRequestModal = true;
      this.searchLogin = '';
      this.foundClient = null;
      this.searchPerformed = false;
      this.notificationMessage = '';
    },
    closeRequestModal() {
      this.showRequestModal = false;
      this.searchLogin = '';
      this.foundClient = null;
      this.searchPerformed = false;
      this.notificationMessage = '';
    },
    async searchClient() {
      if (!this.searchLogin.trim()) {
        this.showNotification('Введите логин для поиска', true);
        return;
      }

      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.PSYCHOLOGIST_SEARCH_CLIENT(this.searchLogin)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.foundClient = response.data;
          this.searchPerformed = true;
          this.notificationMessage = '';
        } catch (error) {
          this.foundClient = null;
          this.searchPerformed = true;
          this.showNotification('Клиент не найден или произошла ошибка', true);
          console.error('Ошибка поиска клиента:', error);
        }
      } else {
        this.showNotification('Вы не авторизованы', true);
      }
    },
    async sendRequest() {
      if (!this.foundClient) return;

      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.post(`${API_ENDPOINTS.PSYCHOLOGIST_REQUEST_CLIENT(this.foundClient.client_id)}`, {}, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.showNotification('Запрос успешно отправлен', false);
          this.searchLogin = '';
          this.foundClient = null;
          this.searchPerformed = false;
        } catch (error) {
          this.showNotification('Ошибка отправки запроса: ' + (error.response?.data?.detail || 'Попробуйте снова'), true);
          console.error('Ошибка отправки запроса:', error);
        }
      }
    },
    showNotification(message: string, isError: boolean) {
      this.notificationMessage = message;
      this.isError = isError;
      setTimeout(() => {
        this.notificationMessage = '';
      }, 3000);
    },
  },
});
</script>

<style scoped>
.clients-container {
  min-height: 100vh;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.clients-content {
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

.clients-list-section {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.clients-list {
  max-height: 500px;
  overflow-y: auto;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  cursor: pointer;
}

.client-item:hover {
  background: #f0f0f0;
}

.client-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.client-info p {
  margin: 0.2rem 0;
  color: #333;
}

.notes-section {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.empty-message {
  text-align: center;
  color: #666;
}

.notes-list {
  max-height: 500px;
  overflow-y: auto;
}

.note-item {
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  cursor: pointer;
}

.note-item:hover {
  background: #f0f0f0;
}

.note-item p {
  margin: 0.2rem 0;
  color: #333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-button {
  padding: 0.5rem 1rem;
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.action-button.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.action-button.reject {
  background: linear-gradient(135deg, #ff4444, #ff0000);
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
  max-width: 600px;
  width: 100%;
  position: relative;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content p {
  margin: 0.5rem 0;
  color: #333;
}

.modal-content button {
  padding: 0.5rem;
  background: #00bf4d;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.search-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-form input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  flex: 1;
}

.search-results {
  margin-top: 1rem;
}

.notification {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #ff4444, #ff0000);
}

.notification.success {
  background: linear-gradient(135deg, #00ff00, #00ffff);
}
</style>