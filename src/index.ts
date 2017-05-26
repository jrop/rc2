import co = require('co')
import fs = require('fs')
import mm = require('micromatch')
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

async function exists(f: string) {
	try {
		await thunk(done => fs.lstat(f, done))
		return true
	} catch (e) {
		return false
	}
}

async function readdir(d: string) {
	let files: string[] = await thunk(done => fs.readdir(d, done))
	return await Promise.all(files.map(async (f): Promise<string> => {
		const stat: fs.Stats = await thunk(done => fs.lstat(path.join(d, f), done))
		return path.join(d, stat.isDirectory() ? `${f}/`: f)
	}))
}

async function findUp(appName: string, cwd: string): Promise<string[]> {
	const files = []
	let curr = cwd
	while (true) {
		const listing: string[] = mm(
			await readdir(curr),
			[`**/.${appName}rc`, `**/.${appName}rc.*`])
		files.push(...listing)

		const next = path.dirname(curr)
		if (next == curr) break
		curr = next
	}
	return files
}

async function tryLoad(appName: string, f: string, loaders: Loaders): Promise<any> {
	if (await exists(f))
		return await loaders.load(appName, f)
}

export default async function rc2(options: {
	appName: string,
	cwd?: string,
	home?: string,
	loaders?: Loaders,
	argv?: string[],
	env?: any,
}) {
	options = Object.assign({
		cwd: process.cwd(),
		home: os.homedir(),
		loaders: new Loaders(),
		argv: process.argv.slice(2),
		env: process.env,
	}, options)
	let rcs = await findUp(options.appName, options.cwd)
	rcs = await Promise.all(rcs.map(f => options.loaders.load(options.appName, f)))
	return _merge({},
		await tryLoad(options.appName, `${options.home}/.${options.appName}rc`, options.loaders),
		await tryLoad(options.appName, `${options.home}/.${options.appName}/config`, options.loaders),
		await tryLoad(options.appName, `${options.home}/.config/${options.appName}`, options.loaders),
		await tryLoad(options.appName, `${options.home}/.config/${options.appName}/config`, options.loaders),
		await tryLoad(options.appName, `/etc/${options.appName}rc`, options.loaders),
		await tryLoad(options.appName, `/etc/${options.appName}/config`, options.loaders),
		...rcs.reverse(),
		env(options.appName, options.env),
		args(options.argv))
}
export function loaders() {
	return new Loaders()
}
