var Root;

if (typeof exports !== "undefined" && exports !== null) {
  Root = module.exports;
} else {
  Root = window;
}

Root.greyPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAP7+/v///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
Root.getGreyImage = function (id) {
  var img = document.createElement('img');
  if (id) img.id = id;
  img.src = greyPixel;
  return img;
};