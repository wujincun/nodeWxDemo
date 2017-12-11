'use strict'
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
		accessToken: prefix + 'token?grant_type=client_credential',
		upload: prefix + 'media/upload?',
	}
	/*管理和微信交互的接口和票据的更新，存储*/
function Wechat(opts) {
	var that = this;
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.fetchAccessTocken()
}
Wechat.prototype.fetchAccessTocken = function() {
	var that = this;
	if (this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this)
		}
	}
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
			that.saveAccessToken(data);
			return Promise.resolve(data);
		})
}
Wechat.prototype.isValidAccessToken = function(data) {
	if (!data || !data.access_token || !data.expires_in) {
		return false
	}
	var access_token = data.access_token;
	var expires_in = data.expires_in;
	var now = Date.now();
	return (now < expires_in) ? true : false;
}
Wechat.prototype.updateAccessToken = function() {
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

//上传素材
Wechat.prototype.uploadMaterial = function(type, filepath) {
	var that = this;
	var form = {
		media: fs.createReadStream(filepath)
	}
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.upload + 'access_token=' + data.access_token + '&type=' + type;
				request({
					method: 'POST',
					url: url,
					formData: form,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('uload material fails')
					}
				}).catch(function(err) {
					reject(err)
				})

			})

	})
}
Wechat.prototype.reply = function(ctx) {
	var message = ctx.weixin;
	var response = ctx.response;
	var content = response.body;
	var xml = util.tpl(content, message);
	response.status = 200;
	response.type = 'application/xml';
	response.body = xml; //跑通，但是公号里未显示
}
module.exports = Wechat;