import fs = require('fs')
import rc2 from '../src'
import thunk = require('thunk-to-promise')
import yaml = require('js-yaml')

const loaders = rc2.loaders()
	.default('json')
	.js()
	.json()
	.yaml()

test('rc2 (.testrc)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{bottom: `${__dirname}/fixtures/.testrc`}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		'.testrc': true,
		yml: true,
	})
})

test('rc2 (.test/config)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{bottom: `${__dirname}/fixtures/.test-config`}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		'.test-config': true,
		yml: true,
	})
})

test('rc2 (.config/test)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{bottom: `${__dirname}/fixtures/.config-test`}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		'.config-test': true,
	})
})

test('rc2 (.config/test/config)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{bottom: `${__dirname}/fixtures/.config-test-config`}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		'.config-test-config': true,
		yml: true,
	})
})

test('rc2 (nested)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{bottom: `${__dirname}/fixtures/nested/sub`}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		outer: true,
		inner: true,
	})
})

test('rc2 (nested w/top)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{
			bottom: `${__dirname}/fixtures/nested/sub`,
			top: `${__dirname}/fixtures/nested/sub`,
		}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		inner: true,
	})
})

test('rc2 (nested-priority)', async () => {
	expect.assertions(1)
	const config = await rc2({
		name: 'test',
		locations: [{
			bottom: `${__dirname}/fixtures/nested-priority/sub`,
		}],
		loaders,
		argv: [],
		env: {},
	})
	expect(config).toEqual({
		_: [],
		config: {
			outer: true,
			inner: true,
		},
	})
})
