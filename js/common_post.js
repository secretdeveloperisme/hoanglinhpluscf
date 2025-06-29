import {timeFromNow } from '../js/common.js';

const POST_DETAIL_URL = '/pages/post_detail.html';
const POSTS_API_URL = '/api/posts.php';
const POSTS_PAGES = "/pages/posts.html";
const FALLBACK_IMAGE = 'https://dummyimage.com/600x400/10b981/fff&text=HLP';
const DEBOUNCE_TIMEOUT = 300;

export function formatReadingTime(seconds) {
  if (seconds < 60) {
    const s = Math.ceil(seconds);
    return `${s} second${s === 1 ? '' : 's'}`;
  } else if (seconds < 3600) {
    const m = Math.ceil(seconds / 60);
    return `${m} minute${m === 1 ? '' : 's'}`;
  } else {
    const h = Math.ceil(seconds / 3600);
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
}

export function buildDefaultApiUrl(page = 1, itemsPerPage = 6) {
  const params = [];
  params.push(`page=${page}`);
  params.push(`limit=${itemsPerPage}`);
  return `${POSTS_API_URL}?${params.join('&')}`;
}

export function buildApiUrl(page = 1, itemsPerPage = 6) {
  const params = [];
  params.push(`page=${page}`);
  params.push(`limit=${itemsPerPage}`);

  const tag = filterSelect ? filterSelect.value : '';
  if (tag) params.push(`tag=${encodeURIComponent(tag)}`);

  const search = searchInput ? searchInput.value.trim() : '';
  if (search) params.push(`search=${encodeURIComponent(search)}`);

  return `${POSTS_API_URL}?${params.join('&')}`;
}

export async function fetchPostData(page = 1, itemsPerPage = 6, fetchDefault = true) {
  const url = fetchDefault ? buildDefaultApiUrl() : buildApiUrl(page, itemsPerPage);
  try {
    const res = await fetch(url);
    const json = await res.json();
    return { posts: json.data, paging: json.paging } || {};
  } catch (e) {
    console.error('Failed to fetch posts:', e);
    throw new Error('Failed to load posts');
  }
}

export function createPostElement(post) {
  const cardWrapper = document.createElement('div');
  const coverImage = post.cover_image && post.cover_image.trim() ? post.cover_image : FALLBACK_IMAGE;
  const post_detail_url = `${POST_DETAIL_URL}?id=${post.post_id}`;
  const readingTime = formatReadingTime(post.reading_time || '0');
  const fallbackImage = FALLBACK_IMAGE;

  cardWrapper.className = 'col c-12 m-6 l-4';
  cardWrapper.innerHTML = `
        <div class="post-card">
            <img src="${coverImage}" class="post-card-img" alt="${post.title}" onerror="this.onerror=null; this.src='${fallbackImage}';">
            <div class="post-card-body">
                <h5 class="post-card-title"><a target="_blank" href='${post_detail_url}'>${post.title}</a></h5>
                <div class="post-tags">
                  ${post.tags.map(tag => `<a class="badge" href='${POSTS_PAGES}?tag=${tag.name}'>#${tag.name}</a>`).join('')}
                </div>
                <p class="post-card-text">${post.description}</p>
                <div class="post-meta">
                    <span>${timeFromNow(post.created_at)} | ${readingTime}</span>
                </div>
            </div>
            <div class="post-card-footer">
                <a target="_blank" href='${post_detail_url}' class="btn-read-more">Read More</a>
            </div>
        </div>
    `;
  return cardWrapper;
}

const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const searchButton = document.getElementById('btnSearch');

let debounceTimeout = null;

if (searchInput && searchDropdown) {
  searchInput.addEventListener('input', function () {
    const query = this.value.trim();

    clearTimeout(debounceTimeout);

    if (!query) {
      searchDropdown.style.display = 'none';
      searchDropdown.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetch(`/api/search.php?type=post&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(json => {
          if (json.data && json.data.length > 0) {

            searchDropdown.innerHTML = json.data.map(post =>
              `<a class="search-dropdown-item" href="${POST_DETAIL_URL}?id=${post.post_id}" target="_blank">${post.title}</a>`
            ).join('');

            searchDropdown.style.display = 'block';
          } else {
            searchDropdown.innerHTML = '<div class="search-dropdown-item">No results found.</div>';
            searchDropdown.style.display = 'block';
          }
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          searchDropdown.innerHTML = '<div class="search-dropdown-item">Error searching.</div>';
          searchDropdown.style.display = 'block';
        });

    }, DEBOUNCE_TIMEOUT);
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = 'none';
      }
    });
  })
}

// Event listeners
if (searchButton) {
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `${POSTS_PAGES}?search=${encodeURIComponent(query)}`;
    }
  });
}