var config = module.exports;

config["Browser tests"] = {
  rootPath: "../",
  environment: "browser",
  extensions: [require("buster-coffee")],
  sources: [
    "test/ext/*.js",
    "dist/caman.full.js"
  ],
  tests: ["test/browser/*.coffee"]
};

config["Node tests"] = {
  rootPath: "../",
  environment: "node",
  extensions: [require("buster-coffee")],
  tests: ["test/node/*.coffee"]
};