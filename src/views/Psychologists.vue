<template>
  <div class="psychologists-container">
    <h1 class="title">Mental</h1>
    <div class="psychologists-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item">Профиль</router-link>
        <router-link to="/notes" class="sidebar-item">Управление записками</router-link>
        <router-link v-if="userData.user_type === 'клиент'" to="/stats" class="sidebar-item">Статистика</router-link>
        <router-link to="/psychologists" class="sidebar-item active">Список психологов</router-link>
      </div>
      <div class="main-content">
        <div class="psychologists-list-section">
          <h2>Список психологов</h2>
          <div v-if="psychologists.length" class="psychologists-list">
            <div v-for="(psychologist, index) in psychologists" :key="psychologist.id" class="psychologist-item" :class="{ expanded: expandedIndex === index }">
              <div class="psychologist-summary" @click="toggleExpand(index)">
                <p><strong>{{ psychologist.first_name }} {{ psychologist.last_name }}</strong> ({{ psychologist.login }})</p>
              </div>
              <div v-if="expandedIndex === index" class="psychologist-details">
                <img v-if="psychologist.psychologist_photo" :src="`http://127.0.0.1:8000/public/user_photos/${psychologist.psychologist_photo}`" alt="Psychologist Photo" class="psychologist-photo" />
                <div class="psychologist-info">
                  <p><strong>Логин:</strong> {{ psychologist.login }}</p>
                  <p><strong>Имя:</strong> {{ psychologist.first_name }}</p>
                  <p><strong>Фамилия:</strong> {{ psychologist.last_name }}</p>
                  <p><strong>Пол:</strong> {{ psychologist.sex }}</p>
                </div>
              </div>
              <button class="action-button delete" @click="removePsychologist(psychologist.psychologist_id)">Удалить</button>
            </div>
          </div>
          <p v-else>Нет психологов</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import API_ENDPOINTS from "../config/api.ts";

export default defineComponent({
  name: 'Psychologists',
  data() {
    return {
      userData: {
        user_type: 'клиент',
      },
      psychologists: [] as { psychologist_id: number; login: string; first_name: string; last_name: string; sex: string; psychologist_photo?: string }[],
      expandedIndex: null as number | null,
      errorMessage: '',
    };
  },
  mounted() {
    this.fetchUserData();
    this.fetchPsychologists();
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
    async fetchPsychologists() {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          const response = await axios.get(API_ENDPOINTS.PSYCHOLOGISTS, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.psychologists = response.data.psychologists;
        } catch (error) {
          this.errorMessage = 'Ошибка загрузки списка психологов';
          console.error(error);
        }
      }
    },
    toggleExpand(index: number) {
      this.expandedIndex = this.expandedIndex === index ? null : index;
    },
    async removePsychologist(psychologistId: number) {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (jwtToken) {
        try {
          await axios.delete(API_ENDPOINTS.REMOVE_PSYCHOLOGIST(psychologistId), {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          this.fetchPsychologists();
        } catch (error) {
          this.errorMessage = 'Ошибка удаления психолога: ' + (error.response?.data?.detail || 'Попробуйте снова');
          console.error(error);
        }
      }
    },
  },
});
</script>

<style scoped>
.psychologists-container {
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

.psychologists-content {
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

.psychologists-list-section {
  background: white;
  padding: 1rem;
  border-radius: 5px;
  color: #333;
}

.psychologists-list {
  max-height: 500px;
  overflow-y: auto;
}

.psychologist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  flex-wrap: wrap;
}

.psychologist-summary {
  flex: 1;
  cursor: pointer;
}

.psychologist-summary p {
  margin: 0;
  color: #333;
}

.psychologist-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  width: 100%;
}

.psychologist-photo {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
}

.psychologist-info {
  flex: 1;
}

.psychologist-info p {
  margin: 0.2rem 0;
  color: #333;
}

.action-button.delete {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #FF4444, #FF0000);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

.action-button.delete:hover {
  opacity: 0.9;
}
</style>