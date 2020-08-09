// 默认屏蔽列表
let blockList = []
// 默认配置
let settings = {
	pages: {
		video: true,
		film: true,
		article: true,
		follow_news_abstract: true,
		follow_news_detail: true
	},
	scope: {
		main_comment: true,
		sub_comment: true
	}
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
function importList(file) {
  let reader = new FileReader();
  reader.readAsText(file, 'utf-8');

	reader.onload = function () {
		blockList = JSON.parse(this.result)
		save()
  };
}
