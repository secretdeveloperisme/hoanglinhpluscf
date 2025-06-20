import {callUploadFile, UPLOAD_FILE_API_URL, deepClone} from "./common.js";
const Image = Quill.import('formats/image');
const Font = Quill.import('formats/font');

Font.whitelist = [
  'sans-serif', 'serif', 'roboto', 'inter', 'lora', 'playfair'
];


class CustomImage extends Image {
  static create(value) {
    let node = super.create(value);

    // Add custom classes or attributes
    node.setAttribute('src', value);
    node.setAttribute('class', 'resizeable-image');
    node.setAttribute('style', 'max-width: 100%; height: auto;');
    node.setAttribute('loading', 'lazy');

    return node;
  }

  static value(node) {
    return node.getAttribute('src');
  }
}

Quill.register(Font, true);
Quill.register(CustomImage, true);

// Quill toolbar options

let attachments = [];

let toolbarOption = {
  container: "#toolbar",
  handlers: {
    image: imageHandler
  }
}

let quillOptionsWithoutToolBar = {
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
        { key: 'json', label: 'Json' },
        { key: 'css', label: 'CSS' },
        { key: 'python', label: 'Python' },
        { key: 'sql', label: 'SQL' },
        { key: 'bash', label: 'Bash' },
        { key: 'markdown', label: 'Markdown' },
      ]
    },
    toolbar: false
  },
  placeholder: "Write your Post Here!",
  readOnly: false,
  theme: "snow",
  customEvents: {
    doAfterInsertImage: null
  }
}

let quillOptions = deepClone(quillOptionsWithoutToolBar);
quillOptions.modules.toolbar = toolbarOption;

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


function imageHandler() {
  if (!this.quill) return;
  let quill = this.quill;
  let input = document.createElement('input');
  input.type = 'file';
  input.click();
  input.addEventListener('change', function (event) {
    let image = input.files[0];
    callUploadFile(image, 'POST', UPLOAD_FILE_API_URL, true, (res) => {
      let imagePath = res.filePath;
      quill.insertEmbed(
        quill.getSelection().index,
        'image',
        imagePath,
      );
      addResizeHandleToImage();

      if(quillOptions.customEvents.doAfterInsertImage !== null){
        quillOptions.customEvents.doAfterInsertImage(res.filename, res.fileType, res.filePath);
      }
    }, err => {
      console.error('Image upload failed:', err);
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    });
  });
}

export {quillOptions, quillOptionsWithoutToolBar, attachments}