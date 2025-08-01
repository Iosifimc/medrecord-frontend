// iniciar-sesion.js
// Lógica de inicio de sesión modularizada y lista para API
import { apiRequest } from './api.js';
import { showAlert } from './modal-alerts.js';
import { FormValidator } from './validation.js';

// Inicializar validador de formulario
let formValidator;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.querySelector('.login-btn');

  // Inicializar validador de formulario
  formValidator = new FormValidator('form');

  form.addEventListener('submit', handleSubmit);
});

document.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    const form = document.querySelector('form');
    form.dispatchEvent(new Event('submit'));
  }
});

const handleSubmit = async event => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginBtn = document.querySelector('.login-btn');

  // Usar el nuevo sistema de validación
  if (!formValidator || !formValidator.isFormValid()) {
    showAlert('Por favor completa todos los campos correctamente', 'error');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="loading-spinner"></span>Iniciando sesión...';

  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ correo: email, contrasena: password })
    });
    //guardar los datos en el localStorage
    localStorage.setItem('user', JSON.stringify(data));
    showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
    setTimeout(() => {
      window.location.href = 'historial-medico.html';
    }, 1500);
  } catch (error) {
    showAlert('Correo electrónico o contraseña incorrectos', 'error');
    resetForm();
  }
};



const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const resetForm = () => {
  const loginBtn = document.querySelector('.login-btn');
  loginBtn.disabled = false;
  loginBtn.innerHTML = 'Iniciar sesión';
}; 