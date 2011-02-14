/*
 * NodeJS compatibility
 */
if (!Caman) {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

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
    return this.vignette(180, 80);
  }
  
  return ret;
};

Caman.manip.lomo = function() {
  return this
    .brightness(15)
    .exposure(15)
    .curves('rgb', [0, 0], [200, 0], [155, 255], [255, 255])
    .saturation(-20)
    .gamma(1.8)
    .vignette(300, 60)
    .brightness(5);
};

Caman.manip.clarity = function (grey) {
  var manip = this
    .vibrance(20)
    .curves('rgb', [5, 0], [130, 150], [190, 220], [250, 255])
    .sharpen(15)
    .vignette(250, 20);
    
   if (grey) {
     this
       .greyscale()
       .contrast(4);
   }
   
   return manip;
};

Caman.manip.sinCity = function () {
  return this
    .contrast(100)
    .brightness(5)
    .exposure(10)
    .curves('rgb', [0,0], [100, 0], [155, 255], [255, 255])
    .greyscale();
};

Caman.manip.sunrise = function () {
  return this
    .exposure(3.5)
    .saturation(-5)
    .vibrance(50)
    .sepia(60)
    .colorize('#e87b22', 10)
    .channels({red: 8, blue: 8})
    .contrast(5)
    .gamma(1.2)
    .vignette(250, 25);
};

Caman.manip.crossProcess = function () {
  return this
    .exposure(5)
    .colorize('#e87b22', 4)
    .sepia(20)
    .channels({blue: 8, red: 3})
    .curves('b', [0, 0], [100, 150], [180, 180], [255, 255])
    .contrast(15)
    .vibrance(75)
    .gamma(1.6);
};

Caman.manip.orangePeel = function () {
	return this
		.curves('rgb', [0, 0], [100, 50], [140, 200], [255, 255])
		.vibrance(-30)
		.saturation(-30)
		.colorize('#ff9000', 30)
		.contrast(-5)
		.gamma(1.4);
};

}(Caman));