import { Renderer } from "./renderer";

class Context {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.load();

    this.renderer = new Renderer(this);
  }

  load() {
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;
  }

  update() {
    this.context.putImageData(this.imageData, 0, 0);
  }
}

export default Context;
