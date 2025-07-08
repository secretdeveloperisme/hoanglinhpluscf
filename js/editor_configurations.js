import {callUploadFile, UPLOAD_FILE_API_URL, deepClone, isObject} from "./common.js";
const Image = Quill.import('formats/image');
const Font = Quill.import('formats/font');

Font.whitelist = [
  'sans-serif', 'serif', 'roboto', 'inter', 'lora', 'jetbrain-mono', 'playfair'
];


class CustomImage extends Image {
  static RESIZABLE_CLASS = 'resizeable-image';
  static create(value) {
    let node = super.create(value);
    // Add custom classes or attributes
    node.setAttribute('class', this.RESIZABLE_CLASS);
    if(isObject(value)){
      node.setAttribute('src', value.src);
      node.setAttribute('style', value.style || "");
      node.setAttribute('loading', value.loading || "lazy");
    }
    return node;
  }

  static value(node) {
    return {
      src : node.getAttribute('src'),
      class : node.getAttribute('class'),
      style : node.getAttribute('style'),
      loading : node.getAttribute('loading'),
    }
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
    toolbar: false,
    clipboard: {
      matchers: [
        ['img', pasteImageMatcher]
      ]
    }
  },
  placeholder: "Write your Post Here!",
  readOnly: false,
  theme: "snow",
  customEvents: {
    doAfterInsertImage: null,
    doAfterPasteContent,
  }
}

let quillOptions = deepClone(quillOptionsWithoutToolBar);
quillOptions.modules.toolbar = toolbarOption;

let interactConfigs = {
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
};


function pasteImageMatcher(node, delta) {
  console.log("node:", node);
  console.log("delta: ", delta);
  const imgTags = node.querySelectorAll('img');
  delta.ops.forEach(op => {
    if (op.insert && typeof op.insert === 'object') {
      op.attributes.class = CustomImage.RESIZABLE_CLASS;
    }
  });
  imgTags.forEach(img =>{
    interact(img).resizable(interactConfigs);
  })
  return delta;
};


function addResizeHandleToImages() {
  let images = document.querySelectorAll(".resizeable-image");
  images.forEach((image) => {
    if (!image.classList.contains('resizable')) {
      addResizeHandleToImage(image)
    }
  });
}

function addResizeHandleToImage(imgElement) {
  if(imgElement === undefined || imgElement === null)
    return;
  imgElement.classList.add('resizable');
  interact(imgElement).resizable(interactConfigs);
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
        {
          src: imagePath,
          class: "resizeable-image",
          style: "",
          loading: "lazy"
        },
      );
      addResizeHandleToImages();

      if(quillOptions.customEvents.doAfterInsertImage !== null){
        quillOptions.customEvents.doAfterInsertImage(res.filename, res.fileType, res.filePath);
      }
    }, err => {
      console.error('Image upload failed:', err);
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    });
  });
}


function doAfterPasteContent(quill) {
  setTimeout(() => {
    const contents = quill.getContents();
    console.log("Editor contents after paste:", contents);

    if (containsImage(contents)) {
      console.log("An image was pasted!");
      addResizeHandleToImages(); 
    }
  }, 1);
}

function containsImage(delta) {
  return delta.ops.some(op => typeof op.insert === 'object' && op.insert.image);
}

export {quillOptions, quillOptionsWithoutToolBar, attachments, addResizeHandleToImages}