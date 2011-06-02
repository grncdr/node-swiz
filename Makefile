TESTS := \
	tests/test-cidr.js \
	tests/test-bitbuffer.js \
	tests/test-valve.js \
	tests/test-swiz.js

PATH := ./node_modules/.bin:$(PATH)

WHISKEY := $(shell bash -c 'PATH=$(PATH) type -p whiskey')

export NODE_PATH = lib/

default: test

test:
	${WHISKEY} --print-stdout --print-stderr --tests "${TESTS}"

.PHONY: default test
