import {UPLOAD_FILE_API_URL, objectifyForm, callUploadFile, calculateReadingTime, makeHttpRequest, isEmptyString} from "./common.js";
import {quillOptions, attachments} from "./editor_configurations.js";

document.addEventListener("DOMContentLoaded", async () => {
  const POST_API_URL = "/api/posts.php";
  const POST_DETAIL_URL = "/pages/post_detail.html?id=";
  const A_POST_URL = "/api/posts.php?id=";
  const defaultUploadIconUrl = "/assets/icons/upload.svg"

  // post form elements
  const postImageInput = document.querySelector("#postImage");
  const displayPostImage = document.querySelector("#displayPostImage");
  const tagsContainer = document.querySelector("#tags");
  const publishedStatusRadio = document.querySelector('#publishedStatusRadio');
  const draftStatusRadio = document.querySelector('#draftStatusRadio');
  const postTitle = document.querySelector("#postTitle");
  const postDescription = document.querySelector("#postDescription");
  const createPostForm = document.querySelector("#createPostForm");
  const postImagePath = document.querySelector("#postImagePath");
  const readingTime = document.querySelector("#postReadingTime");
  const btnCreatePost = document.querySelector("#btnCreatePost");
  const btnSavePost = document.querySelector("#btnSavePost");
  const btnResetPost = document.querySelector("#btnResetPost");
  const attachmentContainer = document.getElementById('attachmentContainer');

  quillOptions.customEvents.doAfterInsertImage = addAttachment;

  let editor = new Quill("#editor", quillOptions);

  postImageInput.addEventListener("change", function (event) {
    let fileReader = new FileReader();
    fileReader.onload = (event) => {
      displayPostImage.src = event.target.result;
    }
    fileReader.readAsDataURL(this.files[0]);
  });


  function setCaretToEnd(target) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    target.focus();
    range.detach(); // optimization
    target.scrollTop = target.scrollHeight;
  }


  function createTagElement(value) {
    let tagSpan = document.createElement("span");
    tagSpan.className = "tag-item";
    tagSpan.setAttribute("contenteditable", "false");
    let tagLabel = document.createElement("span");
    tagLabel.className = "tag-text";
    tagLabel.textContent = value + " ";
    let tagRemove = document.createElement("span");
    tagRemove.className = "tag-remove";
    tagRemove.innerHTML = `<i class="fa fa-times"></i>`;
    tagRemove.addEventListener("click", (event) => {
      tagSpan.remove();
    });
    let tagInput = document.createElement("input");
    tagInput.type = "hidden";
    tagInput.name = "tags";
    tagInput.value = value;
    tagSpan.appendChild(tagLabel);
    tagSpan.appendChild(tagRemove);
    tagSpan.appendChild(tagInput);
    return tagSpan;
  }
  function generateTags(){
    let text = tagsContainer.textContent;
      let tags = text.match(/\w+/g);
      if (tags !== null) {
        tagsContainer.innerHTML = "";
        tags.forEach((value, index) => {
          let tagElement = createTagElement(value);
          tagsContainer.appendChild(tagElement);
          setCaretToEnd(tagsContainer);
        });
      }
  }
  
  tagsContainer.addEventListener("keyup", (event) => {
    if (event.which === 32 || event.which === 13) {
      generateTags();
    }
  });

  tagsContainer.addEventListener("input", (event) => {
    if (event.which === 32 || event.which === 13) {
      generateTags();
    }
  });


  function addAttachment(name, type, url, id = null) {
    const attachment = { name: name, type: type , url: url};
    if(id !== null) {
      attachment.id = id;
    }
    if (attachments.some(file => file.name === attachment.name && file.type === attachment.type)){
      return; // Prevent duplicate attachments
    }
    attachments.push(attachment);
    renderAttachments();
  }

  function renderAttachments() {
    attachmentContainer.innerHTML = '';
    attachments.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'attachment-item';
      item.innerHTML = `
                <span class="attachment-name">${file.name}</span>
                <span class="attachment-type">${file.type || 'Unknown type'}</span>
                <button class="attachment-remove btn btn-sm btn-danger" data-idx="${idx}" title="Delete">
                    <i class="fa fa-trash"></i>
                </button>
            `;
      attachmentContainer.appendChild(item);
    });
  }

  attachmentContainer.addEventListener('click', function (e) {
    if (e.target.closest('.attachment-remove')) {
      const idx = parseInt(e.target.closest('.attachment-remove').getAttribute('data-idx'));
      attachments.splice(idx, 1);
      renderAttachments();
    }
  });


  async function loadPostData(postId){
    if (!postId) {
      console.error("No post ID provided for loading post data.");
      return;
    }
    document.title = "Edit Post";
    try {
      let post = await makeHttpRequest("GET", A_POST_URL + postId)
      if (post === null) {
        console.error(`Failed to get post with id ${postId}`);
        return;
      }
      postTitle.value = post.title;
      postDescription.value = post.description;
      switch (post.post_status) {
        case 'PUBLISHED':
          publishedStatusRadio.checked = true;
          draftStatusRadio.checked = false;
          break;
        case 'DRAFT':
          publishedStatusRadio.checked = false;
          draftStatusRadio.checked = true;
          break;
        default:
          publishedStatusRadio.checked = false;
          draftStatusRadio.checked = false;
          break;
      }
      
      editor.setContents(post.content ? JSON.parse(post.content) : []);
      readingTime.value = post.reading_time;
      postImagePath.value = post.cover_image || "";
      displayPostImage.src = post.cover_image || defaultUploadIconUrl;

      // Fill tags
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          let tagElement = createTagElement(tag.name);
          tagsContainer.appendChild(tagElement);
        });
      }

      // Fill attachments
      if (post.attachments && Array.isArray(post.attachments)) {
        post.attachments.forEach(file => {
          addAttachment(file.file_name, file.file_type, file.file_url, file.attachment_id);
        });
      }
    }
    catch (error) {
      console.error("Error fetching post data:", error);
    }
  }


  function callUploadPostImageCover(){
    let postImageFile = postImageInput.files[0];
    if(!postImageFile) {
      return null;
    }
    let uploadImageResponse = null;

    callUploadFile(postImageFile, 'POST', UPLOAD_FILE_API_URL, false, (res) => {
      uploadImageResponse = res;
    }, (err) => {
      console.error('Image upload failed:', err);
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    });
    if (!uploadImageResponse) {
      alert("Image upload failed. Please try again.");
      return;
    }
    return uploadImageResponse.filePath;
  }

  function preparePostPayload(){
    postImagePath.value = callUploadPostImageCover();
    readingTime.value = calculateReadingTime(editor.getText());

    // Serialize form data
    const formData = new FormData(createPostForm);
    let dataObject = objectifyForm(Array.from(formData.entries()).map(([name, value]) => ({ name, value })));
    if(dataObject.tags !== undefined &&  !Array.isArray(dataObject.tags)) {
      dataObject.tags = [dataObject.tags];
    }
    dataObject.reading_time = parseInt(readingTime.value);
    if(attachments.length > 0) {
      dataObject.attachments = attachments.map(file => {
        let attachment = { file_name: file.name, file_type: file.type, file_url: file.url }
        if(file.id !== undefined) {
          attachment.file_id = file.id;
        }
        return attachment;
      }
      );
    }
    if(dataObject.cover_image != undefined && isEmptyString(dataObject.cover_image)){
      delete dataObject.cover_image;
    }
    dataObject.content = JSON.stringify(editor.getContents());
    // remove unnecessary fields
    delete dataObject.postImage;
    console.log("[preparePostPayload] postPayload:", dataObject);
    return dataObject;
  }

  function callCreatePost(){
    let dataObject = preparePostPayload();

    fetch(POST_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataObject)
    })
      .then(response => response.json().then(data => ({ status: response.status, post: data.Post })))
      .then(({ status, post }) => {
        if (status === 200) {
          alert("Post created successfully!");
          window.open(POST_DETAIL_URL + post.post_id, '_blank').focus();
        } else {
          alert("Failed to create post: " + body.message);
        }
      })
      .catch(err => {
        alert("Error creating post: " + err.message);
      });
    
  };

  function callUpdatePost(postId){
    let dataObject = preparePostPayload();
    fetch(A_POST_URL + postId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataObject)
    })
      .then(response => response.json().then(data => ({ status: response.status, post: data.Post })))
      .then(({ status, post }) => {
        if (status === 200) {
          alert("Post updated successfully!");
          resetPostForm();
          loadPostData(postId);
        } else {
          alert("Failed to create post: " + body.message);
        }
      })
      .catch(err => {
        alert("Error creating post: " + err.message);
      });
  }
  

  function resetPostForm() {
    displayPostImage.src = defaultUploadIconUrl;
    tagsContainer.innerHTML = "";
    editor.setText("");
    publishedStatusRadio.checked = true;
    attachmentContainer.innerHTML = "";
    attachments.splice(0, attachments.length);

    postTitle.value = "";
    postDescription.value = "";
    readingTime.value = "0";
    postImagePath.value = "";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  if (postId) {
    loadPostData(postId);
  }

  // Add event listeners

  btnResetPost.addEventListener("click", resetPostForm);

  if(btnCreatePost != undefined){
    btnCreatePost.addEventListener("click", (event) => {
        event.preventDefault();
        callCreatePost();
    });
  }

  if(btnSavePost != undefined){
    btnSavePost.addEventListener("click", (event) => {
      event.preventDefault();
      callUpdatePost(postId);
    });
  }


 
});