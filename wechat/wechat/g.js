'use strict'
var sha1 = require('sha1');
var WechatApi = require('./wechatApi.js');
var util = require('./util.js');

/*这个中间件是处理事件，推送数据等，用来返回信息*/
module.exports = function(opts, handler) {
	var wechatApi = new WechatApi(opts);
	return async(ctx, next) => {
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
			var message = util.formatMessage(ctx.request.body.xml)
				/*if (message.MsgType === 'event') {
					if (message.Event === 'subscribe') {
						var now = Date.now();
						response.status = 200;
						response.type = 'application/xml';
						response.body = xml;
						console.log(response);
						return
					}
				}*/
			ctx.weixin = message;
			await handler(ctx, next);
			wechatApi.reply(ctx);
		}
	}
}