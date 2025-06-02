const { createApp } = Vue;
const API_URL = 'http://localhost:8000';

const HealthModal = {
    template: `
        <div>
            <h3>Новая запись о здоровье</h3>
            <div class="form-group">
                <label>Дата записи:</label>
                <input type="date" v-model="newData.record_date" required>
            </div>
            <div class="form-group">
                <label>Вес (кг):</label>
                <input type="number" step="0.1" v-model="newData.weight" required>
            </div>
            <div class="form-group">
                <label>Описание:</label>
                <textarea v-model="newData.description" required></textarea>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-secondary">Отмена</button>
                <button @click="handleSave" class="btn btn-primary">Сохранить</button>
            </div>
        </div>
    `,
    data() {
        return {
            newData: {
                record_date: new Date().toISOString().split('T')[0],
                weight: null,
                description: ''
            }
        }
    },
    methods: {
        handleSave() {
            if(this.validate()) {
                this.$emit('save', this.newData);
            }
        },
        validate() {
            let isValid = true;
            const errors = [];
            if(!this.newData.record_date) {
                errors.push('Укажите дату записи');
                isValid = false;
            }
            if(!this.newData.weight || this.newData.weight <= 0) {
                errors.push('Введите корректный вес');
                isValid = false;
            }
            if(!this.newData.description.trim()) {
                errors.push('Добавьте описание');
                isValid = false;
            }
            if(errors.length > 0) {
                alert(errors.join('\n'));
            }
            return isValid;
        }
    }
};
const VaccinationModal = { 
    template: `
        <div>
            <h3>Новая прививка</h3>
            <div class="form-group">
                <label>Название:</label>
                <input type="text" v-model="newData.name" required>
            </div>
            <div class="form-group">
                <label>Дата введения:</label>
                <input 
                    type="date" 
                    v-model="newData.date_administered" 
                    :max="maxDate"
                    required
                    @change="updateNextDateMin"
                >
            </div>
            <div class="form-group">
            <label class="vax-checkbox">
                <input 
                    type="checkbox" 
                    v-model="newData.repeated"
                    @change="handleRepeatedChange"
                >
                <span class="vax-checkmark"></span>
                <span class="vax-repeated-label">Повторяемая прививка?</span>
                <div class="vax-help-text">(отметьте если требуется повторная вакцинация)</div>
            </label>
        </div>
                <div class="vax-nextdate-container" :class="{visible: newData.repeated}">
                    <div class="form-group">
                        <label>Следующая дата:</label>
                        <input 
                            type="date" 
                            v-model="newData.next_date"
                            :min="newData.date_administered"
                            :required="newData.repeated"
                            class="animated-input"
                        >
                    </div>
                </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-secondary">Отмена</button>
                <button @click="handleSave" class="btn btn-primary">Сохранить</button>
            </div>
        </div>
    `,
    data() {
        return {
            newData: {
                name: '',
                date_administered: new Date().toISOString().split('T')[0],
                next_date: null,
                repeated: false
            },
            maxDate: new Date().toISOString().split('T')[0]
        }
    },
    methods: {
        updateNextDateMin() {
            if(this.newData.next_date < this.newData.date_administered) {
                this.newData.next_date = this.newData.date_administered;
            }
        },
        handleRepeatedChange() {
            if(!this.newData.repeated) {
                this.newData.next_date = null;
            }
        },
        handleSave() {
            const errors = [];
            if(!this.newData.name.trim()) {
                errors.push('Укажите название прививки');
            }
            if(this.newData.repeated && !this.newData.next_date) {
                errors.push('Для повторяемых прививок укажите следующую дату');
            }
            if(this.newData.next_date && this.newData.next_date < this.newData.date_administered) {
                errors.push('Следующая дата не может быть раньше даты введения');
            }
            if(errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            this.$emit('save', this.newData);
        }
    }
};
const FeedingModal = { 
    template: `
        <div>
            <h3>Новое кормление</h3>
            <div class="form-group">
                <label>Дата и время:</label>
                <input type="datetime-local" v-model="newData.feeding_time" required>
            </div>
            <div class="form-group">
                <label>Тип корма:</label>
                <input type="text" v-model="newData.food_type" required>
            </div>
            <div class="form-group">
                <label>Количество:</label>
                <input type="text" v-model="newData.quantity" required>
            </div>
            <div class="form-group">
                <label>Примечания:</label>
                <textarea v-model="newData.notes"></textarea>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-secondary">Отмена</button>
                <button @click="handleSave" class="btn btn-primary">Сохранить</button>
            </div>
        </div>
    `,
    data() {
        const now = new Date();
        const initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        return { 
            newData: {
                feeding_time: initialDate,
                food_type: '',
                quantity: '',
                notes: ''
            } 
        }
    },
    methods: {
        handleSave() {
            if(this.validate()) {
                const payload = {
                    ...this.newData,
                    feeding_time: new Date(this.newData.feeding_time).toISOString()
                };
                this.$emit('save', payload);
            }
        },
        validate() {
            let isValid = true;
            const errors = [];
            if(!this.newData.food_type.trim()) {
                errors.push('Укажите тип корма');
                isValid = false;
            }
            if(!this.newData.quantity.trim()) {
                errors.push('Укажите количество');
                isValid = false;
            }
            if(!this.newData.feeding_time) {
                errors.push('Укажите дату и время');
                isValid = false;
            }
            if(errors.length > 0) {
                alert('Ошибки:\n' + errors.join('\n'));
            }
            return isValid;
        }
    }
};
const ReminderModal = { 
    template: `
        <div>
            <h3>Новое напоминание</h3>
            <div class="form-group">
                <label>Дата и время:</label>
                <input type="datetime-local" v-model="newData.reminder_date" required>
            </div>
            <div class="form-group">
                <label>Описание:</label>
                <textarea v-model="newData.description" required></textarea>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-secondary">Отмена</button>
                <button @click="handleSave" class="btn btn-primary">Сохранить</button>
            </div>
        </div>
    `,
    data() {
        return { 
            newData: {
                reminder_date: new Date().toISOString().slice(0,16),
                description: ''
            } 
        }
    },
    methods: {
        handleSave() {
            if(this.newData.description.trim()) {
                this.$emit('save', this.newData);
            } else {
                alert('Заполните описание');
            }
        }
    }
};

// Компоненты для просмотра истории
const HealthHistoryModal = {
    template: `
        <div>
            <h3>История здоровья</h3>
            <div class="history-list">
                <div v-for="record in history" :key="record.id" class="history-item">
                    <div class="history-header">
                        <div class="history-content">
                            <div class="history-weight">{{ record.weight }} кг</div>
                            <div class="history-description">{{ record.description }}</div>
                        </div>
                        <div class="history-date">
                            {{ formatDate(record.record_date) }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-primary">Закрыть</button>
            </div>
        </div>
    `,
    props: ['history'],
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString('ru-RU')
        }
    }
};
const VaccinationHistoryModal = {
    template: `
        <div>
            <h3>История прививок</h3>
            <div class="history-list">
                <div v-for="vax in history" :key="vax.id" class="history-item">
                    <div class="history-header">
                        <div class="history-content">
                            <div class="history-name">{{ vax.name }}</div>
                            <div v-if="vax.next_date" class="history-next">
                                Следующая: {{ formatDate(vax.next_date) }}
                            </div>
                        </div>
                        <div class="history-date">
                            {{ formatDate(vax.date_administered) }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-primary">Закрыть</button>
            </div>
        </div>
    `,
    props: ['history'],
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString('ru-RU');
        }
    }
};
const FeedingHistoryModal = {
    template: `
        <div>
            <h3>История кормлений</h3>
            <div class="history-list">
                <div v-for="feeding in history" :key="feeding.id" class="history-item">
                    <div class="history-header">
                        <div class="history-content">
                            <div class="history-food">{{ feeding.food_type }}</div>
                            <div class="history-details">
                                {{ feeding.quantity }}
                                <span v-if="feeding.notes">({{ feeding.notes }})</span>
                            </div>
                        </div>
                        <div class="history-date">
                            {{ formatDateTime(feeding.feeding_time) }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-primary">Закрыть</button>
            </div>
        </div>
    `,
    props: ['history'],
    methods: {
        formatDateTime(datetime) {
            return new Date(datetime).toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }
};
const ReminderHistoryModal = {
    template: `
        <div>
            <h3>История напоминаний</h3>
            <div class="history-list">
                <div v-for="reminder in history" :key="reminder.id" class="history-item">
                    <div class="history-header">
                        <span class="history-status" :class="{completed: reminder.is_completed}">
                            {{ reminder.is_completed ? '✓' : '⌛' }}
                        </span>
                        <span class="history-date">{{ formatDateTime(reminder.reminder_date) }}</span>
                    </div>
                    <div class="history-description">{{ reminder.description }}</div>
                </div>
            </div>
            <div class="actions">
                <button @click="$emit('close')" class="btn btn-primary">Закрыть</button>
            </div>
        </div>
    `,
    props: ['history'],
    methods: {
        formatDateTime(datetime) {
            return new Date(datetime).toLocaleString('ru-RU');
        }
    }
};

createApp({
    components: {
        HealthModal,
        VaccinationModal,
        FeedingModal,
        ReminderModal,
        HealthHistoryModal,
        VaccinationHistoryModal,
        FeedingHistoryModal,
        ReminderHistoryModal
    },
    data() {
        return {
            isEditing: false,
            activeModal: null,
            modalType: null,
            historyModalType: null,
            currentHistory: [],
            editPet: {},
            petId: null,
            pet: {
                name: '',
                type: '',
                breed: '',
                birth_date: '',
                gender: ''
            },
            healthRecords: [],
            vaccinations: [],
            feedingSchedules: [],
            reminders: [],
            loading: true,
            token: localStorage.getItem('access_token')
        }
    },
    computed: {
        lastHealthRecord() {
            return this.healthRecords[this.healthRecords.length - 1] || null;
        },
        lastVaccination() {
            return this.vaccinations.length 
                ? this.vaccinations[this.vaccinations.length - 1] 
                : null;
        },
        lastFeeding() {
            return this.feedingSchedules.length 
                ? this.feedingSchedules[this.feedingSchedules.length - 1] 
                : null;
        },
        lastReminder() {
            return this.reminders[this.reminders.length - 1] || null;
        },
        modalComponent() {
            const components = {
                health: 'HealthModal',
                vaccinations: 'VaccinationModal',
                feeding: 'FeedingModal',
                reminders: 'ReminderModal',
                healthHistory: 'HealthHistoryModal',
                vaccinationsHistory: 'VaccinationHistoryModal',
                feedingHistory: 'FeedingHistoryModal',
                remindersHistory: 'ReminderHistoryModal'
            };
            return components[this.modalType];
        }
    },
    methods: {
        // Загрузка данных
        async loadData() {
            try {
                const headers = { 
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                };
                const requests = [
                    axios.get(`${API_URL}/pets/${this.petId}`, { headers }),
                    axios.get(`${API_URL}/pets/${this.petId}/health-records`, { headers }),
                    axios.get(`${API_URL}/pets/${this.petId}/vaccinations`, { headers }),
                    axios.get(`${API_URL}/pets/${this.petId}/feeding-schedules`, { headers }),
                    axios.get(`${API_URL}/pets/${this.petId}/reminders`, { headers })
                ];
                const [petRes, healthRes, vaxRes, feedingRes, remRes] = await Promise.all(requests);
                this.pet = petRes.data;
                this.healthRecords = healthRes.data;
                this.vaccinations = vaxRes.data;
                this.feedingSchedules = feedingRes.data;
                this.reminders = remRes.data;
                this.loading = false;
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                this.loading = false;
                this.showToast('Ошибка загрузки данных', 'error');
                window.location.href = 'general.html';
            }
        },
        async loadFullHistory(type) {
            try {
                const endpointMap = {
                    health: 'health-records',
                    vaccinations: 'vaccinations',
                    feeding: 'feeding-schedules',
                    reminders: 'reminders'
                };
                const res = await axios.get(
                    `${API_URL}/pets/${this.petId}/${endpointMap[type]}`,
                    { headers: { Authorization: `Bearer ${this.token}` } }
                );
                return res.data;
            } catch (error) {
                this.handleError(error);
                return [];
            }
        },
        async savePet() {
            try {
                const response = await axios.put(
                    `${API_URL}/pets/${this.petId}`,
                    {
                        name: this.editPet.name,
                        type: this.editPet.type,
                        breed: this.editPet.breed,
                        birth_date: new Date(this.editPet.birth_date).toISOString(),
                        gender: this.editPet.gender
                    },
                    { headers: { Authorization: `Bearer ${this.token}` } }
                );
                this.pet = response.data;
                this.isEditing = false;
                this.showToast('Данные сохранены!', 'success');
            } catch (error) {
                this.handleError(error);
            }
        },
        async handleSave(data) {
            try {
                this.loading = true;
                const endpoints = {
                    health: 'health-records',
                    vaccinations: 'vaccinations',
                    feeding: 'feeding-schedules',
                    reminders: 'reminders'
                };
                const endpoint = endpoints[this.modalType];
                if (!endpoint) throw new Error('Неизвестный тип записи');
                const response = await axios.post(
                    `${API_URL}/pets/${this.petId}/${endpoint}`,
                    this.prepareData(data),
                    { headers: { Authorization: `Bearer ${this.token}` } }
                );
                if (response.status !== 201) {
                    throw new Error('Ошибка сервера при сохранении');
                }
                await this.loadData();
                this.showToast('✔️ Запись успешно сохранена', 'success');
            } catch (error) {
                this.handleError(error);
                console.error('Ошибка сохранения:', error);
            } finally {
                this.loading = false;
                this.closeModal();
            }
        },
        prepareData(data) {
            const dateFieldsMap = {
                health: { fields: ['record_date'], isDateTime: false },
                vaccinations: { fields: ['date_administered', 'next_date'], isDateTime: false },
                feeding: { fields: ['feeding_time'], isDateTime: true },
                reminders: { fields: ['reminder_date'], isDateTime: true }
            };
            const processed = { ...data };
            const config = dateFieldsMap[this.modalType];
            if (config) {
                config.fields.forEach(field => {
                    if (processed[field]) {
                        const date = new Date(processed[field]);
                        if (config.isDateTime) {
                            processed[field] = date.toISOString();
                        } else {
                            processed[field] = date.toISOString().split('T')[0];
                        }
                    }
                });
            }
            return processed;
        },
        async showDetails(type) {
            try {
                this.loading = true;
                const history = await this.loadFullHistory(type);
                this.currentHistory = history;
                const typeMapping = {
                    health: 'health',
                    vaccinations: 'vaccinations',
                    feeding: 'feeding',
                    reminders: 'reminders'
                };
                this.modalType = `${typeMapping[type]}History`;
                this.activeModal = true;
            } finally {
                this.loading = false;
            }
        },
        handleError(error) {
            const message = error.response?.data?.detail || error.message;
            this.showToast(`Ошибка: ${message}`, 'error');
        },
        showModal(type) {
            this.modalType = type;
            this.activeModal = true;
        },
        closeModal() {
            this.activeModal = null;
            this.modalType = null;
            this.currentHistory = [];
        },
        goBack() {
            window.history.back();
        },
        formatDate(dateString) {
            return dateString ? new Date(dateString).toLocaleDateString('ru-RU') : '—';
        },
        formatDateTime(datetimeString) {
            return datetimeString ? new Date(datetimeString).toLocaleString('ru-RU') : '—';
        },
        formatTime(datetimeString) {
            return datetimeString ? 
                new Date(datetimeString).toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : '—';
        },
        genderLabel(gender) {
            const labels = {
                'male': 'Мужской',
                'female': 'Женский',
                'other': 'Другой'
            };
            return labels[gender] || '—';
        },
        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    },
    mounted() {
        if (!this.token) {
            window.location.href = 'authorization.html';
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        this.petId = urlParams.get('id');
        if (!this.petId) {
            alert('Питомец не найден');
            window.history.back();
            return;
        }
        this.loadData();
    },
    watch: {
        pet: {
            handler(newVal) {
                this.editPet = { ...newVal };
            },
            immediate: true
        }
    }
}).mount('#app');
