class Color {
  static hexToRGB(hex) {
    if (hex.charAt(0) == "#") hex = hex.substr(1);

    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16)
    ];
  }
}

export default Color;
