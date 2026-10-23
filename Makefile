EXTENSIONS := tab-auto-closer

.PHONY: test package
test:
	npm test

# Zips each extension for upload to the Chrome Web Store.
package: $(EXTENSIONS:%=dist/%.zip)

dist/%.zip: FORCE
	mkdir -p dist
	rm -f $@
	cd $* && zip -qr ../$@ . -x '.*'

.PHONY: FORCE
FORCE:
