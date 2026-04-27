import { makeHttpRequest } from "./common.js";

export const AUTH_API_URL = "/api/auth.php";
export const REFRESH_TOKEN_API_URL = "/api/auth.php?action=refresh";
const EXPIREY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms
const EXPIREY_TOKEN_COOKIE_NAME = "access_token_expiry";
const LOGGED_IN_USER_KEY = btoa('logged_in_user');


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

class User{
  constructor({id, username, email, role, avatar_path}){
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
    this.avatar_path = avatar_path;
  }
}


class UserCredential{
  constructor({accessToken, refreshToken, userInfo}){
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userInfo = userInfo;
  }
}

export async function getLoginUser() {
  try{
    let verifyResp = await makeHttpRequest('GET', AUTH_API_URL, {});
    if(verifyResp?.data){
      return new User({
        id: verifyResp.data.user_id,
        role: verifyResp.data.role,
        username: verifyResp.data.user_info.username,
        email: verifyResp.data.user_info.email,
        avatar_path: verifyResp.data.avatar_path
      })
    }
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

async function login({username, password}) {
  let loginRes =  await makeHttpRequest('POST', AUTH_API_URL, { username, password });
  return new UserCredential({
    accessToken: loginRes.data.access_token,
    refreshToken: loginRes.data.refresh_token,
    userInfo: new User({
      id: loginRes.data.user_id,
      username: loginRes.data.user_info.username,
      email: loginRes.data.user_info.email,
      role: loginRes.data.role,
      avatar_path: loginRes.data.user_info.avatar_path
    })
  });
}

async function callRefreshAPI() {
  return await makeHttpRequest('POST', REFRESH_TOKEN_API_URL, {});
}

function saveLoggedInUser(user) {
  if (user) {
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  }
}

function getTokenExpiry(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000; // convert to ms
}
function storeTokenExpiry(expiry) {
  const expiryDate = new Date(expiry);
  document.cookie = `${EXPIREY_TOKEN_COOKIE_NAME}=${expiryDate.toISOString()}; path=/;`;
}

function clearTokenExpiry() {
  document.cookie = `${EXPIREY_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function getStoredTokenExpiry() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === EXPIREY_TOKEN_COOKIE_NAME) {
      return new Date(value).getTime();
    }
  }
  return null;
}

function scheduleRefreshToken(errorHandler = (err) => {}) {
  const expiry = getStoredTokenExpiry();
  if(expiry === null){
    return;
  }
  const refreshAt = expiry - Date.now() - EXPIREY_THRESHOLD;

  setTimeout(async () => {
    try{
      const newToken = await callRefreshAPI();
      storeTokenExpiry(getTokenExpiry(newToken?.data?.access_token));
      scheduleRefreshToken();
    }catch(err){
      console.error("Error refreshing token:", err);
      clearTokenExpiry();
      saveLoggedInUser(null);
      errorHandler(err);
    }
  }, refreshAt);
}

async function getLoggedInUserFromStorage(){
  const userStr = localStorage.getItem(LOGGED_IN_USER_KEY);
  if(userStr){
    try{
      const userObj = JSON.parse(userStr);
      return new User(userObj);
    }catch(err){
      console.error("Error parsing logged in user from localStorage:", err);
      return null;
    }
  }
  return null;
}

export { verifyUserAccess, verifyAdminAccess, login, getTokenExpiry, storeTokenExpiry, getStoredTokenExpiry, scheduleRefreshToken, saveLoggedInUser, getLoggedInUserFromStorage };
