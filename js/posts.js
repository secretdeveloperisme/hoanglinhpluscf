import { calculateReadingTime, timeFromNow } from '../js/common.js';
const POST_DETAIL_URL = '/pages/post_detail.html';
const FALLBACK_IMAGE = 'https://dummyimage.com/600x400/10b981/fff&text=No+Image';
const POSTS_API_URL = '/api/posts.php';

const postsPerPage = 6;
let currentPage = 1;
let filteredPosts = [];
let totalPages = 1;

const postsContainer = document.getElementById('postsContainer');
const noPostsMessage = document.getElementById('noPostsMessage');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');


let allTags = new Set();
function createPostElement(post) {
    const cardWrapper = document.createElement('div');
    const coverImage = post.cover_image && post.cover_image.trim() ? post.cover_image : FALLBACK_IMAGE;
    const post_detail_url = `${POST_DETAIL_URL}?id=${post.post_id}`;
    const readingTime = post.reading_time || '0 min';
    const fallbackImage = FALLBACK_IMAGE;
    cardWrapper.className = 'col c-12 m-6 l-4';
    cardWrapper.innerHTML = `
        <div class="card">
            <img src="${coverImage}" class="card-img" alt="${post.title}" onerror="this.onerror=null; this.src='${fallbackImage}';">
            <div class="card-body">
                <h5 class="card-title"><a target="_blank" href='${post_detail_url}'>${post.title}</a></h5>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="badge">#${tag.name}</span>`).join('')}
                </div>
                <p class="card-text">${post.description}</p>
                <div class="post-meta">
                    <span>${timeFromNow(post.created_at)} | ${readingTime}</span>
                </div>
            </div>
            <div class="card-footer">
                <a target="_blank" href='${post_detail_url}' class="btn-read-more">Read More</a>
            </div>
        </div>
    `;
    postsContainer.appendChild(cardWrapper);
}

function renderPosts() {
    postsContainer.innerHTML = '';
    noPostsMessage.style.display = 'none';

    if (filteredPosts.length === 0) {
        noPostsMessage.style.display = 'block';
        return;
    }

    filteredPosts.forEach(createPostElement);
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
        });
        pagination.appendChild(li);
    }
}

function populateCategories(tags) {
    allTags = new Set();
    tags.forEach(tag => allTags.add(tag.name));
    filterSelect.innerHTML = '<option value="">All Categories</option>';
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

    const tag = filterSelect.value;
    if (tag) params.push(`tag=${encodeURIComponent(tag)}`);

    const search = searchInput.value.trim();
    if (search) params.push(`search=${encodeURIComponent(search)}`);

    return `${POSTS_API_URL}?${params.join('&')}`;
}

async function fetchAndRenderPosts() {
    const url = buildApiUrl();
    try {
        const res = await fetch(url);
        const json = await res.json();

        const sortValue = sortSelect.value;
        let posts = json.data || [];
        if (sortValue === 'latest') {
            posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            posts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        filteredPosts = posts;
        totalPages = json.paging ? json.paging.pages : 1;

        let tagsSet = new Set();
        posts.forEach(post => {
            if (Array.isArray(post.tags)) {
                post.tags.forEach(tag => tagsSet.add(tag.name));
            }
        });
        populateCategories(Array.from(tagsSet).map(name => ({ name })));

        renderPosts();
        renderPagination();
    } catch (e) {
        postsContainer.innerHTML = '<div class="hl-text-center hl-text-danger">Failed to load posts.</div>';
        pagination.innerHTML = '';
    }
}

function init(){
    currentPage = 1;
    fetchAndRenderPosts();
}

// Event listeners
searchInput.addEventListener('input', init);
filterSelect.addEventListener('change', init);
sortSelect.addEventListener('change', init);

init();