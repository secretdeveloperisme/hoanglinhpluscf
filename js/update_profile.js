import { getLoginUser } from "./auth.js";
import { callUploadFile, showToast, UPLOAD_FILE_API_URL } from "./common.js";
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


window.addEventListener('DOMContentLoaded', async () => {
  let currentUser = null;
  try {
    currentUser = await getLoginUser();
    usernameInput.value = currentUser.username;
    emailInput.value = currentUser.email;
    avatarPathInput.value = currentUser.avatar_path || '';
    previewAvatarImage.src = currentUser.avatar_path || '../assets/icons/user.png';
  } catch (err) {
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
        showToast({ type: 'error', message: 'Failed to upload avatar.' });
      }
    }, (err) => {
      avatarPathInput.value = '';
      previewAvatarImage.src = defaultAvatarIcon;
      showToast({ type: 'error', message: 'Failed to upload avatar.' });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    successMessage.textContent = '';
    if (passwordInput.value !== retypePasswordInput.value) {
      errorMessage.textContent = 'Passwords do not match.';
      return;
    }
    const payload = {
      email: emailInput.value,
      avatar_path: avatarPathInput.value
    };
    if (passwordInput.value) payload.password = passwordInput.value;
    try {
      const result = await updateUserProfile(currentUser.id, payload);
      if (result.status === 200) {
        showToast({ type: 'success', message: 'Profile updated successfully!' });
        passwordInput.value = '';
        retypePasswordInput.value = '';
      } else {
        showToast({ type: 'error', message: result.message || 'Failed to update profile.' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  });

});
