'use strict'

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
var api = {
		accessToken: prefix + 'token?grant_type=client_credential',
		//素材
		temporary: {
			upload: prefix + 'media/upload?',
			fetch: prefix + 'media/get?',
		},
		permanent: {
			upload: prefix + 'material/add_material?',
			uploadNews: prefix + 'material/add_news?',
			uploadNewsPic: prefix + 'media/uploadimg?',
			fetch: prefix + 'material/get_material?',
			del: prefix + 'material/del_material?',
			update: prefix + 'material/update_news?',
			count: prefix + 'material/get_materialcount?',
			batch: prefix + 'material/batchget_material?',
		},
		//用户标签
		group: {
			creatTag: prefix + 'tags/create?',
			fetchTag: prefix + 'tags/get?',
			updateTag: prefix + 'tags/update?',
			delTag: prefix + 'tags/delete?',
			getUsersList: prefix + 'user/tag/get?', //获取标签下粉丝列表
			tagMass: prefix + 'tags/members/batchtagging?', //批量为用户打标签
			unTagMass: prefix + 'tags/members/batchuntagging?', //批量为用户取消标签
			getTagsList: prefix + 'tags/getidlist?', //获取用户身上的标签列表
		},
		//获取用户信息
		user: {
			remark: prefix + 'user/info/updateremark?',
			fetchInfo: prefix + 'user/info?',
			batchInfo: prefix + 'user/info/batchget?',
			list: prefix + 'get?',
		},
		//群发消息
		mess: {
			sendByTag: prefix + 'message/mass/sendall?',
			sendByOpenId: prefix + '',
			del: prefix + '',
			preview: prefix + '',
			check: prefix + '',
		},
		//自定义菜单
		menu: {
			create: prefix + 'menu/create?',
			fetch: prefix + 'menu/get?',
			del: prefix + 'menu/delete?',
			currentConfig: prefix + 'get_current_selfmenu_info?',
		},
		//账号管理（二维码）
		qrcode: {
			create: prefix + '',
			show: mpPrefix + ''
		},
		//sdk ticket
		ticket:{
			get:prefix + 'ticket/getticket?'
		}
	}
	/*管理和微信交互的接口和票据的更新，存储*/
