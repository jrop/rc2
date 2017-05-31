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
		appName: 'test',
		cwd: `${__dirname}/fixtures/.testrc`,
		home: `${__dirname}/fixtures/empty`,
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
		appName: 'test',
		cwd: `${__dirname}/fixtures/empty`,
		home: `${__dirname}/fixtures/.test-config`,
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
		appName: 'test',
		cwd: `${__dirname}/fixtures/empty`,
		home: `${__dirname}/fixtures/.config-test`,
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
		appName: 'test',
		cwd: `${__dirname}/fixtures/empty`,
		home: `${__dirname}/fixtures/.config-test-config`,
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
