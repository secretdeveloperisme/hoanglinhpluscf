
let GALLERY_IMAGES = [
  { "src": "assets/images/gallery/ubuntu.webp", "alt": "Ubuntu", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/AI_DG_contest.webp", "alt": "AI contest certificate", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/embedded_programming.webp", "alt": "Embedded programming", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/inside_computer_case.webp", "alt": "Inside my computer case", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/looking_SG_at_night.webp", "alt": "Sai Gon at night", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/my_computer.webp", "alt": "My computer", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/my_work_office.webp", "alt": "Work office", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/open_laptop.webp", "alt": "Open laptop", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/openwrt.webp", "alt": "Install OpenWRT", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/operating_system.webp", "alt": "Operating System course", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/report_thesis.webp", "alt": "Report Thesis Project", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/graduation.webp", "alt": "Graduation", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/book_and_coffee.webp", "alt": "Book and Coffee", "dataOrientation": "portait" },
  { "src": "assets/images/gallery/linh_soccer.webp", "alt": "Play Soccer", "dataOrientation": "landscape" },
  { "src": "assets/images/gallery/year end party.webp", "alt": "Year End Party", "dataOrientation": "landscape" },
  // { "src": "assets/images/gallery/1.webp", "alt": "beautiful girl 1", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/2.webp", "alt": "beautiful girl 2", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/4.webp", "alt": "beautiful girl 4", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/6.webp", "alt": "beautiful girl 6", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/7.webp", "alt": "beautiful girl 7", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/8.webp", "alt": "beautiful girl 8", "dataOrientation": "portait" },
  // { "src": "assets/images/gallery/9.webp", "alt": "beautiful girl 9", "dataOrientation": "portait" }
];
const CAROUSEL_TIMER = 4000;
let currentIndex = 1;
let carouselItems = [];
let galleryImgs = [];


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

function buildGallleryImages() {
  let galleryImgs = [];
  for (let i = 0; i < GALLERY_IMAGES.length; i++) {
    let imgData = GALLERY_IMAGES[i];
    let imgElem = document.createElement('img');
    imgElem.src = imgData.src;
    imgElem.alt = imgData.alt;
    imgElem.className = 'grid__gallery__img hl-cursor-pointer';
    imgElem.setAttribute('data-orientation', imgData.dataOrientation || 'landscape');
    galleryImgs.push(imgElem);
  }
  return galleryImgs;
}


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

async function initializeGalleryImagesModule() {

  const slideshowContainer = document.querySelector('#slideshowContainer');
  const galleryContainer = document.querySelector('#gallerryContainer');
  const btnNextImg = document.querySelector("#btnNextImg");
  const btnPrevImg = document.querySelector("#btnPrevImg");

  galleryImgs = buildGallleryImages();

  for (let i = 0; i < galleryImgs.length; i++) {
    let img = galleryImgs[i];
    img.setAttribute('data-index', i);
    let orientation = img.getAttribute('data-orientation');
    let carouselItem = createCarouselItem(img.src, img.alt, i, orientation);

    galleryContainer.append(img);
    slideshowContainer.append(carouselItem);
  }

  carouselItems = slideshowContainer.querySelectorAll('.slideshow_container__item');

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
}

export { initializeGalleryImagesModule };
