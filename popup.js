let bg = chrome.extension.getBackgroundPage();
// 从background获取list并显示在popup页上
function load_list() {
  let container = document.getElementById("key-list");
  let list = bg.list;
  console.log("this is ", list)
  var innerHTML = "";
  for (item of list) {
    innerHTML += '<div class="key-item">'+item+'</div>';
  }
  container.innerHTML = innerHTML;
}
load_list();
let normal = document.getElementById("normal-num");
let inner = document.getElementById("inner-num");
let addbt = document.getElementById("add-button");
let input = document.getElementById("key-input");
let tips = document.getElementById("tips");
normal.innerHTML = bg.result.normal;
inner.innerHTML = bg.result.inner;
// 添加一个屏蔽关键词
addbt.onclick = function () {
  var text = input.value;
  if (text != "") {
    bg.list.push(text);
    load_list();
    input.value = "";
    bg.save();
  } else {
    tips.innerHTML = "输入为空";
  }
}
