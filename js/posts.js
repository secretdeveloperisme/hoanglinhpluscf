
import { getQueryParams, isEmptyString, makeHttpRequest } from './common.js'
import { createPostElement, fetchPostsData } from './common_post.js';


const postsPerPage = 6;
let currentPage = 1;
let filteredPosts = [];
let totalPages = 1;

let filterCriteria = {
  tag: '',
  search: '',
  sort: 'latest'
};

const postsContainer = document.getElementById('postsContainer');
const noPostsMessage = document.getElementById('noPostsMessage');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');

let allTags = new Set();

function fillDataToFilterElements() {
  if (searchInput) {
    searchInput.value = filterCriteria.search || '';
  }
  if (filterSelect) {
    filterSelect.value = filterCriteria.tag || '';
  }
  if (sortSelect) {
    sortSelect.value = filterCriteria.sort || 'latest';
  }
}

function setFiltersFromUrl() {
  const params = getQueryParams();
  if (!isEmptyString(params.search) && searchInput) filterCriteria.search = params.search;
  if (!isEmptyString(params.tag) && filterSelect) filterCriteria.tag = params.tag;
  if (!isEmptyString(params.sort) && sortSelect) filterCriteria.sort = params.sort;
}

function updateUrlParams() {
  const params = new URLSearchParams(window.location.search);

  if (filterCriteria.search) {
    params.set('search', filterCriteria.search);
  } else {
    params.delete('search');
  }
  if (filterCriteria.tag) {
    params.set('tag', filterCriteria.tag);
  } else {
    params.delete('tag');
  }
  if (filterCriteria.sort) {
    params.set('sort', filterCriteria.sort);
  } else {
    params.delete('sort');
  }

  window.history.replaceState({}, '', `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
}

function renderPosts() {
  postsContainer.innerHTML = '';
  noPostsMessage.style.display = 'none';

  if (filteredPosts.length === 0) {
    noPostsMessage.style.display = 'block';
    return;
  }

  filteredPosts.forEach(post => {
    const postElement = createPostElement(post);
    postsContainer.appendChild(postElement);
  });
}

function renderPagination() {
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage !== i) {
        currentPage = i;
        fetchAndRenderPosts();
      }
      window.scrollTo({top: 0});
    });
    pagination.appendChild(li);
  }
}

function populateCategories(tags) {
  allTags = new Set();
  tags.forEach(tag => allTags.add(tag.name));
  filterSelect.innerHTML = '<option value="">Categories</option>';
  allTags.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterSelect.appendChild(option);
  });
}

function buildApiUrl() {
  const params = [];
  params.push(`page=${currentPage}`);
  params.push(`limit=${postsPerPage}`);

  if (filterCriteria.tag) params.push(`tag=${encodeURIComponent(filterCriteria.tag)}`);
  if (filterCriteria.search) params.push(`search=${encodeURIComponent(filterCriteria.search)}`);
  if (filterCriteria.sort) params.push(`sort=${encodeURIComponent(filterCriteria.sort)}`);
  // Add author_id if needed
  return `/api/posts.php?${params.join('&')}`;
}

async function fetchAndRenderPosts() {
  updateUrlParams();
  const url = buildApiUrl();
  try {
    let response = await makeHttpRequest("GET", url);
    let posts = response?.data?.posts;
    let paging = response?.data?.paging;
    // Sort on client if needed
    const sortValue = sortSelect.value;
    if (sortValue === 'latest') {
      posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      posts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    filteredPosts = posts;
    totalPages = paging ? paging.pages : 1;

    // Collect all tags for filter dropdown
    let tagsSet = new Set();
    posts.forEach(post => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagsSet.add(tag.name));
      }
    });
    populateCategories(Array.from(tagsSet).map(name => ({ name })));

    renderPosts();
    renderPagination();
    fillDataToFilterElements();
  } catch (e) {
    console.error("Failed to get posts: ", e);
    postsContainer.innerHTML = '<div class="hl-text-center hl-text-danger">Failed to load posts.</div>';
    pagination.innerHTML = '';
  }
}

function setPageAndFetch(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  fetchAndRenderPosts();
}
function init() {
  setFiltersFromUrl();
  setPageAndFetch(1);
}


if (filterSelect) {
  filterSelect.addEventListener('change', () => {
    filterCriteria.tag = filterSelect.value;
    setPageAndFetch(1);
  });
}
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    filterCriteria.sort = sortSelect.value;
    setPageAndFetch(1);
  });
}

init();
