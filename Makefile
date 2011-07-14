all:
	node Makefile.js

pack: all
	packer -b -s -i dist/caman.js -o dist/caman.pack.js
	packer -b -s -i dist/caman.full.js -o dist/caman.full.pack.js
	
docs: all
	docco src/*.js

clean:
	rm -f dist/*
