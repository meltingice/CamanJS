var remoteImg = "http://camanjs.com/imgs/logo.png",
reset = function (id) {
  if (id.substr(0, 1) == '#') {
    id = id.substr(1);
  }
  
  var canvas = document.getElementById(id),
  image = document.createElement('img');
  image.id = id;
  image.src = 'testimg.jpg';
  
  canvas.parentNode.replaceChild(image, canvas);
  
  if (Caman.store['#' + id]) {
    delete Caman.store['#' + id];
  }
};

module("Caman Core Library");

test("Caman is a function", function () {
  
  ok(Caman, "Caman exists");
  ok(typeof Caman == "function", "Caman is a function");
});

test("Invoking Caman() with one argument", function () {
  
  var existing_image = Caman("#test-image");
  
  ok(typeof existing_image == "object", "Invoking on valid ID returns object");
  ok(typeof existing_image.render == "function", "Returned object is Caman.manip");
  
  raises(function () {
    Caman("#test-invalid");
  }, "Raises exception when invoked on an invalid element");
  
  reset("#test-image");
});

asyncTest("Invoking Caman() with two arguments", function () {
  
  var existing_image = Caman("#test-image", function () {
    ok(typeof this.render === "function", "Callback is fired with Caman.manip as context");
    ok(typeof Caman("#test-image").render === "function", "Invoking on an already initialized element returns Caman.manip");
    
    start();
  });
  
  var withcanvas = Caman("testimg.jpg", "#test-canvas");
  
  ok(typeof existing_image.render === "function", "Invoking with Image and callback returns Caman.manip");
  ok(typeof withcanvas.render === "function", "Invoking with URL and Canvas returns Caman.manip");
  
  raises(function () {
    Caman("#test-invalid", function () {});
  }, "Raises exception when invoked on an invalid Image element");
  
  raises(function () {
    Caman("testimg.jpg", "#test-invalid");
  }, "Raises exception when invoked with an invalid Canvas element");
  
  reset("#test-image");
});

asyncTest("Invoking Caman() with three arguments", function () {

  var caman = Caman("testimg.jpg", "#test-canvas", function () {
    ok(typeof this.render === "function", "Callback is fired with Caman.manip as context");
    ok(typeof Caman("#test-canvas").render === "function", "Invoking on an already initialized element returns Caman.manip");
    
    start();
  });
  
  ok(typeof caman.render === "function", "Invoking with URL, Canvas, and callback returns Caman.manip");
  
  raises(function () {
    Caman("testimg.jpg", "#test-invalid", function () {});
  }, "Raises exception when invoked with an invalid Canvas element");
});

module("Caman Utils");

test("rgb_to_xyz and xyz_to_rgb are symmetric", function() {
  var rgbColors = [
    {r: 127, g: 127, b: 127},
    {r:   0, g:   0, b: 255},
    {r:   0, g: 255, b:   0},
    {r: 255, g:   0, b:   0},
    {r:  12, g:  32, b:  64}
  ];

  expect(rgbColors.length * 3);

  for(var i = 0, len = rgbColors.length; i < len; ++i) {
    var originalRGB = rgbColors[i];
    var xyz = Caman.rgb_to_xyz(originalRGB.r, originalRGB.g, originalRGB.b);
    var rgb = Caman.xyz_to_rgb(xyz.x, xyz.y, xyz.z);
    var testColorStr = '{r: ' + originalRGB.r + ', g: ' + originalRGB.g + ', b: ' + originalRGB.b + '}';
    ok(Math.round(rgb.r) == originalRGB.r, "Red value for " + testColorStr);
    ok(Math.round(rgb.g) == originalRGB.g, "Green value for " + testColorStr);
    ok(Math.round(rgb.b) == originalRGB.b, "Blue value for " + testColorStr);
  }
});

test("xyz_to_rgb and rgb_to_xyz are symmetric", function() {
  var xyzColors = [
    {x: 50.5, y: 50.5, z: 50.5},
    {x:    0, y:    0, z:  100},
    {x:    0, y:  100, z:    0},
    {x:  100, y:    0, z:    0},
    {x: 10.4, y: 92.8, z: 39.2}
  ];

  expect(xyzColors.length * 3);

  for(var i = 0, len = xyzColors.length; i < len; ++i) {
    var originalXYZ = xyzColors[i];
    var rgb = Caman.xyz_to_rgb(originalXYZ.x, originalXYZ.y, originalXYZ.z);
    var xyz = Caman.rgb_to_xyz(rgb.r, rgb.g, rgb.b);

    var testColorStr = '{x: ' + originalXYZ.x + ', y: ' + originalXYZ.y + ', z: ' + originalXYZ.z + '}';
    ok(Math.abs(xyz.x - originalXYZ.x) < 0.01, "X value for " + testColorStr);
    ok(Math.abs(xyz.y - originalXYZ.y) < 0.01, "Y value for " + testColorStr);
    ok(Math.abs(xyz.z - originalXYZ.z) < 0.01, "Z value for " + testColorStr);
  }
});

test("xyz_to_lab and lab_to_xyz are symmetric", function() {
  var xyzColors = [
    {x: 50.5, y: 50.5, z: 50.5},
    {x:    0, y:    0, z:  100},
    {x:    0, y:  100, z:    0},
    {x:  100, y:    0, z:    0},
    {x: 10.4, y: 92.8, z: 39.2}
  ];

  expect(xyzColors.length * 3);

  for(var i = 0, len = xyzColors.length; i < len; ++i) {
    var originalXYZ = xyzColors[i];
    var lab = Caman.xyz_to_lab(originalXYZ.x, originalXYZ.y, originalXYZ.z);
    var xyz = Caman.lab_to_xyz(lab.l, lab.a, lab.b);

    var testColorStr = '{x: ' + originalXYZ.x + ', y: ' + originalXYZ.y + ', z: ' + originalXYZ.z + '}';
    ok(Math.abs(xyz.x - originalXYZ.x) < 0.01, "X value for " + testColorStr);
    ok(Math.abs(xyz.y - originalXYZ.y) < 0.01, "Y value for " + testColorStr);
    ok(Math.abs(xyz.z - originalXYZ.z) < 0.01, "Z value for " + testColorStr);
  }
});

test("lab_to_xyz and xyz_to_lab are symmetric", function() {
  var labColors = [
    {l: 50.1, a:    0, b:    0},
    {l:    0, a: -100, b:  100},
    {l:    0, a:  100, b: -100},
    {l:  100, a: -100, b: -100},
    {l: 27.3, a:-52.8, b: 12.9}
  ];

  expect(labColors.length * 3);

  for(var i = 0, len = labColors.length; i < len; ++i) {
    var originalLAB = labColors[i];
    var xyz = Caman.lab_to_xyz(originalLAB.l, originalLAB.a, originalLAB.b);
    var lab = Caman.xyz_to_lab(xyz.x, xyz.y, xyz.z);

    var testColorStr = '{l: ' + originalLAB.l + ', a: ' + originalLAB.a + ', b: ' + originalLAB.b + '}';
    ok(Math.abs(lab.l - originalLAB.l) < 0.01, "L* value for " + testColorStr);
    ok(Math.abs(lab.a - originalLAB.a) < 0.01, "a* value for " + testColorStr);
    ok(Math.abs(lab.b - originalLAB.b) < 0.01, "b* value for " + testColorStr);
  }
});