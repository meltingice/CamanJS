class Calculate {
  static luminance(r, g, b) {
    return (0.299 * r) + (0.587 * g) + (0.114 * b);
  }
}

export default Calculate;
