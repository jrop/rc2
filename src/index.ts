import fs = require('fs')
import os = require('os')
import path = require('path')

import {co, flat, glob, minimist, thunk, _merge} from './vendor'
import {Loader, Loaders} from './loaders'

function flatten(a: any[]) {
	const res = []
	a.forEach(i => Array.isArray(i) ? res.push(...flatten(i)) : res.push(i))
	return res
}

function args(argv) {
	return minimist(argv)
}

function env(appName: string, env: any) {
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

function isSubdir(top: string, f: string) {
	if (!top) return true
	const rel = path.relative(path.resolve(f), path.resolve(top))
	return rel == '' || rel.includes('..')
}

async function globAll(globs: string[], cwd: string): Promise<string[]> {
	const nested: string[][] = await Promise.all(globs.map(g => thunk(done => glob(g, {cwd}, done))))
	const files = []
	for (const inner of nested) files.push(...inner)
	return files
}

async function findIn(options: Options, cwd: string): Promise<string[]> {
	const {name} = options
	const matches = (await globAll([
			`.${name}rc`,
			`.${name}rc.*`,
			`.${name}/config`,
			`.${name}/config.*`,
			`.config/${name}`,
			`.config/${name}.*`,
			`.config/${name}/config`,
			`.config/${name}/config.*`,
		], cwd))
		.map(f => path.join(cwd, f))
	const files = await Promise.all(matches.map(async f => {
		if (await isDir(f)) return
		return f
	}))
	return files.filter(f => Boolean(f)) as string[]
}

async function findUp(options: Options, loc: SearchLocation): Promise<string[]> {
	const files = []
	let curr = loc.bottom
	while (isSubdir(loc.top, curr)) {
		files.push(...await findIn(options, curr))
		const next = path.dirname(curr)
		if (next == curr) break
		curr = next
	}
	return files
}

export interface SearchLocation {
	top?: string
	bottom: string
}
export interface Options {
	name: string
	locations?: SearchLocation[]
	loaders?: Loaders
	default?: any
	argv?: string[]
	env?: any
}
const __export__: any = async function rc2(options: Options) {
	options = _merge({
		locations: [],
		loaders: new Loaders(),
		argv: process.argv.slice(2),
		env: process.env,
	}, options)
	const rcFiles = flatten(await Promise.all(options.locations.map(loc => findUp(options, loc)))) as string[]
	const rcs = await Promise.all(rcFiles.map(f => options.loaders.load(options.name, f)))
	return _merge({},
		options.default,
		...rcs.reverse(),
		env(options.name, options.env),
		args(options.argv))
}
__export__.loaders = () => new Loaders()
export default __export__ as {
	(options: Options): Promise<any>
	loaders: () => Loaders
}
