import co = require('co')
import fs = require('fs')
import path = require('path')
import thunk = require('thunk-to-promise')

async function read(f) {
	return thunk(done => fs.readFile(f, 'utf-8', done))
}

export type Loader = (f: string) => any
export class Loaders {
	loaders: Map<string, Loader>
	
	constructor() {
		this.loaders = new Map()
	}

	async load(appName: string, f: string) {
		let ext = path.parse(f).ext.replace(/^\./, '')
		ext = (ext == `${appName}rc` || ext == '') ? 'default' : ext
		if (!this.loaders.has(ext))
			throw new Error(`No loader found for '${f}'`)
		const loader: Loader = this.loaders.get(ext).bind(this)
		return await co.wrap(loader)(f)
	}

	add(ext: string, loader: Loader) {
		this.loaders.set(ext, loader)
		return this
	}

	default(ext: string) {
		this.add('default', f => this.loaders.get(ext)(f))
		return this
	}

	ini() {
		const I = require('ini')
		this.add('ini', async f => I.parse(await read(f)))
		return this
	}
	js() {
		this.add('js', f => require(f))
		return this
	}
	json() {
		try {
			const json5 = require('json5')
			this.add('json', async f => json5.parse(await read(f)))
			this.add('json5', async f => json5.parse(await read(f)))
		} catch (e) {
			this.add('json', async f => JSON.parse(await read(f)))
		}
		return this
	}
	yaml() {
		const Y = require('js-yaml')
		this.add('yml',  async f => Y.safeLoad(await read(f)))
		this.add('yaml', async f => Y.safeLoad(await read(f)))
		return this
	}
}
