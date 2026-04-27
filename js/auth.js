import { makeHttpRequest } from "./common.js";

export const AUTH_API_URL = "/api/auth.php";
export const REFRESH_TOKEN_API_URL = "/api/auth.php?action=refresh";
const EXPIREY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms
const EXPIREY_TOKEN_COOKIE_NAME = "access_token_expiry";
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

async function callRefreshAPI() {
  return await makeHttpRequest('POST', REFRESH_TOKEN_API_URL, {});
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
      errorHandler(err);
    }
  }, refreshAt);
}

export { verifyUserAccess, verifyAdminAccess, getTokenExpiry, storeTokenExpiry, getStoredTokenExpiry, scheduleRefreshToken}
