let ids = ['bili_live', 'bili_douga', 'bili_anime', 'bili_guochuang', 'bili_manga', 'bili_music', 'bili_dance',
  'bili_game', 'bili_technology', 'bili_cheese', 'bili_digital', 'bili_life', 'bili_food', 'bili_animal',
  'bili_kichiku', 'bili_fashion', 'bili_information', 'bili_ent', 'bili_read', 'bili_movie', 'bili_teleplay',
  'bili_cinephile', 'bili_documentary']
let labels = ['直播', '动画', '番剧', '国创', '漫画', '音乐', '舞蹈', '游戏', '知识', '课堂', '数码', '生活', '美食',
	'动物圈', '鬼畜', '时尚', '资讯', '娱乐', '专栏', '电影', 'TV剧', '影视', '纪录片']
function getLabels() {
	return ids
}
// 默认屏蔽列表
let blockList = []
// 默认配置
let settings = {
	modules: {},
	pages: {
		video: true,
		film: true,
		article: true,
		follow_news_abstract: true,
		follow_news_detail: true
	},
	types: {
		main_comment: true,
		sub_comment: true
	}
}
function initModules() {
	for (let i = 0; i < ids.length; i++){
		settings.modules[ids[i]] = true
	}
}
initModules()
function alterSettings(title, key, value) {
	if ((title in settings) && (key in settings[title]) && typeof (value) == 'boolean') {
		settings[title][key] = value
		return true
	}
	return false
}
function getList() {
	return blockList
}
function getSettings() {
	return settings
}
function setList(newList) {
	blockList = newList
}
function setSettings(newSettings) {
	settings = newSettings
}
// 添加屏蔽词
function addKey(key, isReg) {
	if (key === '') {
		return 1;
	} else {
		for (const item of blockList) {
			if (item.text === key && item.isReg === isReg) {
				return 2;
			}
		}
	}
	blockList.push({ text: key, isReg: isReg });
	return 0;
}
// 删除屏蔽词
function removeKey(index) {
	// let i = list.indexOf(key);
	blockList.splice(index, 1);
	return 0;
}
// 保存屏蔽词列表及配置
function save() {
	chrome.storage.sync.set({ list: blockList, settings: settings }, function () {
		console.log("a save ", blockList, settings);
	});
}
// 接受来自content的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log('收到来自content的消息');
	// 获取关键词列表和设置信息
	if (request.type == 'get') {
		sendResponse({ list: blockList, settings: settings });
		console.log(blockList);
	}
});
// 每次启动时加载屏蔽词列表及配置
chrome.storage.sync.get(['list', 'settings'], function (data) {
	settings = data['settings'] || settings
	blockList = data['list'] || blockList
	save()
});
function downloadText(content, filename) {
  let a = document.createElement("a");
  let data_blob = new Blob([content]);
  a.href = window.URL.createObjectURL(data_blob);
  a.download = filename;

  let event = document.createEvent("MouseEvents");
  event.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0,
    false, false, false, false, 0, null);
  a.dispatchEvent(event);
}
function exportList() {
  downloadText(JSON.stringify(blockList), "list.json");
}
function importList(file, callback) {
  let reader = new FileReader();
  reader.readAsText(file, 'utf-8');

	reader.onload = function () {
		blockList = JSON.parse(this.result)
		save()
		if (callback) {
			callback()
		}
  };
}
