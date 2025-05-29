<template>
  <div class="stats-container">
    <h1 class="title">Mental</h1>
    <div class="stats-content">
      <div class="sidebar">
        <router-link to="/profile" class="sidebar-item">Профиль</router-link>
        <router-link to="/notes" class="sidebar-item">Управление записками</router-link>
        <router-link to="/stats" class="sidebar-item active">Статистика</router-link>
        <router-link to="/psychologists" class="sidebar-item">Список психологов</router-link>
      </div>
      <div class="main-content">
        <div class="controls">
          <label for="period-select" class="control-label">Тип графика:</label>
          <select id="period-select" v-model="selectedPeriod" @change="updateInputs" style="color: white">
            <option value="Day">День</option>
            <option value="Week">Неделя</option>
            <option value="Month">Месяц</option>
            <option value="Time of Day">Время суток</option>
          </select>

          <div class="date-picker" v-if="selectedPeriod === 'Day' || selectedPeriod === 'Time of Day'">
            <label for="date-picker" class="control-label">Выберите день:</label>
            <input type="date" id="date-picker" v-model="selectedDate" @change="updateChart" style="color: white" />
          </div>
          <div class="date-picker" v-if="selectedPeriod === 'Week'">
            <label for="week-picker" class="control-label">Выберите неделю:</label>
            <input type="date" id="week-picker" v-model="selectedWeekDate" @change="updateChart" style="color: white" />
          </div>
          <div class="date-picker" v-if="selectedPeriod === 'Month'">
            <label for="month-picker" class="control-label">Выберите месяц:</label>
            <input type="month" id="month-picker" v-model="selectedMonthDate" @change="updateChart" style="color: white" />
          </div>
        </div>

        <div class="chart-container">
          <canvas id="stats-chart" ref="chartCanvas"></canvas>
        </div>

        <div class="calendar-section">
          <h2 class="calendar-title">Календарь эмоций</h2>
          <div class="calendar-controls">
            <button @click="changeMonth(-1)" class="calendar-nav-button">◄</button>
            <span class="calendar-month">{{ calendarMonthName }} {{ calendarYear }}</span>
            <button @click="changeMonth(1)" class="calendar-nav-button">►</button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-header" v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']" :key="day">
              {{ day }}
            </div>
            <div v-for="day in calendarDays" :key="day.date" class="calendar-day" :style="day.style">
              {{ day.day }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loader-overlay">
      <div class="loader"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

export default defineComponent({
  name: 'Stats',
  setup() {
    const selectedPeriod = ref('Day');
    const selectedDate = ref(new Date().toISOString().split('T')[0]);
    const selectedWeekDate = ref(new Date().toISOString().split('T')[0]);
    const selectedMonthDate = ref(new Date().toISOString().split('T')[0].slice(0, 7));
    const isLoading = ref(false);
    const chartInstance = ref<Chart | null>(null);
    const chartCanvas = ref<HTMLCanvasElement | null>(null);

    const calendarDate = ref(new Date());
    const calendarDays = ref([]);
    const calendarMonthName = ref('');
    const calendarYear = ref(0);

    const emotionsList = [
      'испуг', 'гнев', 'тревога', 'стыд', 'неловкость', 'скука', 'спокойствие', 'замешательство',
      'отвращение', 'восторг', 'разочарование', 'радость', 'зависть', 'ностальгия', 'гордость',
      'грусть', 'удовлетворение', 'удивление'
    ];

    const emotionColors = {
      'испуг': '#FFA500',
      'гнев': '#FF0000',
      'тревога': '#FF4500',
      'стыд': '#C71585',
      'неловкость': '#FF69B4',
      'скука': '#808080',
      'спокойствие': '#00FFFF',
      'замешательство': '#DAA520',
      'отвращение': '#32CD32',
      'восторг': '#FFD700',
      'разочарование': '#4682B4',
      'радость': '#00FF00',
      'зависть': '#9ACD32',
      'ностальгия': '#DEB887',
      'гордость': '#FF6347',
      'грусть': '#0000FF',
      'удовлетворение': '#7FFFD4',
      'удивление': '#800080',
    };

    const chartColors = [
      '#FFA500', '#FF0000', '#FF4500', '#C71585', '#FF69B4', '#808080', '#00FFFF', '#DAA520',
      '#32CD32', '#FFD700', '#4682B4', '#00FF00', '#9ACD32', '#DEB887', '#FF6347', '#0000FF',
      '#7FFFD4', '#800080'
    ];

    const notes = ref([]);

    const fetchNotes = async (startDate: string, endDate: string) => {
      const jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
      if (!jwtToken) {
        return;
      }

      isLoading.value = true;
      try {
        const response = await axios.get(API_ENDPOINTS.NOTES_GET, {
          headers: { Authorization: `Bearer ${jwtToken}` },
          params: { start_date: startDate, end_date: endDate },
        });
        notes.value = response.data.notes;
      } catch (error) {
        console.error('Ошибка загрузки заметок:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const updateInputs = () => {
      updateChart();
    };

    const updateChart = async () => {
      let startDate: string, endDate: string;

      if (selectedPeriod.value === 'Day') {
        startDate = selectedDate.value;
        endDate = selectedDate.value;
      } else if (selectedPeriod.value === 'Week') {
        const date = new Date(selectedWeekDate.value);
        const day = date.getDay();
        const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diffToMonday));
        startDate = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endDate = sunday.toISOString().split('T')[0];
      } else if (selectedPeriod.value === 'Time of Day') {
        const date = new Date(selectedDate.value); // selectedDate for Time of Day
        const day = date.getDay();
        const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diffToMonday));
        startDate = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endDate = sunday.toISOString().split('T')[0];
      } else if (selectedPeriod.value === 'Month') {
        const [year, month] = selectedMonthDate.value.split('-');
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay}`;
      } else {
        return;
      }

      await fetchNotes(startDate, endDate);

      // destroy the previous chart
      if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null;
      }

      if (!chartCanvas.value) {
        console.error('Канвас не найден при попытке построить график');
        return;
      }

      const ctx = chartCanvas.value.getContext('2d');
      if (!ctx) {
        console.error('Контекст канваса не найден');
        return;
      }
      ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height);

      try {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: [],
            datasets: [],
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: '' },
              legend: { position: 'right' },
            },
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Количество заметок' } },
            },
          },
        };

        if (selectedPeriod.value === 'Time of Day') {
          const timeRanges = {
            'Morning': { start: 5, end: 11 },
            'Day': { start: 11, end: 18 },
            'Evening': { start: 18, end: 23 },
            'Night': { start: 23, end: 5 },
          };

          const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
          const data = weekDays.reduce((acc: any, day: string) => {
            acc[day] = Object.keys(timeRanges).reduce((periodAcc: any, period: string) => {
              periodAcc[period] = emotionsList.reduce((emotionAcc: any, emotion: string) => {
                emotionAcc[emotion] = 0;
                return emotionAcc;
              }, {});
              return periodAcc;
            }, {});
            return acc;
          }, {});

          notes.value.forEach((note: any) => {
            const date = new Date(note.createdAt);
            const dayName = weekDays[date.getDay()];
            const hour = date.getHours();

            for (const [period, { start, end }] of Object.entries(timeRanges)) {
              if ((start <= hour && hour < end) || (start > end && (hour >= start || hour < end))) {
                note.emotions.forEach((emotion: string) => {
                  if (emotion in data[dayName][period]) {
                    data[dayName][period][emotion]++;
                  }
                });
              }
            }
          });

          chartConfig.data.labels = weekDays.flatMap((day: string) =>
              Object.keys(timeRanges).map((period: string) => `${day} (${period})`)
          );
          chartConfig.data.datasets = emotionsList.map((emotion: string, index: number) => ({
            label: emotion,
            data: weekDays.flatMap((day: string) =>
                Object.keys(timeRanges).map((period: string) => data[day][period][emotion])
            ),
            backgroundColor: chartColors[index % chartColors.length],
            stack: 'Stack 0',
          }));
          chartConfig.options.plugins!.title!.text = 'Распределение эмоций по времени суток за неделю';
        } else {
          const emotionCounts = emotionsList.reduce((acc: any, emotion: string) => {
            acc[emotion] = 0;
            return acc;
          }, {});

          notes.value.forEach((note: any) => {
            note.emotions.forEach((emotion: string) => {
              if (emotion in emotionCounts) {
                emotionCounts[emotion]++;
              }
            });
          });

          chartConfig.data.labels = emotionsList;
          chartConfig.data.datasets = [{
            label: 'Количество заметок',
            data: emotionsList.map((emotion: string) => emotionCounts[emotion]),
            backgroundColor: chartColors.slice(0, emotionsList.length),
          }];
          chartConfig.options.plugins!.title!.text = `Заметки за ${selectedPeriod.value.toLowerCase()}`;
          chartConfig.options.scales!.x!.ticks = { autoSkip: false, maxRotation: 45, minRotation: 45 };
        }

        chartInstance.value = new Chart(ctx, chartConfig);
      } catch (error) {
        console.error('Ошибка при создании графика:', error);
      }
    };

    const updateCalendar = async () => {
      const year = calendarDate.value.getFullYear();
      const month = calendarDate.value.getMonth();
      calendarMonthName.value = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(calendarDate.value);
      calendarYear.value = year;

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];

      await fetchNotes(startDate, endDate);

      const daysInMonth = lastDayOfMonth.getDate();
      const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

      const days = [];
      for (let i = 0; i < firstDayIndex; i++) {
        days.push({ day: '', date: '', style: '' });
      }

      const dailyEmotions: { [key: string]: { [key: string]: number } } = {};
      notes.value.forEach((note: any) => {
        const date = new Date(note.createdAt);
        const utcDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        ));
        const dateStr = utcDate.toISOString().split('T')[0];

        if (!dailyEmotions[dateStr]) {
          dailyEmotions[dateStr] = {};
        }
        note.emotions.forEach((emotion: string) => {
          dailyEmotions[dateStr][emotion] = (dailyEmotions[dateStr][emotion] || 0) + 1;
        });
      });

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dateStr = date.toISOString().split('T')[0];
        const emotions = dailyEmotions[dateStr] || {};
        const sortedEmotions = Object.entries(emotions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([emotion]) => emotion);

        let style = '';
        if (sortedEmotions.length === 0) {
          style = 'background: #f0f0f0;';
        } else {
          const colors = sortedEmotions.map((emotion: string) => emotionColors[emotion] || '#000000');
          const angleStep = 360 / colors.length;
          const transitionWidth = 20; // degrees

          const gradientStops = [];
          for (let i = 0; i < colors.length; i++) {
            const startAngle = i * angleStep;
            const endAngle = (i + 1) * angleStep;
            const transitionStart = startAngle + (angleStep - transitionWidth) / 2;
            const transitionEnd = endAngle - (angleStep - transitionWidth) / 2;

            gradientStops.push(`${colors[i]} ${startAngle}deg ${transitionStart}deg`);
            if (i < colors.length - 1) {
              gradientStops.push(`${colors[i]} ${transitionStart}deg`);
              gradientStops.push(`${colors[i + 1]} ${transitionEnd}deg`);
            } else {
              gradientStops.push(`${colors[i]} ${transitionStart}deg`);
              gradientStops.push(`${colors[0]} ${360 - transitionWidth}deg`);
            }
          }
          gradientStops.push(`${colors[0]} 360deg`);
          style = `background: conic-gradient(from 0deg, ${gradientStops.join(', ')});`;
        }

        days.push({ day, date: dateStr, style });
      }

      calendarDays.value = days;
    };

    const changeMonth = (delta: number) => {
      calendarDate.value = new Date(calendarDate.value.setMonth(calendarDate.value.getMonth() + delta));
      updateCalendar();
    };

    onMounted(() => {
      updateChart();
      updateCalendar();
    });

    onBeforeUnmount(() => {
      if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null;
      }
    });

    watch([selectedPeriod, selectedDate, selectedWeekDate, selectedMonthDate], () => {
      updateChart();
    });

    return {
      selectedPeriod,
      selectedDate,
      selectedWeekDate,
      selectedMonthDate,
      isLoading,
      chartCanvas,
      calendarDays,
      calendarMonthName,
      calendarYear,
      updateInputs,
      updateChart,
      changeMonth,
    };
  },
});
</script>

<style scoped>
.stats-container {
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

.stats-content {
  display: flex;
  width: 100%;
  gap: 0.5rem;
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
  padding: 1rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.control-label {
  font-size: 1.2rem;
  color: #333;
  font-weight: bold;
}

select, input[type="date"], input[type="month"] {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  color: #333;
}

.date-picker {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chart-container {
  max-width: 100%;
  margin-bottom: 2rem;
}

.chart-container canvas {
  width: 100% !important;
  height: 400px !important;
}

.calendar-section {
  margin-top: 2rem;
}

.calendar-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.calendar-nav-button {
  background: linear-gradient(135deg, #00FF00, #00FFFF);
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
}

.calendar-month {
  font-size: 1.2rem;
  color: #333;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: #ccc;
  padding: 2px;
  border-radius: 5px;
}

.calendar-header {
  background: #f0f0f0;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  color: #333;
}

.calendar-day {
  background: #fff;
  padding: 0.5rem;
  text-align: center;
  color: #333;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
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