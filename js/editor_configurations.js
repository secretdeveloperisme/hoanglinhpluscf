const Image = Quill.import('formats/image');

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

Quill.register(CustomImage, true);
