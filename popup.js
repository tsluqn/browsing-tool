let bg = chrome.extension.getBackgroundPage()
let active_item = null
let container = $("#key-list")
// 从background获取list并显示在popup页上
// function load_list() {
//   let list = bg.getList()
//   console.log("this is ", list)
//   let innerHTML = ""
//   for (let i = 0; i < list.length; i++) {
//     innerHTML += '<div class="key-item' + (list[i].isReg ? ' reg-prefix' : '') + '" data-index=' + i + '>' +
//       list[i].text + '<a class="del-bt">x</a></div>'
//   }
//   container.innerHTML = innerHTML
// }
// $("#key-list").click(e => {
//   if (e.target == container) {
//     if (active_item) {
//       active_item.classList.remove(["active-item"])
//     }
//     active_item = null
//     return
//   }
//   if (e.target.tagName.toLowerCase() === 'a') {
//     let listItem = e.target.parentElement
//     bg.removeKey(listItem.getAttribute('data-index'))
//     bg.save()
//     load_list()
//     return
//   }
//   if (active_item) {
//     active_item.classList.remove(["active-item"])
//   }
//   active_item = e.target
//   active_item.classList.add(["active-item"])
// })
// load_list()
// function sendMessageToContentScript(message, callback) {
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     if (tabs[0].url.startsWith('chrome')) {
//       return
//     }
//     chrome.tabs.sendMessage(tabs[0].id, message, response => {
//       console.log(response)
//       if (callback) callback(response)
//     })
//   })
// }
// sendMessageToContentScript({ type: 'get' }, response => {
//   console.log('来自content的回复：' + JSON.stringify(response))
//   if (response) {
//     $("#normal-num").innerHTML = response.main_comment
//     $("#inner-num").innerHTML = response.sub_comment
//   }
// })

// let infotab = $("#info-tab")
// let settingtab = $("#setting-tab")
// let infopage = $("#info-page")
// let settingpage = $("#setting-page")
// infotab.addEventListener("click", e => {
//   infopage.style.display = 'block'
//   settingpage.style.display = 'none'
//   infotab.classList.add(["active-tab"])
//   settingtab.classList.remove(["active-tab"])
// })
// settingtab.addEventListener("click", e => {
//   infopage.style.display = 'none'
//   settingpage.style.display = 'block'
//   infotab.classList.remove(["active-tab"])
//   settingtab.classList.add(["active-tab"])
// })

// // 添加key
// $.click("#add-button", e => {
//   let text = $("#key-input").value
//   let isReg = $("#key-reg").checked
//   let res = bg.addKey(text, isReg)
//   if (res == 0) {
//     load_list()
//     $("#key-input").value = ""
//     bg.save()
//     $("#tips").innerHTML = ""
//   } else if (res == 1) {
//     $("#tips").innerHTML = "输入为空"
//   } else if (res == 2) {
//     $("#tips").innerHTML = "已存在"
//   }
// })
// $.click("#more-button", e => {
//   let filename = chrome.runtime.getManifest().options_page
//   window.open(chrome.extension.getURL(filename))
// })

function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (tabs) => {
    console.log(tabs)
    let videoList = bg.videoDownloader.getVideoList(tabs[0].id);
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
    $('#video-list').html(listHtml);
  });
}

$('#video-list').on('click', 'button', (e) => {
  let root = $(e.target).parent().parent();
  let progress = root.children('.download-progress');
  progress.show();
  let url = root.attr('data-url');
  bg.videoDownloader.downloadVideoFromM3U8(url, "mytest.mp4", (name, index, length) => {
    $('.progress-bar', progress).html(`${index}/${length}`);
    $('.progress-bar', progress).css('width', `${index / length * 100}%`);
    $('.progress-bar', progress).attr('aria-valuenow', `${index / length * 100}`);
  }, (isSuccess) => {
    if (!isSuccess) {
      alert('下载失败');
    }
  });
})

getCurrentTab();

