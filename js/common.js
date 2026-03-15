const UPLOAD_FILE_API_URL = "/api/files.php";
const AUTH_API_URL = "/api/auth.php";

class USER_ROLE {
  static ADMIN = "admin";
  static USER = "user";
  static GUEST = "guest";
  static isAdmin(role){
    if (role === null || role === undefined) {
      return false;
    }
    if (typeof role !== "string") {
      return false;
    }
    return role.toLowerCase() === USER_ROLE.ADMIN;
  }
  static isUser(role){
    if (role === null || role === undefined) {
      return false;
    }
    if (typeof role !== "string") {
      return false;
    }
    return role.toLowerCase() === USER_ROLE.USER;
  }
}


function removeAd(){
    let hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1")
        return;
    let childOfBody = document.body.children;
    let divsOfBody = childOfBody[childOfBody.length-1]
    console.log("Removed ads: " + document.getElementsByTagName("body")[0].removeChild(divsOfBody));
}

function renderLoader() {
  let loaderContainer = document.createElement("div");
  loaderContainer.classList.add("loader");
  loaderContainer.innerHTML = `
    <div class="loader-content">
      <div class="loader-icon-container">
          <span class="loader-icon"></span>
      </div>
      <span class="loader-text">HoangLinhPlus</span>
    </div>
    <div class="loader-door">
      <div class="loader-left-door"></div>
      <div class="loader-right-door"></div>
    </div>
  `;

  document.body.prepend(loaderContainer)
}


function isNotNullAndUndefined(obj){
  return obj != undefined && obj != null;
}

function objectifyForm(formArray) {
  let duplicateArray = countDuplicateArray(formArray);
  let returnArray = {};
  for (let i = 0; i < formArray.length; i++){
    if(duplicateArray[formArray[i]['name']] > 1){
      if(formArray[i]['name'].includes(".")){
        let attributes = formArray[i]['name'].split(".");
        let arr = []
        let object = {}
        object[attributes[1]] = formArray[i]['value']
        if(returnArray[attributes[0]] === undefined)
          returnArray[attributes[0]]=[]
        arr = [...returnArray[attributes[0]]];
        arr.push(object)
        returnArray[attributes[0]] = arr;
      }
      else {
        let attributeName = formArray[i]['name'];
        let arr = []
        if(returnArray[attributeName] === undefined)
          returnArray[attributeName]=[]
        arr = [...returnArray[attributeName]];
        arr.push(formArray[i]['value'])
        returnArray[attributeName] = arr;
      }
      continue;
    }
    if(formArray[i]['name'].includes(".")){
      let attributes = formArray[i]['name'].split(".");
      let object = {}
      if(returnArray[attributes[0]] !== undefined)
        object = returnArray[attributes[0]];
      object[attributes[1]] = formArray[i]['value'];
      returnArray[attributes[0]] = object;
      continue;
    }
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}

export function parseJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Invalid JSON string:", rawText, error);
    return null;
  }
}

function countDuplicateArray(arr){
  const counts = {};
  arr.forEach(function (x) { counts[x.name] = (counts[x.name] || 0) + 1; });
  return counts
}


export function makeElementSticky(elementId) {
  const stickyElement = document.getElementById(elementId);

  if (!stickyElement) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }
  const stickyPosition = stickyElement.offsetTop;

  window.onscroll = function () {
    if (window.pageYOffset > stickyPosition) {
      stickyElement.classList.add("sticky");
    } else {
      stickyElement.classList.remove("sticky");
    }
  };
}

export function getQueryParams() {
  const params = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    params[key] = decodeURIComponent(value);
  });
  return params;
}

export function isEmptyString(str){
  return str === null || str === undefined || str.trim() === '';
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  }

  const clone = {};
  for (let key in obj) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

export function isObject(target){
  return target != null && (typeof target) === "object";
}

export class HttpReponseErr {
  status;
  body;
  constructor(status, body) {
    this.status = status
    this.body = body
  }
}

