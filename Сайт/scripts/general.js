// Base API URL and global variables
const API_URL = 'http://localhost:8000';
let calendar = null;
let previousSection = 'pets';
let currentPetIdToDelete = null;
let deleteResolver = null;

// Calendar initialization
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    FullCalendar.registerPlugins([
        FullCalendarDayGridPlugin,
        FullCalendarInteractionPlugin
    ]);

    calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: [FullCalendarDayGridPlugin, FullCalendarInteractionPlugin],
        initialView: 'dayGridMonth',
        locale: 'ru',
        selectable: true,
        select: async (info) => {
            openCalendarModal(info.startStr);
        },
        events: async (info, success) => {
            try {
                const [remindersRes, vaccinationsRes] = await Promise.all([
                    fetch(`${API_URL}/reminders?start=${info.startStr}&end=${info.endStr}`, {
                        headers: { 
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`${API_URL}/vaccinations?start=${info.startStr}&end=${info.endStr}`, {
                        headers: { 
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);

                const reminders = await remindersRes.json();
                const vaccinations = await vaccinationsRes.json();

                const events = [
                    ...reminders.map(r => ({
                        title: `⏰ ${r.description} (${r.pet.name})`,
                        start: r.reminder_date,
                        allDay: false,
                        color: '#D2C639'
                    })),
                    ...vaccinations.map(v => ({
                        title: `💉 ${v.name} (${v.pet.name})`,
                        start: v.date_administered,
                        allDay: true,
                        color: '#4CAF50'
                    }))
                ];

                success(events);
            } catch (error) {
                console.error('Ошибка загрузки событий:', error);
                success([]);
            }
        }
    });
    
    calendar.render();
}

// Auth check
async function checkAuth() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        redirectToLogin();
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/check-token`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            redirectToLogin();
            return false;
        }
        return true;
    } catch (error) {
        redirectToLogin();
        return false;
    }
}

// Modal windows
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Delete confirmation
function showDeleteConfirmation(petId) {
    return new Promise((resolve) => {
        currentPetIdToDelete = petId;
        deleteResolver = resolve;
        document.getElementById('delete-confirm-modal').style.display = 'flex';
    });
}

// Pet deletion
async function deletePet(event, petId) {
    event.stopPropagation();
    
    try {
        const result = await showDeleteConfirmation(petId);
        if (!result) return;

        const response = await fetch(`${API_URL}/pets/${petId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка удаления питомца');
        }

        showToast('Питомец удален', 'success');
        await loadPets();
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showToast(error.message, 'error');
    }
}

// Profile functions
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки профиля');

        const profile = await response.json();
        document.getElementById('profile-name').value = profile.name;
        document.getElementById('profile-email').value = profile.email;
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showToast(error.message, 'error');
    }
}

async function saveProfile(event) {
    event.preventDefault();
    const formData = {
        name: event.target.name.value,
        email: event.target.email.value,
        password: event.target.password.value
    };

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка обновления профиля');
        }
        
        showToast('Профиль успешно обновлен', 'success');
        document.getElementById('profile-password').value = '';
        await loadProfile();
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showToast(error.message, 'error');
    }
}

// Password change
async function changePassword(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const passwords = {
        old_password: formData.get('old_password'),
        new_password: formData.get('new_password'),
        confirm_password: formData.get('confirm_password')
    };

    if (passwords.new_password !== passwords.confirm_password) {
        showToast('Новые пароли не совпадают', 'error');
        return;
    }
    
    if (passwords.new_password.length < 6) {
        showToast('Пароль должен быть не менее 6 символов', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                old_password: passwords.old_password,
                new_password: passwords.new_password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка смены пароля');
        }

        showToast('Пароль успешно изменен', 'success');
        closeModal('password-modal');
        event.target.reset();
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showToast(error.message, 'error');
    }
}

