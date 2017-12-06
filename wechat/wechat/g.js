'use strict'
var sha1 = require('sha1');
const xmlParser = require('koa-xml-body')
var WechatApi = require('./wechatApi.js');

/*这个中间件是处理事件，推送数据等，用来返回信息*/
module.exports = function(opts) {
	//var Wechat = new WechatApi(opts);
	return async(ctx, next) => {
		await next();
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
		console.log(ctx)
		if (method == 'GET') {
			if (sha === signature) {
				response.body = echostr + '';
			} else {
				response.body = 'wrong'
			}
		} else if (method == 'POST') {
			if (sha !== signature) {
				response.body = 'wrong'
				return false
			}
			xmlParser({
				encoding: 'utf8', // lib will detect it from `content-type` 
				xmlOptions: {
					explicitArray: false
				},
				onerror: (err, ctx) => {
					ctx.throw(err.status, err.message);
				}
			});

		}
	}
}