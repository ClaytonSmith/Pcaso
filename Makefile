#BROWSERIFY := node_modules/.bin/browserify
ESLINT := node_modules/.bin/eslint
MOCHA := node_modules/.bin/mocha

SRC = $(shell find app/ -name "*.js" -type f | sort)
SUPPORT = $(wildcard support/*.js)

lint:
	@$(ESLINT) $(SRC)

test: test-all

test-all: | lint unit-test system-test

system-test: | integration-test

unit-test: 
	@${MOCHA} \
	  --growl \
	  tests/server/unit/controller.js



integration-test: 
	@${MOCHA} \
	  --growl \
	  tests/server/system/integration/controller.js

.PHONY: test
