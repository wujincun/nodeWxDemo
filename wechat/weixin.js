'use strict'
var config = require('./config');
var WechatApi = require('./wechat/wechatApi.js');
var wechatApi = new WechatApi(config.wechat);
exports.reply = async(ctx, next) => {
	var message = ctx.weixin;
	var response = ctx.response;
	//事件
	if (message.MsgType === 'event') {
		if (message.Event === 'subscribe') {
			if (message.eventKey) {
				consoel.log('扫描二维码进来' + message.EventKey + '' + message.ticket)
			}
			response.body = 'haha,你订阅了这个号\r\n' + '消息id：' + message.MsgId;
		} else if (message.Event === 'unsubscribe') {
			console.log('无情取关');
			response.body = '';
		} else if (message.Event === 'LOCATION') {
			response.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-' + message.Precition;
		} else if (message.Event === 'CLICK') { //点击弹出子菜单不会上报
			response.body = '您点击了菜单：' + message.EventKey;
		} else if (message.Event === 'SCAN') {
			console.log('扫描后关注二维码' + message.EventKey + '' + message.Ticket);
			response.body = '看到你扫一下哦'
		} else if (message.Event === 'VIEW') {
			response.body = '您点击了菜单中的链接：' + message.EventKey; //eventKey菜单url地址
		}
		//文本	
	} else if (message.MsgType === 'text') {
		var content = message.Content;
		var reply = '额，你说的' + content + '太复杂了';
		if (content === '1') {
			reply = '天下第一'
		} else if (content === '2') {
			reply = '天下第二'
		} else if (content === '3') {
			reply = '天下第三'
		} else if (content === '4') { //图文
			reply = [{
				title: '技术改变世界',
				description: '只是个描述',
				picurl: 'http://res.cloudinary.com/moveha/image/upload/v1441184110/assets/images/Mask-min.png',
				url: 'https://github.com/'
			}, {
				title: 'node 开发微信',
				description: '厉害',
				picurl: 'http://res.cloudinary.com/moveha/image/upload/v1431337192/index-img2_fvzeow.png',
				url: 'https://nodejs.org/'
			}]
		} else if (content === '5') { //图片
			var data = await wechatApi.uploadMaterial('image', __dirname + '/2.jpg');
			reply = {
				type: 'image',
				mediaId: data.media_id,
			}
		} else if (content === '6') { //视频
			var data = await wechatApi.uploadMaterial('video', __dirname + '/6.mp4');
			reply = {
				type: 'video',
				title: '回复视频',
				description: '这是我的桌子',
				mediaId: data.media_id,
			}
		} else if (content === '7') { //音乐
			var data = await wechatApi.uploadMaterial('image', __dirname + '/2.jpg');
			reply = {
				type: 'music',
				title: '回复音乐',
				description: '放松一下',
				musicUrl: 'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
				thumbMediaId: data.media_id,
			}
		}
		response.body = reply;
	}
	await next()
}