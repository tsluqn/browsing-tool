/**
 * 获取默认设置
 * @returns
 */
function getDefaultSetting() {
	let setting = {
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
			recommend: {
				enable: true
			},
			video: {
				enable: true,
				viewThresh: 50000
			}
		},
		pixiv: {
			enable: true
		},
		video: {
			enable: true
		},
		jb51code: {
			enable: true
		},
		zhihu: {
			enable: true
		}
	};
	return setting;
}


class VideoDownloader {
	constructor() {
		this.videotabsMap = new Map();
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
	addVideoItem(tabsId, indexUrl, indexSize) {
		if (!this.videotabsMap.has(tabsId)) {
			this.videotabsMap.set(tabsId, []);
		}
		this.videotabsMap.get(tabsId).push({
			indexUrl,
			indexSize
		});
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

/**
 * 获取tabs下检测到的视频url
 * @param {number} tabsId tabsId
 * @returns 视频url列表
 */
function getVideoList(tabsId) {
	return videoDownloader.getVideoList(tabsId);
}

/**
 * 获取设置
 * @returns Promise<any>
 */
async function getSetting() {
	const result = await chrome.storage.local.get(['setting'])
	let setting = result.setting
	if(!setting) {
		setting = getDefaultSetting()
	}
	return setting
}
/**
 * 保存设置
 * @param {any} setting 设置
 * @returns Promise<any>
 */
function setSetting(setting) {
	return chrome.storage.local.set({ setting })
}
/**
 * 重置设置
 */
function resetSetting() {
	setSetting(getDefaultSetting());
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
/** --------------- 所有的 Chrome 事件监听 --------------- */
chrome.webRequest.onCompleted.addListener(async (obj) => {
	const setting = await getSetting()
	if (!setting.video.enable) {
		return;
	}
	
	if (obj.url.includes(".m3u8") && !obj.initiator.includes('chrome-extension')) {
		let indexSize = -1
		if(obj.responseHeaders) {
			let header = obj.responseHeaders.find(v => v.name === 'content-length')
			if(header) {
				indexSize = header.value
			}
		}
		console.log(obj.url)
		videoDownloader.addVideoItem(obj.tabId, videoDownloader.getM3U8Url(obj.url), indexSize);
	}
}, { urls: ['<all_urls>'] }, ['responseHeaders']);

chrome.tabs.onUpdated.addListener((tabsId, changeInfo, tabs) => {
	if (changeInfo.status === 'loading') {
		videoDownloader.clearVideoItem(tabsId);
	}
});

chrome.runtime.onInstalled.addListener(async details => {
	console.log('[Browsing Tool] Installed')
	const setting = await getSetting()
	setSetting(setting)
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch(request.type) {
		case 'setting':
			getSetting().then(setting => {
				sendResponse(setting)
			})
			break
		case 'set-setting':
			setSetting(request.setting).then(res => {
				sendResponse()
			})
			break
		case 'video-list':
			sendResponse(getVideoList(request.tabId))
			break
		default:
			break
	}

	return true
});

// FIXME Unchecked runtime.lastError: The message port closed before a response was received.
// FIXME Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
// FIXME m3u8 视频url应该随tab关闭而清除、某些url卡住、下载视频同时发起的ajax太多
// TODO popup.html界面优化
// TODO 统一通信格式
