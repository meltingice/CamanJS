import Calculate from "../caman/calculate";
import Color from "../caman/color";
import Filter from "../caman/filter";

export function Filters(Caman) {
  Caman.Renderer.register("brightness", function (adjust) {
    adjust = Math.floor(255 * (adjust / 100));

    return new Filter(function () {
      this.r += adjust;
      this.g += adjust;
      this.b += adjust;
    });
  });

  Caman.Renderer.register("fillColor", function (...args) {
    let color;
    if (args.length === 1) {
      color = Color.hexToRGB(args[0]);
    } else {
      color = args;
    }

    return new Filter(function () {
      this.r = color[0];
      this.g = color[1];
      this.b = color[2];
      this.a = 255;
    });
  });

  Caman.Renderer.register("saturation", function (adjust) {
    adjust *= -0.01;

    return new Filter(function () {
      let max = Math.max(this.r, this.g, this.b);
      if (this.r !== max) this.r += (max - this.r) * adjust;
      if (this.g !== max) this.g += (max - this.g) * adjust;
      if (this.b !== max) this.b += (max - this.b) * adjust;
    });
  });

  Caman.Renderer.register("vibrance", function (adjust) {
    adjust *= -1;

    return new Filter(function () {
      let max = Math.max(this.r, this.g, this.b);
      let avg = (this.r + this.g + this.b) / 3;
      let amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100;

      if (this.r !== max) this.r += (max - this.r) * amt;
      if (this.g !== max) this.g += (max - this.g) * amt;
      if (this.b !== max) this.b += (max - this.b) * amt;
    });
  });

  Caman.Renderer.register("greyscale", function (adjust) {
    return new Filter(function () {
      this.r = this.g = this.b = Calculate.luminance(this.r, this.g, this.b);
    });
  });

  Caman.Renderer.register("contrast", function (adjust) {
    adjust = Math.pow((adjust + 100) / 100, 2);

    return new Filter(function () {
      this.r = ((((this.r / 255) - 0.5) * adjust) + 0.5) * 255;
      this.g = ((((this.g / 255) - 0.5) * adjust) + 0.5) * 255;
      this.b = ((((this.b / 255) - 0.5) * adjust) + 0.5) * 255;
    });
  });

  Caman.Renderer.register("hue", function (adjust) {
    return new Filter(function () {
      let [h, s, v] = Color.rgbToHSV(this.r, this.g, this.b);
      h = (((h * 100) + Math.abs(adjust)) % 100) / 100;
      [this.r, this.g, this.b] = Color.hsvToRGB(h, s, v);
    });
  });
}
