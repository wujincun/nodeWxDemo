'use strict'
var Koa = require('koa');
var Wechat = require('./wechat/g');
var util = require('./libs/util');
var path = require('path');
var wechat_file = path.join(__dirname, './config/wechat.txt')

var config = {
	wechat: {
		appID: 'wx0816f2f332748105',
		appSecret: '5ec6559221dcd28107053df9fe6bbd91',
		token: 'wujincunlearn20171205',
		getAccessToken: function() {
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken: function(data) {
			data = JSON.stringify(data);
			return util.writeFileAsync(wechat_file, data)
		}
	}
}
var app = new Koa();
app.use(Wechat(config.wechat));
app.listen(80);
console.log('app started at port 80');