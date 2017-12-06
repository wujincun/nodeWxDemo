'use strict'
var sha1 = require('sha1');
var WechatApi = require('./wechatApi.js');
/*这个中间件是处理事件，推送数据等，用来返回信息*/
module.exports = function(opts) {
	var Wechat = new WechatApi(opts);

	return async(ctx, next) => {
		await next();
		var query = ctx.request.query;
		var response = ctx.response;
		var token = opts.token;
		var signature = query.signature;
		var nonce = query.nonce;
		var timestamp = query.timestamp;
		var echostr = query.echostr;
		var str = [token, timestamp, nonce].sort().join('');
		var sha = sha1(str);
		console.log(signature)
		console.log(sha)
		if (sha === signature) {
			response.body = echostr + '';
		} else {
			response.body = 'wrong'
		}
	}
}