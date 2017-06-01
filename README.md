# rc2

A follow-up to [rc](https://github.com/dominictarr/rc) that is more configurable.

*More configure!  Such less bloat!*

## Features

* Fully asynchronous: no synchronous I/O in the module
* Looks only in locations/ranges of directories which you tell it to
* Loaders are **fully** configurable
* Zero-dependencies (all bundled)

## Example

```ts
import rc2 from 'rc2'
async function main() {
	const loaders = rc2.loaders()
		.default(['ini', 'json', 'js', 'yaml'])
		.ini()  // must have the `ini` module installed
		.json() // uses `json5` module, if installed, otherwise uses `JSON.parse(...)`
		.js()   // uses `require(...)`
		.yaml() // must have the `js-yaml` module installed
	const config = await rc2({
		name: 'myapp', // will look for '.myapprc' files
		locations: [{bottom: __dirname}],
		loaders,
	})
}
main().catch(e => {
	process.exitCode = 1
	console.error(e)
})
```
## API

* `rc2(options) => Promise<any>`
* `rc2.loaders() => Loaders`

`rc2(...)` will only look in the locations you specify (see options below) for rc files.  In each directory, it searches the following globs:

* `.${name}rc`
* `.${name}rc.*`
* `.${name}/config`
* `.${name}/config.*`
* `.config/${name}`
* `.config/${name}.*`
* `.config/${name}/config`
* `.config/${name}/config.*`
* Environment variables (`${name}_some__property`)
* CLI args (parsed by minimist)

### Options

```ts
export interface Options {
	name: string            // the name of the app
	locations?: {           // locations to search for rc files
		top?: string          // if specified, denotes the "top" directory at which to stop looking
		bottom: string        // the start directory at which to start looking for rc files
	}[]
	loaders?: Loaders       // an instance created with `rc2.loaders()`
	default?: any           // default configuration if none are found
	argv?: string[]
	env?: any
}
```

### Loaders

A loader instance can be created with `rc2.loaders()`.  This instance has the following methods:

```ts
declare class Loaders {
	add(ext: string, loader: (f: string) => any): this
	default(exts: string[]): this
	ini(): this
	js(): this
	json(): this
	yaml(): this
}
```

#### Example `loaders.add(...)`:

```ts
rc2.loaders()
    .add('xml', f => {
        // Async is handled with `co`, so return
        // any yieldable for this function to be async
        return new Promise(...) // for example
    })
```

For reference, [here is a list of valid `co` yieldables](https://github.com/tj/co#yieldables).
