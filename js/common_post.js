import { calculateReadingTime, timeFromNow } from '../js/common.js';
const POST_DETAIL_URL = '/pages/post_detail.html';
const FALLBACK_IMAGE = 'https://dummyimage.com/600x400/10b981/fff&text=HLP';
const POSTS_API_URL = '/api/posts.php';


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

  const tag = filterSelect.value;
  if (tag) params.push(`tag=${encodeURIComponent(tag)}`);

  const search = searchInput.value.trim();
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
  const readingTime = post.reading_time || '0 min';
  const fallbackImage = FALLBACK_IMAGE;
  cardWrapper.className = 'col c-12 m-6 l-4';
  cardWrapper.innerHTML = `
        <div class="post-card">
            <img src="${coverImage}" class="post-card-img" alt="${post.title}" onerror="this.onerror=null; this.src='${fallbackImage}';">
            <div class="post-card-body">
                <h5 class="post-card-title"><a target="_blank" href='${post_detail_url}'>${post.title}</a></h5>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="badge">#${tag.name}</span>`).join('')}
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
