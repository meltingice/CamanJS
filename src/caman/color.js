class Color {
  static hexToRGB(hex) {
    if (hex.charAt(0) == "#") hex = hex.substr(1);

    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16)
    ];
  }

  static rgbToHSV(r, b, g) {
    r /= 255
    g /= 255
    b /= 255

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let d = max - min;

    let h,
        s = max === 0 ? 0 : d / max,
        v = max;

    if (max === min) {
      h = 0
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0); break;
        case g:
          h = (b - r) / d + 2; break;
        case b:
          h = (r - g) / d + 4;
      }

      h /= 6;
    }

    return [h, s, v];
  }

  static hsvToRGB(h, s, v) {
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return [
      Math.floor(r * 255),
      Math.floor(g * 255),
      Math.floor(b * 255)
    ];
  }
}

export default Color;
