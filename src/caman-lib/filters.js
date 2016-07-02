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

  Caman.Renderer.register("colorize", function (...args) {
    let rgb, level;
    if (args.length === 2) {
      rgb = Color.hexToRGB(args[0]);
      level = args[1] / 100;
    } else {
      rgb = args.slice(0, 3);
      level = args[3] / 100;
    }

    return new Filter(function () {
      this.r -= (this.r - rgb[0]) * level;
      this.g -= (this.g - rgb[1]) * level;
      this.b -= (this.b - rgb[2]) * level;
    });
  });

  Caman.Renderer.register("invert", function () {
    return new Filter(function () {
      this.r = 255 - this.r;
      this.g = 255 - this.g;
      this.b = 255 - this.b;
    });
  });

  Caman.Renderer.register("sepia", function (adjust) {
    adjust /= 100;

    return new Filter(function () {
      this.r = Math.min(255, (this.r * (1 - (0.607 * adjust))) + (this.g * (0.769 * adjust)) + (this.b * (0.189 * adjust)));
      this.g = Math.min(255, (this.r * (0.349 * adjust)) + (this.g * (1 - (0.314 * adjust))) + (this.b * (0.168 * adjust)));
      this.b = Math.min(255, (this.r * (0.272 * adjust)) + (this.g * (0.534 * adjust)) + (this.b * (1- (0.869 * adjust))));
    });
  });

  Caman.Renderer.register("gamma", function (adjust) {
    return new Filter(function () {
      this.r = Math.pow(this.r / 255, adjust) * 255;
      this.g = Math.pow(this.g / 255, adjust) * 255;
      this.b = Math.pow(this.b / 255, adjust) * 255;
    });
  });
}
