import {objectifyForm} from "./common.js";
document.addEventListener("DOMContentLoaded", () => {
  const UPLOAD_FILE_API_URL = "/api/files.php";
  const POST_API_URL = "/api/posts.php";


  const postImageInput = document.querySelector("#postImage");
  const displayPostImage = document.querySelector("#displayPostImage");
  const tagsContainer = document.querySelector("#tags");
  const createPostForm = document.querySelector("#createPostForm");
  const postImagePath = document.querySelector("#postImagePath");
  const postContent = document.querySelector("#postContent");

  function callUploadFile(file, method = 'POST', url = UPLOAD_FILE_API_URL, async = true, onSuccess = () => {}, onError = () => {}) {
    if (!file) return;

    let form = new FormData();
    form.append('file', file);
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, async);
    xhr.onload = function () {
      try {
        let res = JSON.parse(this.responseText);
        if (xhr.status === 200) {
          onSuccess(res);
        } else {
          onError(res);
        }
      } catch (err) {
        onError(err);
      }
    };
    xhr.onerror = function () {
      onError(new Error('Network error'));
    };
    xhr.send(form);
  }

  function imageHandler() {
    let input = document.createElement('input');
    input.type = 'file';
    input.click();
    input.addEventListener('change', function (event) {
      let image = input.files[0];
      callUploadFile(image, 'POST', UPLOAD_FILE_API_URL, true, (res) => {
        let imagePath = res.filePath;
        editor.insertEmbed(
          editor.getSelection().index,
          'image',
          imagePath,
        );
        addResizeHandleToImage();
        addAttachment(res.filename, res.fileType);
      }, err => {
        console.error('Image upload failed:', err);
        alert('Failed to upload image: ' + (err.message || 'Unknown error'));
      });
    });
  }

  let toolbarOption = {
    container: "#toolbar",
    handlers: {
      image: imageHandler
    }
  }
  let quillOptions = {
    modules: {
      syntax: {
        languages: [
          { key: 'Plain', label: 'Plain' },
          { key: 'java', label: 'Java' },
          { key: 'rust', label: 'Rust' },
          { key: 'javascript', label: 'JavaScript' },
          { key: 'c', label: 'C' },
          { key: 'cpp', label: 'C++' },
          { key: 'xml', label: 'HTML/XML' },
          { key: 'css', label: 'CSS' },
          { key: 'python', label: 'Python' },
          { key: 'sql', label: 'SQL' },
          { key: 'bash', label: 'Bash' },
          { key: 'markdown', label: 'Markdown' },
        ]
      },
      toolbar: toolbarOption,
    },
    placeholder: "Write your Post Here!",
    readOnly: false,
    theme: "snow",
  }
  let editor = new Quill("#editor", quillOptions);

  postImageInput.addEventListener("change", function (event) {
    let fileReader = new FileReader();
    fileReader.onload = (event) => {
      displayPostImage.src = event.target.result;
    }
    fileReader.readAsDataURL(this.files[0]);
  });


  function addResizeHandleToImage() {
    let images = document.querySelectorAll(".resizeable-image");
    images.forEach((image) => {
      if (!image.classList.contains('resizable')) {
        image.classList.add('resizable');
        interact(image).resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            move(event) {
              let target = event.target;
              let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
              let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;

              target.style.width = `${event.rect.width}px`;
              target.style.height = `${event.rect.height}px`;
              target.style.transform = `translate(${x}px, ${y}px)`;

              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
            }
          },
          modifiers: [
            interact.modifiers.restrictSize({
              min: { width: 100, height: 100 },
            })
          ],
        });
      }
    });
  }

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
    tagInput.name = "tags.name";
    tagInput.value = value;
    tagSpan.appendChild(tagLabel);
    tagSpan.appendChild(tagRemove);
    tagSpan.appendChild(tagInput);
    return tagSpan;
  }
  tagsContainer.addEventListener("keyup", (event) => {
    if (event.which === 32) {
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
  });

  function addAttachment(name, type) {
    const attachment = { name: name, type: type };
    attachments.push(attachment);
    renderAttachments();
  }

  const attachmentContainer = document.getElementById('attachmentContainer');
  let attachments = [];


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

  function callCreatePost(){
    postImagePath.value = callUploadPostImageCover();
    postContent.value = JSON.stringify(editor.getContents());

    // Serialize form data
    const formData = new FormData(createPostForm);
    let dataObject = objectifyForm(Array.from(formData.entries()).map(([name, value]) => ({ name, value })));
    console.log("postPayload:", dataObject);

    fetch(POST_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataObject)
    })
      .then(response => response.json().then(data => ({ status: response.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          alert("Post created successfully!");
        } else {
          alert("Failed to create post: " + body.message);
        }
      })
      .catch(err => {
        alert("Error creating post: " + err.message);
      });
    
  };

  createPostForm.addEventListener("submit", (event) => {
    event.preventDefault();
    callCreatePost();
  });
});