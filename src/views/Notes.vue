<template>
  <div class="notes-container">
    <h1 class="title">Mental</h1>
    <div class="notes-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item">Профиль</router-link>
        <router-link to="/notes" class="sidebar-item active">Управление записками</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/stats" class="sidebar-item">Статистика</router-link>
        <router-link to="/psychologists" class="sidebar-item">Список психологов</router-link>
      </div>
      <div class="main-content">
        <div class="notes-section">
          <div class="notes-list-section">
            <div class="controls">
              <input v-model="searchTerm" placeholder="Поиск по заголовку" class="search-input" @input="fetchNotes" />
              <button @click="openFilterDialog" class="action-button">🔍</button>
              <button @click="openSortDialog" class="action-button">⬇️</button>
            </div>
            <div class="notes-list">
              <p v-if="!notes.length" class="no-notes">Нет заметок</p>
              <div v-for="note in notes" :key="note.note_id" class="note-item" :class="{ selected: selectedNoteId === note.note_id }">
                <div class="note-summary" @click="selectNote(note.note_id)" @mouseover="hoveredNoteId = note.note_id" @mouseleave="hoveredNoteId = null">
                  <p><strong>{{ note.title || 'Без названия' }}</strong> ({{ formatDate(note.createdAt) }})</p>
                </div>
                <button @click="openDeleteDialog(note.note_id)" class="action-button delete">Удалить</button>
              </div>
            </div>
          </div>
          <div class="note-details-section">
            <div v-if="selectedNoteId" class="note-details">
              <div class="note-header">
                <input v-model="currentNote.title" placeholder="Заголовок" class="title-input" />
                <span class="emotions-display" v-html="displayEmotions"></span>
              </div>
              <textarea v-model="currentNote.body" placeholder="Текст заметки" class="body-input"></textarea>
              <div class="note-actions">
                <button @click="analyzeNote" class="action-button" style="background: linear-gradient(135deg, #00FF00, #00FFFF)">Проанализировать</button>
                <button @click="openEmotionDialog" class="action-button">Ввести эмоции вручную</button>
                <button @click="saveNote" class="action-button" style="background: #00bf4d">Сохранить</button>
              </div>
            </div>
            <button v-else @click="createNewNote" class="action-button add">Добавить заметку</button>
          </div>
        </div>
        <!-- Диалоговые окна -->
        <div v-if="showFilterDialog" class="modal">
          <div class="modal-content">
            <h3>Фильтр</h3>
            <input v-model="filterStartDate" type="date" />
            <input v-model="filterEndDate" type="date" />
            <button @click="applyFilter">Применить</button>
            <button @click="closeFilterDialog">Закрыть</button>
          </div>
        </div>
        <div v-if="showSortDialog" class="modal">
          <div class="modal-content">
            <h3>Сортировка</h3>
            <select v-model="sortBy">
              <option value="createdAt">По дате</option>
              <option value="title">По алфавиту</option>
            </select>
            <select v-model="sortOrder">
              <option value="asc">По возрастанию</option>
              <option value="desc">По убыванию</option>
            </select>
            <button @click="applySort">Применить</button>
            <button @click="closeSortDialog">Закрыть</button>
          </div>
        </div>
        <div v-if="showEmotionDialog" class="modal">
          <div class="modal-content">
            <h3>Выбор эмоций</h3>
            <select v-model="selectedEmotions[0]" class="emotion-select">
              <option value="">Эмоция 1</option>
              <option v-for="emotion in emotions" :key="emotion.value" :value="emotion.value" :style="{ color: emotion.color }">{{ emotion.value }}</option>
            </select>
            <select v-model="selectedEmotions[1]" class="emotion-select">
              <option value="">Эмоция 2</option>
              <option v-for="emotion in emotions" :key="emotion.value" :value="emotion.value" :style="{ color: emotion.color }">{{ emotion.value }}</option>
            </select>
            <select v-model="selectedEmotions[2]" class="emotion-select">
              <option value="">Эмоция 3</option>
              <option v-for="emotion in emotions" :key="emotion.value" :value="emotion.value" :style="{ color: emotion.color }">{{ emotion.value }}</option>
            </select>
            <button @click="applyEmotions">Сохранить</button>
            <button @click="closeEmotionDialog">Закрыть</button>
          </div>
        </div>
        <div v-if="showDeleteDialog" class="modal">
          <div class="modal-content">
            <h3>Удалить заметку?</h3>
            <p style="color: #333">Вы уверены, что хотите удалить эту заметку?</p>
            <button @click="confirmDelete" class="action-button delete">Да</button>
            <button @click="closeDeleteDialog">Нет</button>
          </div>
        </div>
        <div v-if="isLoading" class="loader-overlay">
          <div class="loader"></div>
        </div>
        <!-- Всплывающее уведомление -->
        <div v-if="showNotification" class="notification" :class="{ 'success': notificationType === 'success', 'error': notificationType === 'error' }">
          {{ notificationMessage }}
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
  name: 'Notes',
  data() {
    return {
      userData: { user_type: 'клиент' },
      notes: [] as { note_id: number; title: string; body: string; emotions: string[]; createdAt: string }[],
      selectedNoteId: null as number | null,
      currentNote: { note_id: -1, title: '', body: '', emotions: [], createdAt: '' } as { note_id: number; title: string; body: string; emotions: string[]; createdAt: string },
      hoveredNoteId: null as number | null,
      searchTerm: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filterStartDate: '',
      filterEndDate: '',
      selectedEmotions: ['', '', ''],
      isLoading: false,
      showFilterDialog: false,
      showSortDialog: false,
      showEmotionDialog: false,
      showDeleteDialog: false,
      deleteNoteId: null as number | null,
      errorMessage: '',
      emotions: [
        { value: 'испуг', color: '#FFA500' },
        { value: 'гнев', color: '#FF0000' },
        { value: 'тревога', color: '#FF4500' },
        { value: 'стыд', color: '#C71585' },
        { value: 'неловкость', color: '#FF69B4' },
        { value: 'скука', color: '#808080' },
        { value: 'спокойствие', color: '#00FFFF' },
        { value: 'замешательство', color: '#DAA520' },
        { value: 'отвращение', color: '#32CD32' },
        { value: 'восторг', color: '#FFD700' },
        { value: 'разочарование', color: '#4682B4' },
        { value: 'радость', color: '#00FF00' },
        { value: 'зависть', color: '#9ACD32' },
        { value: 'ностальгия', color: '#DEB887' },
        { value: 'гордость', color: '#FF6347' },
        { value: 'грусть', color: '#0000FF' },
        { value: 'удовлетворение', color: '#7FFFD4' },
        { value: 'удивление', color: '#800080' },
      ],
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
    };
  },
  computed: {
    displayEmotions() {
      if (!this.currentNote.emotions || !this.currentNote.emotions.length) return 'Нет эмоций';
      return this.currentNote.emotions.map(emotion => `<span style="color: ${this.getEmotionColor(emotion)}">${emotion}</span>`).join(', ');
    },
  },
  mounted() {
    this.fetchUserData();
    this.fetchNotes();
  },
  methods: {
    async fetchUserData() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.ME, { headers: { Authorization: `Bearer ${jwtToken}` } });
          this.userData = response.data;
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки данных пользователя';
          console.error('Ошибка загрузки данных пользователя:', error);
        }
      }
    },
    async fetchNotes() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const params: { [key: string]: string } = {};
          if (this.sortBy) params.sort_by = this.sortBy;
          if (this.sortOrder) params.sort_order = this.sortOrder;
          if (this.filterStartDate) params.start_date = this.filterStartDate;
          if (this.filterEndDate) params.end_date = this.filterEndDate;
          if (this.searchTerm) params.search = this.searchTerm;

          const response = await axios.get(API_ENDPOINTS.NOTES_GET, { headers: { Authorization: `Bearer ${jwtToken}` }, params });
          this.notes = response.data.notes.map((note: any) => ({
            ...note,
            body: note.body || '',
            emotions: note.emotions || [],
          }));
          console.log('Заметки загружены:', this.notes);
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки заметок';
          console.error('Ошибка загрузки заметок:', error);
        }
      }
    },
    formatDate(dateStr: string) {
      return new Date(dateStr).toLocaleDateString();
    },
    async selectNote(noteId: number) {
      this.selectedNoteId = this.selectedNoteId === noteId ? null : noteId;
      if (this.selectedNoteId) {
        await this.fetchNoteDetails(noteId);
        console.log('После выбора заметки currentNote:', this.currentNote);
      } else {
        this.currentNote = { note_id: -1, title: '', body: '', emotions: [], createdAt: '' };
      }
    },
    async fetchNoteDetails(noteId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.NOTE(noteId), { headers: { Authorization: `Bearer ${jwtToken}` } });
          this.currentNote = {
            note_id: response.data.note_id || -1,
            title: response.data.title || '',
            body: response.data.body || '',
            emotions: response.data.emotions || [],
            createdAt: response.data.createdAt || '',
          };
          console.log('Данные заметки загружены:', this.currentNote);
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки деталей заметки';
          console.error('Ошибка загрузки деталей заметки:', error);
        }
      }
    },
    createNewNote() {
      this.selectedNoteId = -1;
      this.currentNote = { note_id: -1, title: '', body: '', emotions: [], createdAt: new Date().toISOString() };
    },
    async saveNote() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const data = { title: this.currentNote.title, body: this.currentNote.body, emotions: this.currentNote.emotions.filter(e => e) };
          if (this.currentNote.note_id === -1) {
            const response = await axios.post(API_ENDPOINTS.NOTE_CREATE, data, { headers: { Authorization: `Bearer ${jwtToken}` } });
            this.currentNote = {
              ...response.data,
              emotions: response.data.emotions || [],
            };
            this.selectedNoteId = response.data.note_id;
          } else {
            const response = await axios.patch(API_ENDPOINTS.NOTE_UPDATE(this.currentNote.note_id), data, { headers: { Authorization: `Bearer ${jwtToken}` } });
            this.currentNote = {
              ...response.data,
              emotions: response.data.emotions || [],
            };
          }
          await this.fetchNotes();
          this.showNotificationMessage('Заметка успешно сохранена', 'success');
        } catch (error) {
          this.errorMessage = 'Ошибка сохранения заметки: ' + (error.response?.data?.detail || 'Попробуйте снова');
          this.showNotificationMessage(this.errorMessage, 'error');
          console.error('Ошибка сохранения заметки:', error);
        }
      }
    },
    openFilterDialog() {
      this.showFilterDialog = true;
    },
    closeFilterDialog() {
      this.showFilterDialog = false;
    },
    applyFilter() {
      this.fetchNotes();
      this.closeFilterDialog();
    },
    openSortDialog() {
      this.showSortDialog = true;
    },
    closeSortDialog() {
      this.showSortDialog = false;
    },
    applySort() {
      this.fetchNotes();
      this.closeSortDialog();
    },
    openEmotionDialog() {
      this.selectedEmotions = [...this.currentNote.emotions, '', '', ''].slice(0, 3);
      this.showEmotionDialog = true;
    },
    closeEmotionDialog() {
      this.showEmotionDialog = false;
    },
    applyEmotions() {
      this.currentNote.emotions = this.selectedEmotions.filter(e => e);
      this.closeEmotionDialog();
    },
    getEmotionColor(emotion: string) {
      const e = this.emotions.find(e => e.value === emotion);
      return e ? e.color : '#000000';
    },
    openDeleteDialog(noteId: number) {
      console.log('Открываем диалог удаления для noteId:', noteId);
      this.deleteNoteId = noteId;
      this.showDeleteDialog = true;
    },
    closeDeleteDialog() {
      this.showDeleteDialog = false;
      this.deleteNoteId = null;
    },
    async confirmDelete() {
      if (this.deleteNoteId) {
        const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
        if (jwtToken) {
          try {
            console.log('Отправляем запрос на удаление заметки:', this.deleteNoteId);
            await axios.delete(API_ENDPOINTS.NOTE_DELETE(this.deleteNoteId), { headers: { Authorization: `Bearer ${jwtToken}` } });
            this.notes = this.notes.filter(n => n.note_id !== this.deleteNoteId);
            if (this.selectedNoteId === this.deleteNoteId) {
              this.selectedNoteId = null;
              this.currentNote = { note_id: -1, title: '', body: '', emotions: [], createdAt: '' };
            }
            await this.fetchNotes();
            this.closeDeleteDialog();
          } catch (error) {
            this.errorMessage = 'Ошибка удаления заметки: ' + (error.response?.data?.detail || 'Попробуйте снова');
            console.error('Ошибка удаления заметки:', error);
          }
        }
      }
    },
    async analyzeNote() {
      if (this.currentNote.note_id === -1) {
        this.errorMessage = 'Сначала сохраните заметку';
        return;
      }
      this.isLoading = true;
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.NOTE_ANALYZE(this.currentNote.note_id), { headers: { Authorization: `Bearer ${jwtToken}` } });
          this.currentNote.emotions = response.data.emotions || [];
        } catch (error) {
          this.errorMessage = 'Ошибка анализа: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error('Ошибка анализа:', error);
        } finally {
          this.isLoading = false;
        }
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
.notes-container {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: left;
  margin-bottom: 1rem;
}

