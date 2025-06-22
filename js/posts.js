
import {createPostElement, fetchPostData} from './common_post.js';

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

function renderPosts() {
    postsContainer.innerHTML = '';
    noPostsMessage.style.display = 'none';

    if (filteredPosts.length === 0) {
        noPostsMessage.style.display = 'block';
        return;
    }

    filteredPosts.forEach(post =>{
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

async function fetchAndRenderPosts() {
    try {
        let {posts, paging} = await fetchPostData(currentPage, postsPerPage, false);
        const sortValue = sortSelect.value;
        if (sortValue === 'latest') {
            posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            posts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        filteredPosts = posts;
        totalPages = paging ? paging.pages : 1;

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
        console.error('Error fetching or rendering posts:', e);
        postsContainer.innerHTML = '<div class="hl-text-center hl-text-danger">Failed to load posts.</div>';
        pagination.innerHTML = '';
    }
} 

function init(){
    currentPage = 1;
    fetchAndRenderPosts();
}

// Event listeners
if (searchInput) {
    searchInput.addEventListener('input', init);
}
if (filterSelect) {
    filterSelect.addEventListener('change', init);
}
if (sortSelect) {
    sortSelect.addEventListener('change', init);
}

init();