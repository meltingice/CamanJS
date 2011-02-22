/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.vintage = function (vignette) {
  this
    .greyscale()
    .contrast(5);
  
  if (vignette || typeof vignette === 'undefined') {
    this.vignette(250, 25);
  }
  
  return this
    .noise(3)
    .sepia(100)
    .channels({red: 8, blue: 2, green: 4})
    .gamma(0.87);
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
    .brightness(15)
    .exposure(10)
    .curves('rgb', [0,0], [100, 0], [155, 255], [255, 255])
    .clip(30)
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

Caman.manip.love = function () {
  return this
    .brightness(5)
    .exposure(8)
    .colorize('#c42007', 30)
    .vibrance(50)
    .gamma(1.3);
};

Caman.manip.grungy = function () {
  return this
    .gamma(1.5)
    .clip(25)
    .saturation(-60)
    .contrast(5)
    .noise(5)
    .vignette(200, 30);
};

Caman.manip.jarques = function () {
  return this
    .saturation(-35)
    .curves('b', [20, 0], [90, 120], [186, 144], [255, 230])
    .curves('r', [0, 0], [144, 90], [138, 120], [255, 255])
    .curves('g', [10, 0], [115, 105], [148, 100], [255, 248])
    .curves('rgb', [0, 0], [120, 100], [128, 140], [255, 255])
    .sharpen(20);
};

Caman.manip.pinhole = function () {
  return this
    .greyscale()
    .sepia(10)
    .exposure(10)
    .contrast(15)
    .vignette(250, 35);
};

Caman.manip.oldBoot = function () {
  return this
    .saturation(-20)
    .vibrance(-50)
    .gamma(1.1)
    .sepia(30)
    .channels({red: -10, blue: 5})
    .curves('rgb', [0, 0], [80, 50], [128, 230], [255, 255])
    .vignette(250, 30);
};

Caman.manip.glowingSun = function () {
  this.brightness(10);
    
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(10);
    this.copyParent();
    
    this.filter.gamma(0.8);
    this.filter.contrast(50);
    
    this.newLayer(function () {
      this.setBlendingMode('softLight');
      this.opacity(10);
      this.fillColor('#f49600');
      this.render();
    });
    
    this.filter.exposure(10);
          
    this.render();
  });
  
  this.exposure(20);
  this.gamma(0.8);
  
  return this.vignette(250, 20);
};

}(Caman));