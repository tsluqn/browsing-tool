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

class VideoDownloader {
	constructor() {
		this.videoTabMap = new Map();
	}
	/**
	 * 请求二进制数据
	 * @param {string} url url
	 * @param {(data: ArrayBuffer) => void} callback 回调函数
	 */
	requestBinary(url, callback) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(oEvent) {
			callback(xhr.response);
		};
		xhr.send();
	}
	/**
	 * 下载指定的数据
	 * @param {BlobPart[]} binaryDataList 数据
	 * @param {string} filename 文件名
	 */
	downloadBinary(binaryDataList, filename) {
		let blobData = new Blob(binaryDataList);
		let anchor = $('<a></a>');
		anchor.attr({
			'href': window.URL.createObjectURL(blobData),
			'download': filename
		});
		console.log(anchor);
		anchor[0].click();
	}
	/**
	 * 获取m3u8 url
	 * @param {string} rawUrl 原始url
	 * @returns 真实url
	 */
	getM3U8Url(rawUrl) {
		const questPos = rawUrl.indexOf('?');
		let rightPart = '';
		if (questPos > -1) {
			rightPart = rawUrl.substring(questPos + 1);
		}
		if (rightPart.match(/https?:\/\/.*\/.+\.m3u8/)) {
			return rightPart.match(/https?:\/\/.*\/.+\.m3u8/);
		} else {
			return rawUrl;
		}
	}
	/**
	 * 根据m3u8文件获取分片url
	 * @param {string} manifestUrl m3u8文件url
	 * @param {string} videoPieceName 分片文件名
	 * @returns 分片url
	 */
	getPieceUrl(manifestUrl, videoPieceName) {
		const questPos = manifestUrl.indexOf('?');
		let rightPart = '';
		if (questPos > -1) {
			rightPart = manifestUrl.substring(questPos + 1);
		}
		let manifestRelativePath;
		if (rightPart.match(/(https?:\/\/.*\/).+\.m3u8/)) {
			manifestRelativePath = rightPart.match(/(https?:\/\/.*\/).+\.m3u8/)[1];
		} else {
			manifestRelativePath = manifestUrl.match(/(https?:\/\/.*\/).+\.m3u8/)[1];
		}
		if (videoPieceName.startsWith('/')) {
			const rootPath = manifestRelativePath.match(/(https?:\/\/.*?)\//)[1];
			return rootPath + videoPieceName;
		}
		return manifestRelativePath + videoPieceName;
	}
	/**
	 * 根据m3u8文件下载视频
	 * @param {string} fileUrl m3u8文件url
	 * @param {string} filename 保存文件名
	 * @param {(pieceName: string, index: number, length: number) => void} onStep 已下载第index，总length个分片后回调
	 * @param {(isSuccess: boolean) => void} onFinish 完成后回调
	 */
	downloadVideoFromM3U8(fileUrl, filename, onStep, onFinish) {
		$.get(fileUrl, (manifestData) => {
			// get m3u8 manifest file
			const videoPieceList = manifestData.split('\n').filter(line => line.includes('.ts'));
			if (videoPieceList.length === 0) {
				onFinish(false);
				return;
			}
			// request each piece and merge to one file and download
			const dataList = [];
			videoPieceList.forEach((pieceName, index) => {
				requestBinary(getPieceUrl(fileUrl, pieceName), (binaryData) => {
					dataList.push(binaryData);
					if (onStep) {
						onStep(pieceName, dataList.length, videoPieceList.length);
					}
					if (index === videoPieceList.length - 1) {
						downloadBinary(dataList, filename);
						onFinish(true);
					}
				});
			});
		});
	}
	/**
	 * 获取tab下检测到的视频url
	 * @param {number} tabId tabId
	 * @returns 视频url列表
	 */
	getVideoList(tabId) {
		if (!this.videoTabMap.has(tabId)) {
			return [];
		}
		return this.videoTabMap.get(tabId);
	}
	/**
	 * 添加新url
	 * @param {number} tabId tabId
	 * @param {string} videoUrl video url
	 */
	addVideoItem(tabId, videoUrl) {
		if (!this.videoTabMap.has(tabId)) {
			this.videoTabMap.set(tabId, []);
		}
		this.videoTabMap.get(tabId).push(videoUrl);
	}
}

const videoDownloader = new VideoDownloader();

chrome.webRequest.onCompleted.addListener((obj) => {
	if (obj.url.includes("m3u8") && !obj.initiator.includes('chrome-extension')) {
		console.log(obj);
		videoDownloader.addVideoItem(obj.tabId, getM3U8Url(obj.url));
	}
}, { urls: ['<all_urls>'] });
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
