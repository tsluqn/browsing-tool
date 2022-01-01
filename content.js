/**
 * 检查内容是否包含屏蔽词
 * @param {string} text 目标内容
 * @param {string[]} blockList 屏蔽词列表
 * @returns 含有的屏蔽词，否则为null
 */
function checkBlocks(text, blockList) {
  for (const blockItem of blockList) {
    // 去除空格后检测关键词
    if (text.replace(/ /g, '').includes(blockItem)) {
      return blockItem;
    }
  }
  return null;
}

let globalSettings = {
  csdn: {
    enable: true
  },
  baidu: {
    enable: true,
    blockList: ['!', '?', '！', '？']
  },
  bilibili: {
    enable: true,
    comment: {
      enable: true,
      blockList: []
    },
    live: {
      enable: true,
      blockList: ['见', '聊', '甜', '美', '帅', '姐', '妹', '电台', '舞']
    },
    component: {
      enable: true,
      blockList: []
    }
  }
};

function initGlobalSettings() {
  
}
// 付费后查看的内容无法显示，本身不加载 https://blog.csdn.net/weixin_43582101/article/details/122168550
class CSDNHandler {
  /**
   * 处理入口
   * @param {string} url 
   */
  handle(url) {
    if (/blog.csdn.net\/.+/.test(url)) {
      this.showHiddenContent();
    }
  }
  /**
   * 显示需要关注后查看的内容，如 https://blog.csdn.net/weixin_33802505/article/details/86134809
   */
  showHiddenContent() {
    $('#article_content').css({
      'overflow': '',
      'height': ''
    });
    $('.hide-article-box.hide-article-pos.text-center').hide();
  }
}
class BaiduHandler {
  constructor() {
  }
  /**
   * 处理入口
   * @param {string} url 
   */
  handle(url) {
    if (/baijiahao.baidu.com/.test(url)) {
      this.hiddenComment();
    }
  }
  /**
   * 屏蔽百家号评论区
   */
  hiddenComment() {
    const root = $('#commentModule');
    const observer = new MutationObserver((mutations) => {
      $('.xcp-list-list > div').each(function() {
        if (checkBlocks($(this).text(), globalSettings.baidu.blockList)) {
          $(this).hide();
        }
      });
    });
    observer.observe(root[0], { subtree: true, childList: true });
  }
}
// TODO 待重构
class BilibiliHandler {
  constructor() {
    this.commentBlockResult = {
      main: 0,
      sub: 0
    }
  }

  initConfig(callback) {
    chrome.runtime.sendMessage({ type: 'get' }, response => {
      this.settings = response.settings;
      this.blockList = response.list;
      this.blockRemove = [];
      for (const key in this.settings.modules) {
        const element = this.settings.modules[key];
        if (!element) {
          this.blockRemove.push(key)
        }
      }
      
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type == 'get') {
          sendResponse(this.commentBlockResult);
        }
      })
      callback();
    })
  }
  handle(url) {
    this.initConfig(() => {
      if (/bilibili.com\/.+/.test(url)) {
        this.hiddenComment();
      }
      if (/www.bilibili.com/.test(url)) {
        this.hiddenComponent();
        this.hiddenLive();
        this.hiddenAd();
      }
    });
  }
  hiddenComment() {
    const app = $('#app,.page-container')[0];
    const observer = new MutationObserver((mutations) => {
      let obj = mutations.some((value, index) =>
        $(value.target).hasClass('bb-comment') || $(value.target).hasClass('reply-box'));
      if (obj) {
        this.hiddenCommentOf($('.bb-comment .list-item'));
      }
    })
    observer.observe(app, { subtree: true, childList: true })
  }
  hiddenCommentOf(comments) {
    const self = this;
    comments.each(function () {
      if (checkBlocks($('text', $(this)).text(), self.blockList)) {
        $(this).hide();
        self.commentBlockResult.main++;
      } else if (self.settings.types.sub_comment) {
        $('.reply-item', $(this)).each(function () {
          if (checkBlocks($(this).text(), self.blockList)) {
            $(this).hide();
            self.commentBlockResult.sub++;
          }
        });
      }
    });
  }
  /**
   * 屏蔽首页直播box
   */
  hiddenLive() {
    // FIXME 点击直播box刷新按钮，有概率不加载任何box，也不触发MutationObserver监听
    // 未加载完成，延时
    setTimeout(() => {
      let root = $('#bili_live');
      if (root.length === 0) {
        console.log('get bili_live module failed');
        return;
      }
      this.hiddenLiveItem(root);
      let observer = new MutationObserver(() => {
        this.hiddenLiveItem(root);
      })
      observer.observe(root[0], { childList: true, subtree: true });
    }, 1000);
  }
  /**
   * 屏蔽节点下的直播box
   * @param {jQuery} root jQuery节点
   */
  hiddenLiveItem(root) {
    // DOM变动时未加载完成，延时
    setTimeout(() => {
      $('.live-card', root).each(function () {
        const text = $('.up > .txt', $(this)).text();
        const target = checkBlocks(text, globalSettings.bilibili.live.blockList);
        if (target) {
          console.log(`check ${target} from ${text}`);
          $(this).hide();
          $(this).remove();
        }
      });
    }, 1000);
  }
  /**
   * 去除广告横栏
   */
  hiddenAd() {
    // $('.banner-card').hide();
  }
  hiddenComponent() {
    setTimeout(() => {
      let ids = this.blockRemove;
      for (const id of ids) {
        $(`#${id}`).hide();
      }
    }, 1000);
  }
}

$(document).ready(() => {
  const url = document.URL;
  
  if (/bilibili.com/.test(url)) {
    new BilibiliHandler().handle(url);
  } else if (/csdn.net/.test(url)) {
    new CSDNHandler().handle(url);
  } else if (/baidu.com/.test(url)) {
    new BaiduHandler().handle(url);
  } else if (/zhihu.com/.test(url)){

  } else {

  }
});