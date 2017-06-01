module.exports = {
	entry: './src/vendor.ts',
	devtool: '#source-map',
	output: {
		path: `${__dirname}/lib`,
		filename: 'vendor.js',
		libraryTarget: 'commonjs',
	},
	module: {rules: [{
		test: /\.ts/,
		loader: 'awesome-typescript-loader',
	}]},
	target: 'node',
}
