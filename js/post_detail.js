import { makeHttpRequest, makeElementSticky, timeFromNow, isEmptyString } from "./common.js"

import { quillOptionsWithoutToolBar } from "./editor_configurations.js"
document.addEventListener('DOMContentLoaded', async () => {
  const postCoverImage = document.querySelector('#postCoverImage');
  const postTitle = document.querySelector('#postTitle');
  const postDescription = document.querySelector('#postDescription');
  const postCreatedAt = document.querySelector('#postCreatedAt');
  const postUpdatedAt = document.querySelector('#postUpdatedAt');
  const tagsContainer = document.querySelector('#tagsContainer');
  const postContent = document.querySelector('#postContent');
  const tocWrapper = document.querySelector('#tocWrapper')
  const tocElement = document.querySelector('#tableOfContent');
  const GET_POST_URL = "/api/posts.php?id="


  makeElementSticky("tocWrapper")

  function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }


function createLiHeading(heading) {
  if (!heading.id) {
    heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
  }
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = `#${heading.id}`;
  a.textContent = heading.textContent;
  li.appendChild(a);
  return li;
}

function buildTOC(contentEl, tocContainer) {
  let headings = Array.from(contentEl.querySelectorAll('h1, h2, h3, h4, h5'));
  if (!headings.length) return;

  // Remove first header if it is level 3
  if (headings[0] && headings[0].tagName.toLowerCase() === 'h3') {
    headings.shift();
    const li = createLiHeading(headings[0]);
    tocContainer.innerHTML = '';
    tocContainer.appendChild(li);
    if (!headings.length) return;
  }

  let currentLevel = parseInt(headings[0].tagName[1]);
  let stack = [document.createElement('ul')];

  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    const li = createLiHeading(heading);

    if (level > currentLevel) {
      for (let i = currentLevel; i < level; i++) {
        const newUl = document.createElement('ul');
        stack[stack.length - 1].lastElementChild.appendChild(newUl);
        stack.push(newUl);
      }
      currentLevel = level;
    } else if (level < currentLevel) {
      while (currentLevel > level) {
        stack.pop();
        currentLevel--;
      }
    }
    stack[stack.length - 1].appendChild(li);
  });

  tocContainer.innerHTML = '';
  tocContainer.appendChild(stack[0]);
}

  const postId = getPostId();
  if (!postId) return;

  try {
    let {data: post} = await makeHttpRequest("GET", GET_POST_URL + postId)

    if (post === null) {
      console.error(`Failed to get post with id ${postId}`);
      return;
    }
    if (postCoverImage && post.cover_image) {
      postCoverImage.src = post.cover_image;
    }
    if (postTitle) postTitle.textContent = post.title;
    document.title = post.title;
    document.querySelector('meta[name="description"]').setAttribute("content", post.description);
    document.querySelector('meta[property="og:title"]').setAttribute("content", post.title);
    document.querySelector('meta[property="og:description"]').setAttribute("content", post.description);
    if (post.cover_image) {
      document.querySelector('meta[property="og:image"]').setAttribute("content", post.cover_image);
    }
    if (postCreatedAt) postCreatedAt.textContent = timeFromNow(post.created_at);
    if (postUpdatedAt) postUpdatedAt.textContent = timeFromNow(post.updated_at);
    if (tagsContainer && Array.isArray(post.tags)) {
      tagsContainer.innerHTML = '';
      post.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = `#${tag.name}`;
        tagsContainer.appendChild(span);
      });
    }else{
      tagsContainer.classList.add('hl-display-none');
    }
    if (!isEmptyString(post.description)) {
      postDescription.textContent = post.description;
    }
    else{
      postDescription.classList.add('hl-display-none');
    }
    if (postContent && post.content) {
      quillOptionsWithoutToolBar.readOnly = true;
      const quillEditor = new Quill(postContent, quillOptionsWithoutToolBar);
      quillEditor.setContents(JSON.parse(post.content));
    }
    if (tocElement && postContent) {
      buildTOC(postContent, tocElement)
    }

  } catch (err) {
    console.error(err);
  }
});
