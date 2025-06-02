// Base API URL
const API_URL = 'http://127.0.0.1:8000';

// Function to handle server response
async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка сервера');
    }
    return response.json();
}

// Login function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });
        
        const data = await handleResponse(response);
        localStorage.setItem('access_token', data.access_token);
        window.location.href = '/Сайт/pages/general.html';
    } catch (error) {
        alert(error.message);
    }
}

// Register function
async function register() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        alert('Все поля обязательны для заполнения!');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Пожалуйста, введите корректный email адрес');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name: name,
                email: email,
                password: password 
            })
        });
        
        await handleResponse(response);
        alert('Регистрация успешна!');
        window.location.href = '/Сайт/pages/authorization.html';
    } catch (error) {
        alert(error.message);
    }
}

// Show registration form
function showRegistration() {
    document.getElementById('formTitle').textContent = 'Регистрация';
    
    const nameInput = document.createElement('div');
    nameInput.className = 'input-group';
    nameInput.innerHTML = `<input type="text" class="input-field" placeholder="Имя" id="name">`;
    document.querySelector('.container').insertBefore(nameInput, document.getElementById('buttonsContainer'));
    
    setTimeout(() => {
        nameInput.classList.add('visible');
        document.getElementById('buttonsContainer').innerHTML = `
            <button class="btn primary-btn" onclick="register()">Зарегистрироваться</button>
            <button class="btn secondary-btn" onclick="window.location.reload()">Назад</button>
        `;
    }, 10);
}
