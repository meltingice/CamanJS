class Caman {
  static blank(size) {
    return new Promise(function (resolve, reject) {
      let canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;

      return resolve(new Caman(canvas));
    });
  }

  static fromURL(url) {
    return new Promise(function (resolve, reject) {
      let image = document.createElement('img');
      image.addEventListener('load', () => { resolve(Caman.fromImage(image)) });
      image.src = url;
    });
  }

  static fromImage(image) {
    let loadImage = new Promise(function (resolve, reject) {
      if (image.complete || (image.naturalWidth && image.naturalWidth > 0)) {
        return resolve(image);
      } else {
        image.addEventListener('load', () => { resolve(image) });
      }
    });

    return new Promise(function (resolve, reject) {
      loadImage.then(function (image) {
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        let context = canvas.getContext('2d');
        context.drawImage(image,
          0, 0,
          image.width, image.height,
          0, 0,
          canvas.width, canvas.height
        );

        return resolve(new Caman(canvas));
      });
    });
  }

  static fromCanvas(canvas) {
    return new Promise((resolve, reject) => resolve(new Caman(canvas)));
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.contexts = [];
  }

  attach(dest) {
    dest = typeof dest === "object" ? dest : document.querySelector(dest);
    dest.parentNode.replaceChild(this.canvas, dest);
  }

  newContext(func) {
    func.call(this.context.renderer);
    return this.render().bind(this);
  }

  render() {
    return this.context.renderer.render();
  }
}

import { Filter } from "./caman/filter";
Caman.Filter = Filter;

import { CamanLib } from "./caman-lib";
CamanLib(Caman);

export default Caman;
