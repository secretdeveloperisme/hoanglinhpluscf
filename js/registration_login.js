import { showToast, makeHttpRequest, HttpReponseErr } from './common.js';
import { AUTH_API_URL, scheduleRefreshToken, storeTokenExpiry, getTokenExpiry, login, saveLoggedInUser } from './auth.js';

import { UPLOAD_FILE_API_URL, callUploadFile } from './common.js';

const signinTitle = document.getElementById('siginTitle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterFormButton = document.getElementById('showRegisterForm');
const showLoginFormButton = document.getElementById('showLoginForm');
const errorMessage = document.getElementById('errorMessage');
const registerErrorMessage = document.getElementById('registerErrorMessage');
const passwordInput = document.getElementById('registerPassword');
const retypePasswordInput = document.getElementById('retypePassword');

let redirectUrl = new URLSearchParams(window.location.search).get('redirect');

const avatarInput = document.getElementById('avatar');
const avatarPathInput = document.getElementById('avatarPath');
const previewAvatarImage = document.getElementById('previewAvatarImage');
const defaultAvatarIcon = '../assets/icons/upload.svg';

if (avatarInput && previewAvatarImage && avatarPathInput) {
  avatarInput.addEventListener('change', function (event) {
    const file = avatarInput.files[0];
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewAvatarImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    // Upload
    callUploadFile(file, 'POST', UPLOAD_FILE_API_URL, false, (res) => {
      if (res && res.data && res.data.filePath) {
        avatarPathInput.value = res.data.filePath;
      } else {
        avatarPathInput.value = '';
        previewAvatarImage.src = defaultAvatarIcon;
        registerErrorMessage.textContent = 'Failed to upload avatar.';
      }
    }, (err) => {
      avatarPathInput.value = '';
      previewAvatarImage.src = defaultAvatarIcon;
      registerErrorMessage.textContent = 'Failed to upload avatar.';
    });
  });
}

if(passwordInput && retypePasswordInput){
  const validatePasswords = () => {
    if (passwordInput.value && retypePasswordInput.value && passwordInput.value !== retypePasswordInput.value) {
      registerErrorMessage.textContent = 'Passwords do not match!';
    } else {
      registerErrorMessage.textContent = '';
    }
  }
  const handlePasswordInput = () => {
    if (retypePasswordInput.value) {
      validatePasswords();
    }
    retypePasswordInput.value = '';
    registerErrorMessage.textContent = '';
  }
  passwordInput.addEventListener('input', handlePasswordInput);
  retypePasswordInput.addEventListener('blur', validatePasswords);
}

showRegisterFormButton.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('fade-out');
  loginForm.addEventListener('animationend', () => {
    loginForm.style.display = 'none';
    loginForm.classList.remove('fade-out');
    registerForm.style.display = 'flex';
    registerForm.classList.add('fade-in');
  }, { once: true });
  signinTitle.textContent = "REGISTER";
  errorMessage.textContent = '';
  document.title = "Register";
});

showLoginFormButton.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.add('fade-out');
  registerForm.addEventListener('animationend', () => {
    registerForm.style.display = 'none';
    registerForm.classList.remove('fade-out');
    loginForm.style.display = 'flex';
    loginForm.classList.add('fade-in');
  }, { once: true });
  signinTitle.textContent = "SIGN IN";
  document.title = "Login";
  registerErrorMessage.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  try {
    const userCredential = await login({ username, password });
    if (userCredential) {
      showToast('success', 'Login', "Login successful!");
      if(userCredential?.accessToken){
        const expiry = getTokenExpiry(userCredential.accessToken);
        storeTokenExpiry(expiry);
      }
      saveLoggedInUser(userCredential.userInfo);
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
  const avatar_path = formData.get('avatar_path') || '';

  if (password !== retypePassword) {
    registerErrorMessage.textContent = 'Passwords do not match!';
    return;
  }

  try {
    const response = await makeHttpRequest("POST", "/api/users.php", { username, email, password, avatar_path });

    if (response) {
      showToast('success', 'Register', "Registration successful!");
      setTimeout(() => {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        registerErrorMessage.textContent = '';
      }, 2000);
    } else {
      registerErrorMessage.textContent = response?.error || 'Registration failed!';
    }
  } catch (error) {
    registerErrorMessage.textContent = 'An error occurred. Please try again.';
    console.error('Error:', error);
  }
});
