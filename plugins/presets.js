(function (Caman) {

Caman.manip.crossProcess = function () {
  return this
    .curves('r', [0, 0], [130, 50], [125, 205], [255, 255])
    .curves('b', [0, 50], [20, 120], [235, 135], [255, 255])
    .curves('g', [0, 0], [130, 50], [125, 205], [255, 255])
    .brightness(3)
    .contrast(5);
};

Caman.manip.vintage = function (vignette) {
  var ret = this
    .saturation(40)
    .contrast(5)
    .curves('r', [0, 0], [125, 100], [220, 230], [220, 255])
    .curves('g', [0, 0], [120, 120], [128, 190], [255, 255])
    .curves('b', [0, 30], [0, 30], [255, 205], [255, 205])
    .colorize('#ff56aa', 10)
    .sepia(50)
    .saturation(-20);
    
  if (vignette || typeof vignette === 'undefined') {
    return this.vignette(150, 100);
  }
  
  return ret;
};

}(Caman));