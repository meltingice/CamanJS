var Caman = require('./dist/caman.full.js').Caman;

var test = Caman("./examples/images/test5.png", function () {
	this.hazyDays();
	this.render(function () {
		this.save("./output/test1_rendered.png", true);
	});
});