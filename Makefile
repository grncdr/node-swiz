TESTS := \
	tests/test-cidr.js \
	tests/test-bitbuffer.js \
	tests/test-valve.js \
	tests/test-swiz.js



PATH := ./node_modules/.bin:$(PATH)

WHISKEY := $(shell bash -c 'PATH=$(PATH) type -p whiskey')

default: test

test:
	NODE_PATH=`pwd`/lib/ ${WHISKEY} --sequential --scope-leaks --real-time --tests "${TESTS}"

tap:
	NODE_PATH=`pwd`/lib/ ${WHISKEY} --test-reporter tap --scope-leaks --sequential --real-time --tests "${TESTS}"

coverage:
	NODE_PATH=`pwd`/lib/ ${WHISKEY} --sequential --coverage  --coverage-reporter html --coverage-dir coverage_html --tests "${TESTS}"

.PHONY: default test coverage tap scope
