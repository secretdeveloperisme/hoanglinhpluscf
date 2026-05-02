/**
 * Main JavaScript file for the website
 */

const animationDuration = 500; // Duration for animations in milliseconds

/**
 * Section 1: Navigation bar
 */

let header = document.querySelector(".header");
let navbar = document.querySelector(".header__nav");
let navBarCheckbox = document.querySelector("#cbx-nav-bar");
let sticky = navbar.offsetTop;

function registerStickyNavBarEvent() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
    header.style.paddingBottom = "0px";
  }
}

navBarCheckbox.addEventListener('change', function () {
  if (!this.checked) {
    enableScroll();
    header.style.display = "block";
  } else {
    disableScroll();
    header.style.display = "none";
  }
});

window.onscroll = registerStickyNavBarEvent;

/**
 * Disable/Enable scroll functions
 */
// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
const keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}
// modern Chrome requires { passive: false } when adding event
let supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; }
  }));
} catch(e) {}

let wheelOpt = supportsPassive ? { passive: false } : false;
let wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

function disableScroll() {
  window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

function enableScroll() {
  window.removeEventListener('DOMMouseScroll', preventDefault, false);
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  window.removeEventListener('touchmove', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}

/**
 * Section 2: Quote of the day
 */

const QUOTES_API_URL = "api/quotes.php";

async function renderRandomQuote() {
  let quoteSentenceTag = document.querySelector("#quoteSentence");
  let quoteAuthorTag = document.querySelector("#quoteAuthor")

  try {
    let {data: quote} = await makeHttpRequest("GET", `${QUOTES_API_URL}/?type=random`);
    quoteSentenceTag.textContent = quote.content;
    quoteAuthorTag.textContent = quote.author;
  } catch (error) {
    console.error('Error fetching quotes: ', error)
  }
}
renderRandomQuote();

/**
 * Section 3: Preview picture modal
 */

//display preview picture
let modal = document.getElementById("modal");
let imgModal = document.getElementById("imageShow");
let modalContent = document.getElementById("modalContent");
let btnCloseModal = document.getElementById("modal__close");
let caption = document.getElementById("modal__caption");
let imgs = document.getElementsByClassName("grid__gallery__img");



function showImgModel(imgSrc, alt) {
  imgModal.src = imgSrc;
  caption.innerHTML = alt;
  modalContent.classList.add("animate-zoom-in");
  setTimeout(() => {
    modalContent.classList.remove("animate-zoom-in");
  }, animationDuration);
  modal.style.display = "block"
}

const longPressThreshold = 600; // Threshold for long press in milliseconds

for (let i = 0; i < imgs.length; i++) {
  imgs[i].addEventListener("dblclick", function () {
    showImgModel(this.src, this.alt);
  })

  let longPressTimer = null;
  imgs[i].addEventListener('touchstart', (e) => {
    longPressTimer = setTimeout(() => {
      showImgModel(e.target.src, e.target.alt);
    }, longPressThreshold);
  }, { passive: true });

  imgs[i].addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });

  imgs[i].addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
  });

}

btnCloseModal.onclick = function () {
  modalContent.classList.add("animate-zoom-out");
  setTimeout(() => {
    modalContent.classList.remove("animate-zoom-out");
    modal.style.display = "none";
  }, animationDuration);
}

/**
 * Section 4: Gallery Images Module
 */

import { initializeGalleryImagesModule } from './gallery_images.js';

initializeGalleryImagesModule();

/**
 * Section 5:Get Posts
*/

import { fetchPostsData, createPostElement } from './common_post.js';
import { makeHttpRequest } from './common.js';
import { getLoggedInUserFromStorage } from './auth.js';
const postsContainer = document.getElementById('postsContainer');
const noPostsMessage = document.getElementById('noPostsMessage');

function renderPosts(posts) {
  postsContainer.innerHTML = '';
  noPostsMessage.style.display = 'none';

  if (posts.length === 0) {
    noPostsMessage.style.display = 'block';
    return;
  }

  posts.forEach(post => {
    const postElement = createPostElement(post);
    postsContainer.appendChild(postElement);
  });
}

async function fetchAndRenderPosts() {
  try {
    let { posts } = await fetchPostsData(1, 6);

    renderPosts(posts);

  } catch (e) {
    console.error('Error fetching or rendering posts:', e);
    postsContainer.innerHTML = '<div class="hl-text-center hl-text-danger">Failed to load posts.</div>';
    pagination.innerHTML = '';
  }
}

fetchAndRenderPosts();

/* Get current loggedin user to display on navigation bar */

async function showCurrentUserOnNavBar() {
  const headerNavDesktopWrapper = document.getElementById("userActionsDesktopWrapper");
  const headerNavMobileWrapper = document.getElementById("userActionsMobileWrapper");
  const userAvatarImgs = document.querySelectorAll(".user-avatar-img");
  const userInfoWrappers = document.querySelectorAll(".user-info-wrapper");
  const userUsernames = document.querySelectorAll(".user-username");

  if(!headerNavDesktopWrapper || !headerNavMobileWrapper || userAvatarImgs.length === 0 || userInfoWrappers.length === 0 || userUsernames.length === 0){
    console.warn("Some user info elements are missing in the DOM. Skipping user info display on nav bar.");
    return;
  }

  const currentUser = await getLoggedInUserFromStorage();
  if(currentUser == null){
    return;
  }

  headerNavDesktopWrapper.classList.remove("hl-display-none");
  headerNavMobileWrapper.classList.remove("hl-display-none");

  headerNavDesktopWrapper.title = currentUser.username || "User";
  headerNavMobileWrapper.title = currentUser.username || "User";

  userAvatarImgs.forEach(img => {
    img.src = currentUser.avatar_path || "/assets/icons/user.png";
  });

  userInfoWrappers.forEach(wrapper => {
    wrapper.style.display = "flex";
  });

  userUsernames.forEach(usernameTag => {
    usernameTag.textContent = currentUser.username || "User";
  });
}

showCurrentUserOnNavBar();
