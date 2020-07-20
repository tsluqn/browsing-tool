var url = document.URL;
console.log(url);
var settings = {
  normal: true,
  inner: true
};
var result = {
  normal: 0,
  inner: 0
};
var textList = [];
// 查找src字符串中是否有textList中的屏蔽词
function findtext(src) {
  for (var word of textList) {
    if (src.includes(word)) {
      console.log(word);
      return true;
    }
  }
  return false;
}
// 监听rootnode节点下的节点更新
function getObserve(rootnode) {
  (function () {
    var root = rootnode;
    var observe = new MutationObserver(function () {
      var flag = false;
      var list = root.querySelector("div.comment-list");
      // 主评论区
      if (list.innerHTML != "") {
        for (var i = 0; i < list.childElementCount; i++) {
          var ob = list.childNodes[i];
          var tartext = ob.querySelector(".con p.text").innerHTML;
          if (settings.normal && findtext(tartext)) {
            ob.remove();
            result.normal++;
            flag = true;
          }
          // 主评论下的楼中楼评论区
          else if (settings.inner) {
            var replybox = ob.querySelector(".con div.reply-box");
            for (var j = 0; j < replybox.childElementCount; j++) {
              var rob = replybox.childNodes[j];
              var retartext = rob.querySelector("span.text-con");
              if (retartext != null) {
                if (findtext(retartext.innerHTML)) {
                  rob.remove();
                  result.inner++;
                  flag = true;
                }
              }

            }
          }
        }
      }
      // 如果有屏蔽次数更新，则更新记录
      if (flag) {
        chrome.runtime.sendMessage({ type: 'set', value: result }, function (response) {
          console.log('收到来自background的回复：' + response);
        });
      }

    });
    observe.observe(root, { childList: true, subtree: true });
  })();

}
window.onload = function () {
  chrome.runtime.sendMessage({ type: 'get' }, function (response) {
    console.log('收到来自background的回复：' + response);
    textList = response.list;
    settings = response.settings;
    // 视频页面
    if (url.startsWith("https://www.bilibili.com/video/")) {
      var abc = document.querySelector("div.comment");
      getObserve(abc);
    // 动态页面，包括总览和详细动态
    } else if (url.startsWith("https://t.bilibili.com/")) {
      var abcList = document.querySelectorAll("div.detail-content");
      console.log(abcList);
      console.log("first: " + document.querySelector("div.detail-content"));
      for (var abc of abcList) {
        console.log("in for " + abc);
        getObserve(abc);
      }

    } else {
      console.log("not target url");
    }
  });

};