async function makeHttpRequest(method = 'GET', url, data = null, headers = {}) {
  if (url === null || url === "") {
    throw new ("the URL is required");
  }
  let requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
  };
  if (isNotNullAndUndefined(data)) {
    if (method === 'GET' || method === 'HEAD') {
      let queryString = new URLSearchParams(data).toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    } else {
      requestOptions.body = JSON.stringify(data);
    }
  }
  let response = await fetch(url, requestOptions);
  if (!response.ok) {
    throw new HttpReponseErr(response.status, await response.text());
  }
  return await response.json();
}

function callUploadFile(file, method = 'POST', url = UPLOAD_FILE_API_URL, async = true, onSuccess = () => {}, onError = () => {}) {
  if (!file) return;

  let form = new FormData();
  form.append('file', file);
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, async);
  xhr.onload = function () {
    try {
      let res = JSON.parse(this.responseText);
      if (xhr.status === 200) {
        onSuccess(res);
      } else {
        onError(res);
      }
    } catch (err) {
      onError(err);
    }
  };
  xhr.onerror = function () {
    onError(new Error('Network error'));
  };
  xhr.send(form);
}


export async function getLoginUser() {
  try{
    let verifyResp = await makeHttpRequest('GET', AUTH_API_URL, {});
    return verifyResp.data;
  }catch(err){
    console.error("Error verifying user:", err);
    return null;
  }
}

async function verifyUserAccess(){
  let user = await getLoginUser();
  if (user === null || user === undefined) {
    return false;
  }
  return true;
}

async function verifyAdminAccess(){
  let user = await getLoginUser();
  if (user === null || user === undefined) {
    return false;
  }

  if(USER_ROLE.isAdmin(user.role)){
    return true;
  }
  return false;
}


// Calculate reading time in seconds unit for a given text
export function calculateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  const seconds = Math.ceil((words / wordsPerMinute) * 60);
  return seconds;
}


export function timeFromNow(date) {
  let seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

function initToast(){
  let toastContainer = document.createElement('div');
  toastContainer.id = 'toastContainer';
  document.body.prepend(toastContainer);
  window.closeToast = closeToast;
}

function showToast(type, title, message, duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconSrc = type === 'success' ? 'circle-check.svg' :
                  type === 'error' ? 'circle-exclamation.svg' :
                  'triangle-exclamation.svg';

  toast.innerHTML = `
      <div class="toast-content">
          <img src="/assets/icons/${iconSrc}" class="toast-icon">
          <div class="text-content">
              <h3>${title}</h3>
              <p>${message}</p>
          </div>
          <button onclick="closeToast(this.parentElement.parentElement)">✕</button>
      </div>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
      toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    closeToast(toast);
  }, duration);
}

function closeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

function removeLoader() {
  let leftDoorLoaderElement = document.querySelector(".loader-left-door");
  let rightDoorLoaderElement = document.querySelector(".loader-right-door");
  let loaderContent = document.querySelector(".loader-content");
  let loaderContentContainer = document.querySelector(".loader-content");
  if (loaderContent) {
    loaderContent.classList.add("animate-zoom-out");
  }

  if (leftDoorLoaderElement && rightDoorLoaderElement) {
    leftDoorLoaderElement.classList.add("translateLeftOut");
    rightDoorLoaderElement.classList.add("translateRightOut");
    setTimeout(() => {
      leftDoorLoaderElement.remove();
      rightDoorLoaderElement.remove();
      if (loaderContentContainer) {
        loaderContentContainer.remove();
      }
      let loaderContainer = document.querySelector(".loader");
      loaderContainer.remove();;
    }, 2000);
  }
}
window.removeLoader = removeLoader;

// Initialize loader
renderLoader();


document.addEventListener("DOMContentLoaded", ()=>{
  removeAd();
  initToast();
  removeLoader();
});

export {UPLOAD_FILE_API_URL, objectifyForm, callUploadFile, makeHttpRequest, showToast, verifyAdminAccess, verifyUserAccess };
