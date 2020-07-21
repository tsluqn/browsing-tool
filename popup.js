let bg = chrome.extension.getBackgroundPage();
let active_item = null;
// 从background获取list并显示在popup页上
function load_list() {
  let container = document.getElementById("key-list");
  let list = bg.list;
  console.log("this is ", list)
  var innerHTML = "";
  for (var i = 0; i < list.length;i++) {
    innerHTML += '<div class="key-item" data-index='+i+'>'+list[i]+'</div>';
  }
  container.innerHTML = innerHTML;
  container.addEventListener("click", function (e) {
    if (e.target == container) {
      return;
    }
    if (active_item != null) {
      active_item.classList.remove(["active-item"]);
    }
    active_item = e.target;
    active_item.classList.add(["active-item"]);
  });
}
load_list();
let normal = document.getElementById("normal-num");
let inner = document.getElementById("inner-num");
let addbt = document.getElementById("add-button");
let removebt = document.getElementById("remove-button");
let input = document.getElementById("key-input");
let tips = document.getElementById("tips");
let infotab = document.getElementById("info-tab");
let settingtab = document.getElementById("setting-tab");
let infopage = document.getElementById("info-page");
let settingpage = document.getElementById("setting-page");
infotab.addEventListener("click", function (e) {
  infopage.style.display = 'block';
  settingpage.style.display = 'none';
  infotab.classList.add(["active-tab"]);
  settingtab.classList.remove(["active-tab"]);
});
settingtab.addEventListener("click", function (e) {
  infopage.style.display = 'none';
  settingpage.style.display = 'block';
  infotab.classList.remove(["active-tab"]);
  settingtab.classList.add(["active-tab"]);
});
normal.innerHTML = bg.result.normal;
inner.innerHTML = bg.result.inner;
// 添加key
addbt.addEventListener("click", function () {
  var text = input.value;
  var res = bg.addKey(text);
  if (res == 0) {
    load_list();
    input.value = "";
    bg.save();
    tips.innerHTML = "";
  } else if (res == 1) {
    tips.innerHTML = "输入为空";
  } else if (res == 2) {
    tips.innerHTML = "已存在";
  }
});
removebt.addEventListener("click", function (e) {
  if (active_item == null) {
    tips.innerHTML = "未选定删除项";
    return;
  }
  var text = active_item.innerHTML;
  var res = bg.removeKey(text);
  if (res == 0) {
    bg.save();
    load_list();
    active_item = null;
    console.log("success remove");
  }
});