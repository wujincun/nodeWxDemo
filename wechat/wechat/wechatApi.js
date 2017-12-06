'use strict'
var Promise = require('bluebird');
var request = Promise.promisify(require('request'))
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
		accessToken: prefix + 'token?grant_type=client_credential'
	}
	/*管理和微信交互的接口和票据的更新，存储*/
function WechatApi(opts) {
	var that = this;
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.getAccessToken()
		.then(function(data) {
			try {
				data = JSON.parse(data)
			} catch (e) {
				return that.updateAccessToken(data)
			}
			if (that.isValidAccessToken(data)) {
				return Promise.resolve(data)
			} else {
				return that.updateAccessToken()
			}
		})
		.then(function(data) {
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;
			that.saveAccessToken(data)
		})
}
WechatApi.prototype.isValidAccessToken = function(data) {
	if (!data || !data.access_token || !data.expires_in) {
		return false
	}
	var access_token = data.access_token;
	var expires_in = data.expires_in;
	var now = Date.now();
	return (now < expires_in) ? true : false;
}
WechatApi.prototype.updateAccessToken = function() {
	var appID = this.appID;
	var appSecret = this.appSecret;
	var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
	return new Promise((resolve, reject) => {
		request({
			url: url,
			json: true
		}).then(function(response) {
			var data = response.body;
			var now = Date.now();
			var expires_in = now + (data.expires_in - 20) * 1000;
			data.expires_in = expires_in;
			resolve(data)
		})
	})
}
module.exports = WechatApi;