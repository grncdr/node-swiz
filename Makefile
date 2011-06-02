TESTS := \
	tests/test-cidr.js \
	tests/test-bitbuffer.js \
	tests/test-valve.js \
	tests/test-swiz.js

# Hint: Prepend './node_modules/.bin' to your PATH if Whiskey is installed locally
WHISKEY := $(shell bash -c 'type -p whiskey')

export NODE_PATH = lib/

default: test

test:
	${WHISKEY} --print-stdout --print-stderr --tests "${TESTS}"

.PHONY: default test
