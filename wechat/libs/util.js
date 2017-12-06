'use strict'
var fs = require('fs');
var Promise = require('bluebird');
exports.readFileAsync = function(path, encoding) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, encoding, function(err, content) {
			err ? reject(err) : resolve(content)
		})
	})
}
exports.writeFileAsync = function(path, encoding) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(path, encoding, function(err, content) {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
}