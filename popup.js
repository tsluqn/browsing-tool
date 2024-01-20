/**
 * 获取当前标签页上的视频列表
 */
function getCurrentVideoList() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, async (tabs) => {
    let videoList = await chrome.runtime.sendMessage({ type: 'video-list', tabId: tabs[0].id })
    let listHtml = '';
    videoList.forEach((videoItem, index) => {
      listHtml += `
      <li class="list-group-item" data-url="${videoItem.indexUrl}">
        <div class="video-item-text-row">
          <p class="video-item-text" title="${videoItem.indexUrl}">${videoItem.indexUrl}</p>
          <p class="video-item-size">${videoItem.indexSize}</p>
          <button type="button" class="btn btn-primary btn-sm">下载</button>
        </div>
        <div class="progress download-progress">
          <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">
            60%
          </div>
        </div>
      </li>`;
    });
    if (listHtml === '') {
      listHtml = `（暂无数据）`;
    }
    $('#video-list-wrapper').html(`<ul id="video-list" class="list-group">${listHtml}</ul>`);
  });
}
/**
 * 下载二进制数据
 * @param {string} url
 * @returns 
 */
async function requestBinary(url) {
  const res = await fetch(url);
  return await res.arrayBuffer();
}
/**
 * 获取视频片段真实url
 * @param {string} manifestUrl m3u8 url
 * @param {string} videoPieceName m3u8 内容
 * @returns 
 */
function getPieceUrl(manifestUrl, videoPieceName) {
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
  if (videoPieceName.startsWith('http://') || videoPieceName.startsWith('https://')) {
    return videoPieceName
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
async function downloadVideoFromM3U8(fileUrl, filename, onStep, onFinish) {
  const manifestData = await fetch(fileUrl).then(res => {
    return res.text()
  })
  // get m3u8 manifest file
  const videoPieceList = manifestData.split('\n').filter(line => line.includes('.ts'));
  if (videoPieceList.length === 0) {
    onFinish(false);
    return;
  }
  // request each piece and merge to one file and download
  let dataList = [];
  for (let i = 0; i < videoPieceList.length; i++) {
    const pieceName = videoPieceList[i]
    let binaryData = await requestBinary(getPieceUrl(fileUrl, pieceName))
    dataList.push(binaryData);
    if (onStep) {
      onStep(pieceName, dataList.length, videoPieceList.length);
    }
    if (i === videoPieceList.length - 1) {
      downloadData(dataList, filename);
      onFinish(true);
    }
  }
}

/**
 * 下载指定的数据
 * @param {BlobPart[]} dataList 数据
 * @param {string} filename 文件名
 */
function downloadData(dataList, filename) {
  console.log(dataList)
  let blobData = new Blob(dataList, { type: 'video/mp4' });

  let doc = URL.createObjectURL(blobData);
  chrome.downloads.download({ url: doc, filename: filename });
}

$(document).ready(() => {
  $('#setting-btn').on('click', e => {
    chrome.runtime.openOptionsPage();
  });

  getCurrentVideoList();

  $('#video-list-wrapper').on('click', 'button', (e) => {
    let root = $(e.target).parent().parent();
    let progress = root.children('.download-progress');
    progress.show();
    let url = root.attr('data-url');

    downloadVideoFromM3U8(url, "video.mp4", (name, index, length) => {
      $('.progress-bar', progress).html(`${index}/${length}`);
      $('.progress-bar', progress).css('width', `${index / length * 100}%`);
      $('.progress-bar', progress).attr('aria-valuenow', `${index / length * 100}`);
    }, (isSuccess) => {
      if (!isSuccess) {
        alert('下载失败');
      }
    });

  })

  // $('#melvor-add-btn').click(async () => {
  //   const module = $('#melvor-module-selector').val()
  //   console.log(module)

  //   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  //   if(!tab.url.includes('melvoridle')) {
  //     return
  //   }
  //   chrome.tabs.sendMessage(tab.id, {
  //     type: 'melvor',
  //     melvor: {
  //       module: module,
  //       action: 'add',
  //       value: 1000
  //     }
  //   })
  // })

  // $('#melvor-speed-btn').click(async () => {
  //   const module = $('#melvor-module-selector').val()
  //   console.log(module)

  //   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  //   if(!tab.url.includes('melvoridle')) {
  //     return
  //   }
  //   chrome.tabs.sendMessage(tab.id, {
  //     type: 'melvor',
  //     melvor: {
  //       module: module,
  //       action: 'speed',
  //       value: 10
  //     }
  //   })
  // })
});
