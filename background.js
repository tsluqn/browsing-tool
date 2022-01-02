/**
 * 获取默认配置
 * @returns 默认空配置
 */
function getDefaultSettings() {
	let settings = {
		csdn: {
			enable: true
		},
		baidu: {
			enable: true,
			blockList: []
		},
		bilibili: {
			enable: true,
			comment: {
				enable: true,
				blockList: []
			},
			live: {
				enable: true,
				blockList: []
			},
			component: {
				enable: true,
				componentList: [],
				blockList: []
			}
		},
		videoDownloader: {
			enable: true
		}
	};
	return settings;
}
/**
 * 下载指定的数据
 * @param {BlobPart[]} dataList 数据
 * @param {string} filename 文件名
 */
function downloadData(dataList, filename) {
	let blobData = new Blob(dataList);
	let anchor = $('<a></a>');
	anchor.attr({
		'href': window.URL.createObjectURL(blobData),
		'download': filename
	});
	anchor[0].click();
}

class VideoDownloader {
	constructor() {
		this.videotabsMap = new Map();
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
				this.requestBinary(this.getPieceUrl(fileUrl, pieceName), (binaryData) => {
					dataList.push(binaryData);
					if (onStep) {
						onStep(pieceName, dataList.length, videoPieceList.length);
					}
					if (index === videoPieceList.length - 1) {
						downloadData(dataList, filename);
						onFinish(true);
					}
				});
			});
		});
	}
	/**
	 * 获取tabs下检测到的视频url
	 * @param {number} tabsId tabsId
	 * @returns 视频url列表
	 */
	getVideoList(tabsId) {
		if (!this.videotabsMap.has(tabsId)) {
			return [];
		}
		return this.videotabsMap.get(tabsId);
	}
	/**
	 * 添加新url
	 * @param {number} tabsId tabsId
	 * @param {string} videoUrl video url
	 */
	addVideoItem(tabsId, videoUrl) {
		if (!this.videotabsMap.has(tabsId)) {
			this.videotabsMap.set(tabsId, []);
		}
		this.videotabsMap.get(tabsId).push(videoUrl);
	}
	/**
	 * 清空url
	 * @param {number} tabsId tabsId
	 */
	clearVideoItem(tabsId) {
		if (this.videotabsMap.has(tabsId)) {
			this.videotabsMap.delete(tabsId);
		}
	}
}

const videoDownloader = new VideoDownloader();
let globalSettings = getDefaultSettings();

/**
 * 获取tabs下检测到的视频url
 * @param {number} tabsId tabsId
 * @returns 视频url列表
 */
function getVideoList(tabsId) {
	return videoDownloader.getVideoList(tabsId);
}
/**
 * 根据m3u8文件下载视频
 * @param {string} fileUrl m3u8文件url
 * @param {string} filename 保存文件名
 * @param {(pieceName: string, index: number, length: number) => void} onStep 已下载第index，总length个分片后回调
 * @param {(isSuccess: boolean) => void} onFinish 完成后回调
 */
function downloadVideoFromM3U8(fileUrl, filename, onStep, onFinish) {
	return videoDownloader.downloadVideoFromM3U8(fileUrl, filename, onStep, onFinish);
}

/**
 * 获取设置
 * @param {(result: object) => void} callback 回调
 */
function getSettings(callback) {
	chrome.storage.sync.get(['settings'], result => {
		globalSettings = result['settings'];
		callback(result);
	});
}
/**
 * 保存设置
 * @param {object} settings 设置
 * @param {(result: object) => void} callback 回调
 */
function setSettings(settings, callback = () => { }) {
	chrome.storage.sync.set({ settings }, result => {
		callback(result);
	});
	globalSettings = settings;
}
/**
 * 重置设置
 */
function resetSettings() {
	setSettings(getDefaultSettings());
}

/**
 * 导出列表数据
 * @param {string[]} blockList 要导出的列表
 */
function exportList(blockList) {
	downloadData([JSON.stringify(blockList)], "list.json");
}
/**
 * 导入列表数据
 * @param {object} data 导入到的对象
 * @param {File} file 文件对象
 * @param {(isSuccess) => void} callback 回调
 */
function importList(data, file, callback) {
	let reader = new FileReader();
  reader.readAsText(file, 'utf-8');
	
	reader.onload = function () {
		let blockList = JSON.parse(this.result);
		if (!(blockList instanceof Array) || blockList.some(value => !(typeof value === 'string'))) {
			callback(false);
			return;
		}
		data.blockList = blockList;
		if (callback) {
			callback(true);
		}
  };
}

/**
 * 刷新bilibili首页板块列表
 * @param {(isSuccess: boolean, message: string) => void} callback 回调，返回是否成功和失败消息
 */
function refreshBilibiliComponentList(callback = () => { }) {
	let queryOptions = { active: true, currentWindow: true };
	chrome.tabs.query(queryOptions, tabs => {
		let tabsId = tabs[0].id;
		if (!/www.bilibili.com(\/\?.*)?/.test(tabs[0].url)) {
			callback(false, '请在bilibili首页进行操作');
			return;
		}
		chrome.tabs.sendMessage(tabsId, { type: 'refresh' }, response => {
			if (!response) {
				callback(false, '请刷新网页后再操作');
				return;
			}
			globalSettings.bilibili.component.componentList = response;
			setSettings(globalSettings, () => { });
			callback(true, '刷新成功');
		});
	});
}

/** --------------- 所有的 Chrome 事件监听 --------------- */

chrome.webRequest.onCompleted.addListener((obj) => {
	if (!globalSettings.videoDownloader.enable) {
		return;
	}
	if (obj.url.includes("m3u8") && !obj.initiator.includes('chrome-extension')) {
		videoDownloader.addVideoItem(obj.tabId, videoDownloader.getM3U8Url(obj.url));
	}
}, { urls: ['<all_urls>'] });

chrome.tabs.onUpdated.addListener((tabsId, changeInfo, tabs) => {
	if (changeInfo.status === 'loading') {
		videoDownloader.clearVideoItem(tabsId);
	}
});

chrome.runtime.onInstalled.addListener(details => {
	getSettings(result => {
		let { settings } = result;
		if (!settings) {
			resetSettings();
		}
	});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'setting') {
		sendResponse(globalSettings);
	}
});

// FIXME Unchecked runtime.lastError: The message port closed before a response was received.
// FIXME Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
// FIXME m3u8 视频url应该随tab关闭而清除、某些url卡住、下载视频同时发起的ajax太多
// TODO popup.html界面优化
// TODO 统一通信格式
