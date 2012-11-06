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

// For some reason, Buster doesn't quit when you define two
// different testing groups. Fairly certain this is a bug with
// the testing framework.
// config["Node tests"] = {
//   rootPath: "../",
//   environment: "node",
//   extensions: [require("buster-coffee")],
//   tests: ["test/node/*.coffee"]
// };