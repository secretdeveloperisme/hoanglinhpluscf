import { showToast, makeHttpRequest, HttpReponseErr } from './common.js';
import { AUTH_API_URL, scheduleRefreshToken, storeTokenExpiry, getTokenExpiry } from './auth.js';
const signinTitle = document.getElementById('siginTitle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterFormButton = document.getElementById('showRegisterForm');
const showLoginFormButton = document.getElementById('showLoginForm');
const errorMessage = document.getElementById('errorMessage');
const registerErrorMessage = document.getElementById('registerErrorMessage');
let redirectUrl = new URLSearchParams(window.location.search).get('redirect');

showRegisterFormButton.addEventListener('click', () => {
  loginForm.classList.add('fade-out');
  loginForm.addEventListener('animationend', () => {
    loginForm.style.display = 'none';
    loginForm.classList.remove('fade-out');
    registerForm.style.display = 'flex';
    registerForm.classList.add('fade-in');
  }, { once: true });
  signinTitle.textContent = "REGISTER";
  errorMessage.textContent = '';
});

showLoginFormButton.addEventListener('click', () => {
  registerForm.classList.add('fade-out');
  registerForm.addEventListener('animationend', () => {
    registerForm.style.display = 'none';
    registerForm.classList.remove('fade-out');
    loginForm.style.display = 'flex';
    loginForm.classList.add('fade-in');
  }, { once: true });
  signinTitle.textContent = "SIGN IN";
  registerErrorMessage.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  try {
    const response = await makeHttpRequest("POST", AUTH_API_URL, { username, password });
    if (response) {
      showToast('success', 'Login', "Login successful!");
      if(response?.data?.access_token){
        const expiry = getTokenExpiry(response.data.access_token);
        storeTokenExpiry(expiry);
      }
      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/';
        }
      }, 2000);
    }
  }
  catch (error) {
    if (error instanceof HttpReponseErr) {
      if (error.status === 401) {
        errorMessage.textContent = 'Username or password is incorrect';
      }
      return;
    }
    errorMessage.textContent = 'An error occurred. Please try again.';
    console.error('Error:', error);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(registerForm);
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');
  const retypePassword = formData.get('retype_password');

  if (password !== retypePassword) {
    registerErrorMessage.textContent = 'Passwords do not match!';
    return;
  }

  try {
    const response = await makeHttpRequest("POST", "/api/users.php", { username, email, password });

    if (response) {
      showToast('success', 'Register', "Registration successful!");
      setTimeout(() => {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        registerErrorMessage.textContent = '';
      }, 2000);
    } else {
      registerErrorMessage.textContent = result.error || 'Registration failed!';
    }
  } catch (error) {
    registerErrorMessage.textContent = 'An error occurred. Please try again.';
    console.error('Error:', error);
  }
});
