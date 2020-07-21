var list = ["test"];
// 配置
var settings = {
  normal: true,
  inner: true
};
// 运行结果
var result = {
	normal: 0,
	inner: 0
};
// 添加key
function addKey(key) {
	if (key == '') {
		return 1;
	} else if (list.includes(key)) {
		return 2;
	}
	list.push(key);
	return 0;
}
// 删除key
function removeKey(key) {
	var i = list.indexOf(key);
	list.splice(i, 1);
	return 0;
}
// 存储key
function save() {
  chrome.storage.sync.set({ li: list, sett: settings }, function () {
		console.log("a save ", list, settings);
	});
}
// 第一次存储
chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.sync.set({ li: list, sett: settings }, function () {
		console.log("default save ", list, settings);
	});
});
// 接受来自content的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log('收到来自content的消息：');
	// 获取关键词列表和设置信息
	if (request.type=='get') {
		sendResponse({ list:list, settings:settings});
		console.log(list);
	// 记录屏蔽次数
	} else if (request.type == 'set') {
		result = request.value;
	}
	console.log(request);
});
// 每次启动时加载屏蔽词列表
chrome.storage.sync.get('li', function (data) {
	if (data.li) {
		list = data.li;
	}
	console.log("read", data);
});
// 每次启动时加载设置
chrome.storage.sync.get('sett', function (data) {
	if (data.sett) {
		settings = data.sett;
	}
})