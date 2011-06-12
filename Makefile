TESTS := \
	tests/test-cidr.js \
	tests/test-bitbuffer.js \
	tests/test-valve.js \
	tests/test-swiz.js

PATH := ./node_modules/.bin:$(PATH)

WHISKEY := $(shell bash -c 'PATH=$(PATH) type -p whiskey')

export NODE_PATH = /Users/chip/work/ck/node-swiz/lib/

default: test

test:
	${WHISKEY}  --scope-leaks --print-stdout --print-stderr --tests "${TESTS}"

coverage:
	${WHISKEY}  --scope-leaks --print-stdout --print-stderr  --coverage  --coverage-reporter html --coverage-dir coverage_html --tests "${TESTS}"

.PHONY: default test coverage
