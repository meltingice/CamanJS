(function (Caman) {

Caman.manip.crossProcess = function () {
  return this
	   .curves('r', [0, 0], [10, 100], [200, 160], [220, 255])
	   .curves('b', [0, 50], [75, 86], [175, 160], [255, 220])
	   .curves('g', [0, 0], [100, 100], [150, 195], [255, 255]);
};

Caman.manip.vintage = function () {
  return this
      .saturation(40)
      .contrast(5)
      .curves('r', [0, 0], [125, 100], [220, 230], [220, 255])
      .curves('g', [0, 0], [120, 120], [128, 190], [255, 255])
      .curves('b', [0, 30], [0, 30], [255, 205], [255, 205])
      .colorize('#ff56aa', 10)
      .sepia(50)
      .saturation(-20)
      .vignette(120, 70);
};

}(Caman));