/**
 * Main JavaScript file for the website
 */

const animationDuration = 500; // Duration for animations in milliseconds

/**
 * Section 1: Navigation bar
 */


let navbar = document.querySelector(".header__nav");
let sticky = navbar.offsetTop;

function registerStickyNavBarEvent() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}

window.onscroll = registerStickyNavBarEvent;

/**
 * Section 2: Quote of the day
 */ 

const QUOTES_API_URL = "api/quotes.php";

let quoteSentenceTag = document.querySelector("#quoteSentence");
let quoteAuthorTag = document.querySelector("#quoteAuthor")

fetch(QUOTES_API_URL)
  .then(response => {
    try {
      let isJsonRes = response.headers.get("Content-Type").includes("application/json");
      if (!isJsonRes)
        throw new Error("Response is not JSON");
      return response.json();
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      throw error;
    }
  })
  .then(quoteObject => {
    quoteSentenceTag.textContent = quoteObject.content;
    quoteAuthorTag.textContent = quoteObject.author;
  })
  .catch(error => console.error('Error fetching quotes: ', error));


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
 * Section 4: Gallery & Carousel
 */ 

const CAROUSEL_TIMER = 4000;
function createCarouselItem(imgSrc, alt, idx, orientation = 'landscape') {
  let item = document.createElement('div');
  item.className = 'slideshow_container__item hl-position-relative';
  item.setAttribute('data-index', idx);
  item.style.display = 'none';
  item.innerHTML = `
      <div class="slideshow-container_image ${orientation}"
        style="background-image: url(${imgSrc})"></div>
      <h2 class="hl-center-bottom hl-title--effect caption-mobile">${alt}</h2>`
  return item;
}

const slideshowContainer = document.querySelector('#slideshowContainer');
const galleryContainer = document.querySelector('#gallerryContainer');
const galleryImgs = galleryContainer.children;
const btnNextImg = document.querySelector("#btnNextImg");
const btnPrevImg = document.querySelector("#btnPrevImg");


for (let i = 0; i < galleryImgs.length; i++) {
  let img = galleryImgs[i];
  img.setAttribute('data-index', i);
  let orientation = img.getAttribute('data-orientation');
  let carouselItem = createCarouselItem(img.src, img.alt, i, orientation);
  slideshowContainer.append(carouselItem);
}

const carouselItems = slideshowContainer.querySelectorAll('.slideshow_container__item');
let currentIndex = 1;

function showCarouselAt(idx) {
  for (let i = 0; i < carouselItems.length; i++) {
    carouselItems[i].style.display = 'none';
  }
  for (let i = 0; i < galleryImgs.length; i++) {
    galleryImgs[i].classList.remove('active-gallery-img');
  }
  if (carouselItems[idx]) carouselItems[idx].style.display = 'block';
  if (galleryImgs[idx]) galleryImgs[idx].classList.add('active-gallery-img');
  currentIndex = idx;
}


function plusDiv(n) {
  let newIndex = currentIndex + n;
  if (newIndex >= carouselItems.length) newIndex = 0;
  if (newIndex < 0) newIndex = carouselItems.length - 1;
  showCarouselAt(newIndex);
}

// Gallery click: jump carousel
for (let i = 0; i < galleryImgs.length; i++) {
  galleryImgs[i].addEventListener('click', function () {
    let index = parseInt(this.getAttribute('data-index'));
    showCarouselAt(index);
  });
}

showCarouselAt(0);

let carouselInterval = setInterval(() => {
  plusDiv(1);
}, CAROUSEL_TIMER);


for (let i = 0; i < carouselItems.length; i++) {
  carouselItems[i].addEventListener('mouseenter', () => clearInterval(carouselInterval));
  carouselItems[i].addEventListener('mouseleave', () => {
    carouselInterval = setInterval(() => plusDiv(1), CAROUSEL_TIMER);
  });
}
btnNextImg.addEventListener("click", () => plusDiv(1));
btnPrevImg.addEventListener("click", () => plusDiv(-1));

/**
 * Section 5:Get Posts
*/ 

import { fetchPostData, createPostElement } from './common_post.js';
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
    let { posts } = await fetchPostData(1, 6);

    renderPosts(posts);

  } catch (e) {
    console.error('Error fetching or rendering posts:', e);
    postsContainer.innerHTML = '<div class="hl-text-center hl-text-danger">Failed to load posts.</div>';
    pagination.innerHTML = '';
  }
}

fetchAndRenderPosts();

