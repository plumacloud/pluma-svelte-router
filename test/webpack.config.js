const path = require('path')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


const PRODUCTION = process.env.NODE_ENV === 'production';
const DEV = !PRODUCTION;

module.exports = {
	mode: PRODUCTION ? 'production' : 'development',
	entry: './main.js',
	output: {
		filename: 'build.js',
		publicPath: '/'
	},
	resolve: {
		extensions: ['.mjs', '.js', '.svelte'],
		mainFields: ['svelte', 'browser', 'module', 'main'],
		alias: {
			svelte: path.resolve('../node_modules', 'svelte')
		}
	},
	module: {
		rules: [
			{
				test: /\.svelte$/,
				exclude: /node_modules/,
				use: 'svelte-loader'
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader'
				]
			},
			{
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false
				}
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: '[name].css'
		}),
		new HtmlWebpackPlugin({
			publicPath: '/',
			inject: true,
			hash: false,
			template: './index.html',
			filename: 'index.html',
		})
	],
	devServer: {
		host: '0.0.0.0',
		historyApiFallback: true,
		hot: false
	}
};