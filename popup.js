let bg = chrome.extension.getBackgroundPage();

/**
 * 向当前标签页发送消息
 * @param {object} message 消息
 * @param {(response: object) => void} callback 回调
 */
function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0].url.startsWith('chrome')) {
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, message, response => {
      if (callback) callback(response);
    });
  });
}
/**
 * 获取当前标签页上的视频列表
 */
function getCurrentVideoList() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    let videoList = bg.getVideoList(tabs[0].id);
    let listHtml = '';
    videoList.forEach((videoItem, index) => {
      listHtml += `
      <li class="list-group-item" data-url="${videoItem}">
        <div class="video-item-text-row">
          <p class="video-item-text" title="${videoItem}">${videoItem}</p>
          <button type="button" class="btn btn-default btn-sm">下载</button>
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

$(document).ready(() => {
  $('#update-bilibili-comp-btn').on('click', e => {
    bg.refreshBilibiliComponentList((isSuccess, message) => {
      if (!isSuccess) {
        alert(message);
      }
    });
  });
  $('#settings-btn').on('click', e => {
    chrome.runtime.openOptionsPage();
  });
  
  sendMessageToContentScript({ type: 'result' }, response => {
    if (response) {
      $("#main-num").html(response.main);
      $("#sub-num").html(response.sub);
    }
  });

  getCurrentVideoList();

  $('#video-list-wrapper').on('click', 'button', (e) => {
    let root = $(e.target).parent().parent();
    let progress = root.children('.download-progress');
    progress.show();
    let url = root.attr('data-url');
    
    bg.downloadVideoFromM3U8(url, "video.mp4", (name, index, length) => {
      $('.progress-bar', progress).html(`${index}/${length}`);
      $('.progress-bar', progress).css('width', `${index / length * 100}%`);
      $('.progress-bar', progress).attr('aria-valuenow', `${index / length * 100}`);
    }, (isSuccess) => {
      if (!isSuccess) {
        alert('下载失败');
      }
    });
  })
});
