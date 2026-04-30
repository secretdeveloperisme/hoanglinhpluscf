import { getLoginUser, saveLoggedInUser } from "./auth.js";
import { callUploadFile, HttpReponseErr, showToast, UPLOAD_FILE_API_URL } from "./common.js";
import { updateUserProfile } from "./user.js";

// DOM elements
const form = document.getElementById('updateProfileForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const retypePasswordInput = document.getElementById('retype_password');
const avatarInput = document.getElementById('avatar');
const avatarPathInput = document.getElementById('avatarPath');
const previewAvatarImage = document.getElementById('previewAvatarImage');
const errorMessage = document.getElementById('updateErrorMessage');
const successMessage = document.getElementById('updateSuccessMessage');
const backToLoginButton = document.getElementById('backToLoginButton');

window.addEventListener('DOMContentLoaded', async () => {
  try {
    let currentUser = await getLoginUser();
    usernameInput.value = currentUser.username;
    emailInput.value = currentUser.email;
    avatarPathInput.value = currentUser.avatar_path || '';
    previewAvatarImage.src = currentUser.avatar_path || '../assets/icons/user.png';
  } catch (err) {
    if(err instanceof HttpReponseErr){
      if(err.status === 401){
        window.location.href = '/pages/login.html?redirect=/pages/update_profile.html';
        return;
      }
    }
    errorMessage.textContent = err.message;
    form.style.display = 'none';
    return;
  }

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
        showToast("error", "Update Profile", "Failed to upload avatar.");
      }
    }, (err) => {
      avatarPathInput.value = '';
      previewAvatarImage.src = defaultAvatarIcon;
      showToast("error", "Update Profile", "Failed to upload avatar.");
    });
  });

  if(passwordInput && retypePasswordInput){
    const validatePasswords = () => {
    if (passwordInput.value && retypePasswordInput.value && passwordInput.value !== retypePasswordInput.value) {
      errorMessage.textContent = 'Passwords do not match!';
    } else {
      errorMessage.textContent = '';
    }
  }
  const handlePasswordInput = () => {
    if (retypePasswordInput.value) {
      validatePasswords();
    }
    retypePasswordInput.value = '';
    errorMessage.textContent = '';
  }
  passwordInput.addEventListener('input', handlePasswordInput);
  retypePasswordInput.addEventListener('blur', validatePasswords);
  }

  function resetForm() {
    passwordInput.value = '';
    retypePasswordInput.value = '';
    avatarPathInput.value = '';
    avatarInput.value = '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    successMessage.textContent = '';
    if (passwordInput.value !== retypePasswordInput.value) {
      errorMessage.textContent = 'Passwords do not match.';
      return;
    }
    const payload = {};

    if(emailInput.value && emailInput.value !== currentUser.email){
      payload.email = emailInput.value;
    }
    if(avatarPathInput.value && avatarPathInput.value !== currentUser.avatar_path){
      payload.avatar_path = avatarPathInput.value;
    }
    if (passwordInput.value) {
      payload.password = passwordInput.value;
    }
    try {
      const result = await updateUserProfile(currentUser.id, payload);
      if (result.status === 200) {
        showToast("success", "Update Profile", "Profile updated successfully.");
        // Handle post updated
        resetForm();
        currentUser = await getLoginUser();
        saveLoggedInUser(currentUser);
      } else {
        showToast("error", "Update Profile", result.message || 'Failed to update profile.');
      }
    } catch (err) {
      showToast("error", "Update Profile", err.message || 'Failed to update profile.');
    }
  });

  backToLoginButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/pages/login.html';
  });

});
