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
    },
  },
  videoDownloader: {
    enable: true
  }
};

class CSDNHandler {
  /**
   * 处理入口
   * @param {string} url url
   */
  handle(url) {
    if (/blog.csdn.net\/.+/.test(url)) {
      this.showHiddenContent();
    }
  }
  /**
   * 显示需要关注后查看的内容
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
  /**
   * 处理入口
   * @param {string} url url
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
      $('.xcp-list-list > div').each(function () {
        if (checkBlocks($(this).text(), globalSettings.baidu.blockList)) {
          $(this).hide();
        }
      });
    });
    observer.observe(root[0], { subtree: true, childList: true });
  }
}

class BilibiliHandler {
  constructor() {
    // 屏蔽结果
    this.commentBlockResult = {
      main: 0,
      sub: 0
    };
  }
  /**
   * 处理入口
   * @param {string} url url
   */
  handle(url) {
    if (/bilibili.com\/.+/.test(url)) {
      if (globalSettings.bilibili.comment.enable) {
        this.hiddenComment();
      }
    }
    if (/www.bilibili.com(\/\?)?/.test(url)) {
      if (globalSettings.bilibili.component.enable) {
        this.hiddenComponent();
      }
      if (globalSettings.bilibili.live.enable) {
        this.hiddenLive();
      }
    }
  }
  /**
   * 屏蔽评论
   */
  hiddenComment() {
    const app = $('#app,.page-container')[0];
    const observer = new MutationObserver((mutations) => {
      this.hiddenCommentOf($('.bb-comment .list-item'));
    })
    observer.observe(app, { subtree: true, childList: true });
  }
  /**
   * 屏蔽指定评论节点的内容
   * @param {jQuery} comments jQuery节点
   */
  hiddenCommentOf(comments) {
    const self = this;
    comments.each(function () {
      // 主评论
      let text = $('.text', $(this)).text();
      if (checkBlocks(text, globalSettings.bilibili.comment.blockList)) {
        $(this).remove();
        self.commentBlockResult.main++;
      } else {
        $('.reply-item', $(this)).each(function () {
          // 子评论
          let text = $(this).text();
          if (checkBlocks(text, globalSettings.bilibili.comment.blockList)) {
            $(this).remove();
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
        console.log('[Browsing-Helper][bilibili-live]: get bili_live component failed');
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
          console.log(`[Browsing-Helper][bilibili-live]: check "${target}" from "${text}"`);
          $(this).hide();
          $(this).remove();
        }
      });
    }, 1000);
  }
  /**
   * 屏蔽首页板块
   */
  hiddenComponent() {
    setTimeout(() => {
      let ids = globalSettings.bilibili.component.blockList;
      for (const id of ids) {
        $(`#${id}`).hide();
      }
    }, 1000);
  }
}
/**
 * 更新首页板块列表
 * @returns 当前板块列表
 */
function refreshComponentList() {
  let components = [];
  $('.storey-box .proxy-box > div').each(function () {
    const id = $(this).attr('id');
    const title = $('.storey-title .name', $(this)).text();
    components.push({ id, title });
  });
  return components;
}

const handler = {
  bilibiliHandler: null,
  csdnHandler: null,
  baiduHandler: null
};

$(document).ready(() => {
  const url = document.URL;

  chrome.runtime.sendMessage({ type: 'setting' }, response => {
    globalSettings = response;
    if (/bilibili.com/.test(url) && globalSettings.bilibili.enable) {
      handler.bilibiliHandler = new BilibiliHandler();
      handler.bilibiliHandler.handle(url);
    } else if (/csdn.net/.test(url) && globalSettings.csdn.enable) {
      handler.csdnHandler = new CSDNHandler();
      handler.csdnHandler.handle(url);
    } else if (/baidu.com/.test(url) && globalSettings.baidu.enable) {
      handler.baiduHandler = new BaiduHandler();
      handler.baiduHandler.handle(url);
    } else {
    }
  })
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'refresh') {
		sendResponse(refreshComponentList());
  } else if (request.type === 'result') {
    sendResponse(handler.bilibiliHandler.commentBlockResult);
  }
});