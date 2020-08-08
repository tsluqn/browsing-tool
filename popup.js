let bg = chrome.extension.getBackgroundPage()
let active_item = null
let container = $("#key-list")
// 从background获取list并显示在popup页上
function load_list() {
  let list = bg.getList()
  console.log("this is ", list)
  let innerHTML = ""
  for (let i = 0; i < list.length; i++) {
    innerHTML += '<div class="key-item' + (list[i].isReg ? ' reg-prefix' : '') + '" data-index=' + i + '>' +
      list[i].text + '<a class="del-bt">x</a></div>'
  }
  container.innerHTML = innerHTML
}
$.click("#key-list", e => {
  if (e.target == container) {
    if (active_item) {
      active_item.classList.remove(["active-item"])
    }
    active_item = null
    return
  }
  if (e.target.tagName.toLowerCase() === 'a') {
    let listItem = e.target.parentElement
    bg.removeKey(listItem.getAttribute('data-index'))
    bg.save()
    load_list()
    return
  }
  if (active_item) {
    active_item.classList.remove(["active-item"])
  }
  active_item = e.target
  active_item.classList.add(["active-item"])
})
load_list()
function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0].url.startsWith('chrome')) {
      return
    }
    chrome.tabs.sendMessage(tabs[0].id, message, response => {
      console.log(response)
      if (callback) callback(response)
    })
  })
}
sendMessageToContentScript({ type: 'get' }, response => {
  console.log('来自content的回复：' + JSON.stringify(response))
  if (response) {
    $("#normal-num").innerHTML = response.main_comment
    $("#inner-num").innerHTML = response.sub_comment
  }
})

let infotab = $("#info-tab")
let settingtab = $("#setting-tab")
let infopage = $("#info-page")
let settingpage = $("#setting-page")
infotab.addEventListener("click", e => {
  infopage.style.display = 'block'
  settingpage.style.display = 'none'
  infotab.classList.add(["active-tab"])
  settingtab.classList.remove(["active-tab"])
})
settingtab.addEventListener("click", e => {
  infopage.style.display = 'none'
  settingpage.style.display = 'block'
  infotab.classList.remove(["active-tab"])
  settingtab.classList.add(["active-tab"])
})

// 添加key
$.click("#add-button", e => {
  let text = $("#key-input").value
  let isReg = $("#key-reg").checked
  let res = bg.addKey(text, isReg)
  if (res == 0) {
    load_list()
    $("#key-input").value = ""
    bg.save()
    $("#tips").innerHTML = ""
  } else if (res == 1) {
    $("#tips").innerHTML = "输入为空"
  } else if (res == 2) {
    $("#tips").innerHTML = "已存在"
  }
})
$.click("#more-button", e => {
  let filename = chrome.runtime.getManifest().options_page
  window.open(chrome.extension.getURL(filename))
})