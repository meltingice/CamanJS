test("Caman is a function", function () {
  expect(1);
  
  
  ok(Caman, "Caman exists");



});


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