.notes-content {
  display: flex;
  width: 100%;
  gap: 0.5rem;
}

.sidebar {
  width: 15vw;
  min-width: 200px;
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
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  color: white;
}

.main-content {
  flex: 1;
  min-height: 600px;
  padding: 1rem;
}

.notes-section {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.notes-list-section {
  width: 20vw;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  flex: 1;
}

.action-button {
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  width: 40px;
  text-align: center;
}

.controls .action-button {
  background: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
}

.action-button.delete {
  background: linear-gradient(135deg, #FF4444, #FF0000);
  width: auto;
  padding: 0.5rem;
}

.action-button.add {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.notes-list {
  max-height: 500px;
  overflow-y: auto;
}

.no-notes {
  color: #666;
  text-align: left;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  justify-content: flex-start;
}

.note-item.selected {
  background: #f0f0f0;
}

.note-summary {
  flex: 1;
  cursor: pointer;
}

.note-summary p {
  margin: 0;
  color: #333;
  text-align: left;
}

.note-details-section {
  width: 30vw;
  background: white;
  padding: 1rem;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
}

.note-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.title-input, .body-input {
  background: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem;
  width: 100%;
  color: #333;
}

.title-input:hover, .body-input:hover {
  border: 1px solid #00FF00;
}

.emotions-display {
  color: #333;
  font-size: 1rem;
}

.body-input {
  min-height: 200px;
  resize: vertical;
}

.note-actions {
  display: flex;
  gap: 1rem;
}

.note-actions .action-button {
  padding: 0.75rem 1.5rem;
  width: auto;
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
  color: #333;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>