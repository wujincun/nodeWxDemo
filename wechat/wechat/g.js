'use strict'
var sha1 = require('sha1');
var WechatApi = require('./wechatApi.js');
var getRawBody = require("raw-body");

/*这个中间件是处理事件，推送数据等，用来返回信息*/
module.exports = function(opts) {
	//var Wechat = new WechatApi(opts);
	return async(ctx, next) => {
		//await next(); //什么意思,指Wechat？
		var query = ctx.request.query;
		var method = ctx.request.method;
		var response = ctx.response;
		var token = opts.token;
		var signature = query.signature;
		var nonce = query.nonce;
		var timestamp = query.timestamp;
		var echostr = query.echostr;
		var str = [token, timestamp, nonce].sort().join('');
		var sha = sha1(str);
		if (method == 'GET') {
			if (sha === signature) {
				response.body = echostr + '';
				console.log('连接成功')
			} else {
				response.body = 'wrong'
			}
		} else if (method == 'POST') {
			if (sha !== signature) {
				response.body = 'wrong'
				return false
			}
			console.log(ctx.request.body.xml)
			response.body = 'post'
		}
	}
}