function Wechat(opts) {
	var that = this;
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.getTicket = opts.getTicket;
	this.saveTicket = opts.saveTicket;
	this.fetchAccessTocken();
}
Wechat.prototype.fetchAccessTocken = function() {
	var that = this;
	/*if (this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this)
		}
	}*/
	return this.getAccessToken()
		.then(function(data) {
			/*console.log('getAccessToken')
			console.log(data)*/
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
			/*console.log('saveAccessToken')
			console.log(data)*/
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
//params:material:如果是图文传进数组，如果是图片，则是图片路径
Wechat.prototype.uploadMaterial = function(type, material, permanent) {
		console.log(permanent)
		var that = this;
		var form = {};
		var uploadUrl = api.temporary.upload;
		if (permanent) {
			uploadUrl = api.permanent.upload;
			Object.assign({}, form, permanent)
				//_.extend(form, permanent) //???
		}
		if (type === 'pic') {
			uploadUrl = api.permanent.uploadNewsPic;
		}
		if (type === 'news') {
			uploadUrl = api.permanent.uploadNews;
			form = material;
		} else {
			form.media = fs.createReadStream(material)
		}

		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = uploadUrl + 'access_token=' + data.access_token;
					if (!permanent) {
						url += '&type=' + type;
					} else {
						//不清楚access_token是路径里的还是与media一样的参数
						form.access_token = data.access_token
					}
					var options = {
						method: 'POST',
						url: url,
						json: true
					};
					if (type === 'news') {
						options.body = form;
					} else {
						options.formData = form
					}
					request(options).then(function(response) {
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
	//获取素材??
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
		var that = this;

		var fetchUrl = api.temporary.fetch;
		if (permanent) {
			fetchUrl = api.permanent.fetch
		}
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = fetchUrl + 'access_token=' + data.access_token;
					var form = {};
					var options = {
						method: 'POST',
						url: url,
						json: truek
					}
					if (permanent) {
						form.media_id = mediaId;
						form.access_token = data.access_token
						options.body = form;
					} else {
						if (type === 'video') {
							url = url.replace('https://', 'http://');
						}
						url += '&media_id' + mediaId
					}
					if (type === 'news' || type === 'video') {
						request(options).then(function(response) {
							var _data = response.body;
							if (_data) {
								console.log(_data)
							} else {
								throw new Error('uload material fails')
							}
						}).catch(function(err) {
							reject(err)
						})
					} else {
						resolve(url)
					}
				})
		})
	}
	//删除素材??
Wechat.prototype.deleteMaterial = function(mediaId) {
		var that = this;
		var form = {
			media_id: mediaId
		};
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;
					request({
						method: 'POST',
						url: url,
						body: form,
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
	//更新素材???
Wechat.prototype.updateMaterial = function(mediaId, news) {
	var that = this;
	var form = {
		media_id: mediaId
	};
	Object.assign({}, form, news);
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;
				request({
					method: 'POST',
					url: url,
					body: form,
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
Wechat.prototype.creatTag = function(name) {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.group.creatTag + 'access_token=' + data.access_token;
				var options = {
					"tag": {
						"name": name //标签名
					}
				}
				request({
					method: 'POST',
					url: url,
					body: options,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('creatTag material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.fetchTags = function() {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.group.fetchTag + 'access_token=' + data.access_token;
				request({
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('fetchTag material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.updateTag = function(id, name) {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.group.updateTag + 'access_token=' + data.access_token + '&media_id=' + mediaId;
				var options = {
					tag: {
						id: id,
						name: name
					}
				}
				request({
					method: 'POST',
					url: url,
					body: options,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('updateTag material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.delTag = function(id) {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.group.delTag + 'access_token=' + data.access_token + '&media_id=' + mediaId;
				var options = {
					tag: {
						id: id,
					}
				}
				request({
					method: 'POST',
					url: url,
					body: options,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('delTag material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.getTagsList = function(openid) {
		var that = this;
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = api.group.getTagsList + 'access_token=' + data.access_token;
					var options = {
						openid: openid
					}
					request({
						method: 'POST',
						url: url,
						body: options,
						json: true
					}).then(function(response) {
						var _data = response.body;
						if (_data) {
							resolve(_data)
						} else {
							throw new Error('getTagsList material fails')
						}
					}).catch(function(err) {
						reject(err)
					})
				})
		})
	}
	//获取用户信息
Wechat.prototype.remarkUser = function(openid, remark) {
		var that = this;
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = api.user.remark + 'access_token=' + data.access_token;
					var options = {
						openid: openid,
						remark: remark
					}
					request({
						method: 'POST',
						url: url,
						body: options,
						json: true
					}).then(function(response) {
						var _data = response.body;
						if (_data) {
							resolve(_data)
						} else {
							throw new Error('remarkUser material fails')
						}
					}).catch(function(err) {
						reject(err)
					})
				})
		})
	}
	//单个和批量获取用户信息可以合并
Wechat.prototype.fetchInfo = function(openid, lang) {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.user.fetchInfo + 'access_token=' + data.access_token + '&openid=' + openid + '&lang=' + lang;
				request({
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('fetchInfo material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.batchInfo = function(openids) {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.user.fetchInfoList + 'access_token=' + data.access_token;
				var options = {
					user_list: openids
				}
				request({
					method: 'POST',
					url: url,
					body: options,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('fetchInfoList material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.listUsers = function(openid) {
		var that = this;
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = api.user.list + 'access_token=' + data.access_token;
					if (openid) {
						url += '&next_openid=' + openid;
					}
					request({
						url: url,
						json: true
					}).then(function(response) {
						var _data = response.body;
						if (_data) {
							resolve(_data)
						} else {
							throw new Error('fetchInfoList material fails')
						}
					}).catch(function(err) {
						reject(err)
					})
				})
		})
	}
	//根据文档编写？？？
Wechat.prototype.sendByTag = function(type, message, groupId, send_ignore_reprintsendIgnoreReprint) {
	var that = this;
	var msg = {
		filter: {},
		msgtype: type,
		//send_ignore_reprint:sendIgnoreReprint,
	}
	msg[type] = message;
	if (!groupId) {
		msg.filter.is_to_all = true;
	} else {
		msg.filter = {
			is_to_all: false,
			group_id: groupId
		};
	};
	//注意，新的文档图文需要
	if (type === 'mpnews') {
		msg.send_ignore_reprint = sendIgnoreReprint || 0;
	};

	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.mess.sendByTag + 'access_token=' + data.access_token;
				if (openid) {
					url += '&next_openid=' + openid;
				}
				request({
					method: 'POST',
					body: msg,
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('sendByTag material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.createMenu = function(menu) {
		var that = this;
		return new Promise((resolve, reject) => {
			that
				.fetchAccessTocken()
				.then(function(data) {
					var url = api.menu.create + 'access_token=' + data.access_token;
					request({
						method: 'POST',
						body: menu,
						url: url,
						json: true
					}).then(function(response) {
						var _data = response.body;
						if (_data) {
							resolve(_data)
						} else {
							throw new Error('createMenu  fails')
						}
					}).catch(function(err) {
						reject(err)
					})
				})
		})
	}
	//获取菜单
Wechat.prototype.fetchMenu = function() {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.menu.fetch + 'access_token=' + data.access_token;
				request({
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('fetchMenu  fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.delMenu = function() {
	var that = this;
	//console.log('delMenu')
	return new Promise((resolve, reject) => {
		//console.log('promise')
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.menu.del + 'access_token=' + data.access_token;
				request({
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('delMenu  fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}
Wechat.prototype.getCurrentMenu = function() {
	var that = this;
	return new Promise((resolve, reject) => {
		that
			.fetchAccessTocken()
			.then(function(data) {
				var url = api.menu.currentConfig + 'access_token=' + data.access_token;
				request({
					url: url,
					json: true
				}).then(function(response) {
					var _data = response.body;
					if (_data) {
						resolve(_data)
					} else {
						throw new Error('getCurrentMenu  fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			})
	})
}

//微信sdk获取ticket
Wechat.prototype.fetchTicket = function(access_token) {
	var that = this;
	
	return this.getTicket()
		.then(function(data) {
			/*console.log('getAccessToken')
			console.log(data)*/
			try {
				data = JSON.parse(data)
			} catch (e) {
				return that.updateTicket(access_token)
			}
			if (that.isValidTicket(data)) {
				return Promise.resolve(data)
			} else {
				return that.updateTicket(access_token)
			}
		})
		.then(function(data) {
			/*console.log('saveAccessToken')
			console.log(data)*/
			that.saveTicket(data);
			return Promise.resolve(data);
		})
}
Wechat.prototype.updateTicket = function(access_token) {
	var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi' ;
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
Wechat.prototype.isValidTicket = function(data) {
	if (!data || !data.ticket || !data.expires_in) {
		return false
	}
	var ticket = data.ticket;
	var expires_in = data.expires_in;
	var now = Date.now();
	return (ticket && now < expires_in) ? true : false;
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