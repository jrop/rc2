import co = require('co')
import fs = require('fs')
import glob = require('glob')
import os = require('os')
import path = require('path')
import thunk = require('thunk-to-promise')
import _merge = require('lodash.merge')

import {Loader, Loaders} from './loaders'

function args(argv) {
	const minimist = require('minimist')
	return minimist(argv)
}

function env(appName: string, env: any) {
	const flat = require('flat')
	const prefix = `${appName}_`
	const flatConfig = Object.assign({}, ...Object.keys(env)
		.filter(key => key.startsWith(prefix))
		.map(key => ({[key.substring(prefix.length)]: env[key]})))
	return flat.unflatten(flatConfig, {delimiter: '__'})
}

async function isDir(f: string) {
	try {
		const stat: fs.Stats = await thunk(done => fs.stat(f, done))
		return stat.isDirectory()
	} catch (e) {
		return false
	}
}

async function globAll(globs: string[], cwd: string): Promise<string[]> {
	const nested: string[][] = await Promise.all(globs.map(g => thunk(done => glob(g, {cwd}, done))))
	const files = []
	for (const inner of nested) files.push(...inner)
	return files
}

async function findIn(appName: string, cwd: string): Promise<string[]> {
	const matches = (await globAll([
			`.${appName}rc`,
			`.${appName}rc.*`,
			`.${appName}/config`,
			`.${appName}/config.*`,
			`.config/${appName}`,
			`.config/${appName}.*`,
			`.config/${appName}/config`,
			`.config/${appName}/config.*`,
		], cwd))
		.map(f => path.join(cwd, f))
	const files = await Promise.all(matches.map(async f => {
		if (await isDir(f)) return
		return f
	}))
	return files.filter(f => Boolean(f)) as string[]
}

async function findUp(appName: string, cwd: string): Promise<string[]> {
	const files = []
	let curr = cwd
	while (true) {
		files.push(...await findIn(appName, curr))
		const next = path.dirname(curr)
		if (next == curr) break
		curr = next
	}
	return files
}

export interface Options {
	appName: string
	cwd?: string
	home?: string
	loaders?: Loaders
	argv?: string[]
	env?: any
}
const __export__: any = async function rc2(options: Options) {
	options = Object.assign({
		cwd: process.cwd(),
		home: os.homedir(),
		loaders: new Loaders(),
		argv: process.argv.slice(2),
		env: process.env,
	}, options)
	const rcFiles = [
		...await findIn(options.appName, path.join(options.home)),
		...await findIn(options.appName, '/etc'),
		...(await findUp(options.appName, options.cwd)).reverse(),
	]
	const rcs = await Promise.all(rcFiles.map(f => options.loaders.load(options.appName, f)))
	return _merge({},
		...rcs,
		env(options.appName, options.env),
		args(options.argv))
}
__export__.loaders = () => new Loaders()
export default __export__ as {
	(options: Options): Promise<any>
	loaders: () => Loaders
}