// Calendar events
async function openCalendarModal(date = null) {
    const petSelect = document.getElementById('event-pet');
    
    try {
        const petsRes = await fetch(`${API_URL}/pets`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        });
        const pets = await petsRes.json();
        
        petSelect.innerHTML = pets.map(pet => 
            `<option value="${pet.id}">${pet.name}</option>`
        ).join('');
        
        if(date) {
            const dateInput = document.getElementById('event-date');
            const localDate = new Date(date);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
            dateInput.value = localDate.toISOString().slice(0, 16);
        }
        
        openModal('calendar-event-modal');
    } catch (error) {
        showToast('Ошибка загрузки питомцев', 'error');
    }
}

async function handleEventSubmit(event) {
    event.preventDefault();
    
    const formData = {
        type: document.getElementById('event-type').value,
        pet_id: document.getElementById('event-pet').value,
        description: document.getElementById('event-description').value,
        date: document.getElementById('event-date').value,
        next_date: document.getElementById('next-vaccination-date').value
    };

    try {
        const endpoint = formData.type === 'vaccination' 
            ? `${API_URL}/vaccinations` 
            : `${API_URL}/reminders`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pet_id: formData.pet_id,
                ...(formData.type === 'vaccination' ? {
                    name: formData.description,
                    date_administered: formData.date,
                    next_date: formData.next_date
                } : {
                    description: formData.description,
                    reminder_date: formData.date
                })
            })
        });

        if (!response.ok) throw new Error('Ошибка сохранения');

        calendar.refetchEvents();
        closeModal('calendar-event-modal');
        showToast('Событие сохранено!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Utility functions
function calculateAge(birthDate) {
    if (!birthDate) return 'Дата рождения не указана';
    const birth = new Date(birthDate);
    const today = new Date();
    
    const months = (today.getFullYear() - birth.getFullYear()) * 12 
        + (today.getMonth() - birth.getMonth());
        
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${months} мес`;
    if (remainingMonths === 0) return `${years} лет`;
    return `${years} лет ${remainingMonths} мес`;
}

function navigateToPet(petId, isEdit = false) {
    window.location.href = `pet.html?id=${petId}${isEdit ? '&edit=true' : ''}`;
}

function getPetTypeClass(petType) {
    const types = {
        'Кошка': 'cat',
        'Собака': 'dog',
        'Птица': 'bird',
        'Грызун': 'rodent'
    };
    return types[petType] || 'other';
}

function getPetIcon(petType) {
    const icons = {
        'Кошка': '🐱',
        'Собака': '🐶',
        'Птица': '🦜',
        'Грызун': '🐹'
    };
    return icons[petType] || '🐾';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function redirectToLogin() {
    window.location.href = 'authorization.html';
}

function performLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'authorization.html';
}

function confirmLogout() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Подтверждение выхода</h3>
            <p>Вы уверены, что хотите выйти из аккаунта?</p>
            <div class="modal-actions">
                <button class="confirm-btn" onclick="performLogout()">Да, выйти</button>
                <button class="cancel-btn" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// Event handlers
document.getElementById('event-type').addEventListener('change', function() {
    document.getElementById('vaccination-fields').style.display = 
        this.value === 'vaccination' ? 'block' : 'none';
});

document.getElementById('delete-confirm-yes').addEventListener('click', async () => {
    if (deleteResolver) deleteResolver(true);
    document.getElementById('delete-confirm-modal').style.display = 'none';
});

document.getElementById('delete-confirm-no').addEventListener('click', () => {
    if (deleteResolver) deleteResolver(false);
    document.getElementById('delete-confirm-modal').style.display = 'none';
});

document.querySelector('.back-button').addEventListener('click', () => {
    showSection(previousSection);
});

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    
    try {
        await Promise.all([loadPets(), loadProfile()]);
        if (document.getElementById('calendar-section').classList.contains('active-section')) {
            initCalendar();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Ошибка инициализации приложения', 'error');
    }
});

window.addEventListener('focus', async () => {
    await loadPets();
});
