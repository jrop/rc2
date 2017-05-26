import fs = require('fs')
import rc2, {loaders} from '../src'
import thunk = require('thunk-to-promise')
import yaml = require('js-yaml')

test('rc2', async () => {
	expect.assertions(1)
	const config = await rc2({
		appName: 'test',
		cwd: `${__dirname}/fixtures/a/b/c`,
		loaders: loaders()
			.default('json')
			.js()
			.json()
			.yaml(),
		argv: ['--some.argv', 'argv'],
		env: {
			test_some__env: 'env',
		},
	})
	expect(config).toEqual({
		_: [],
		js: 'js',
		json: 'json',
		yml: 'yml',
		some: {
			argv: 'argv',
			env: 'env',
		},
	})
})
