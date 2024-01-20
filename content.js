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

let globalSetting = {};

class CSDNHandler {
  /**
   * 处理入口
   * @param {string} url url
   */
  handle(url) {
    if (/blog.csdn.net\/.+/.test(url)) {
      this.showHiddenContent();
    }
    this.enableCopy()
  }
  /**
   * 取消CSDN复制必须登录
   */
  enableCopy() {
    $('#content_views pre, #content_views pre code, #content_views')
      .css({
        'user-select': 'auto',
        '-webkit-user-select': 'auto'
      })
  }
  /**
   * 显示隐藏的内容
   */
  showHiddenContent() {
    // 关注后查看
    $('#article_content').css({
      'overflow': 'unset',
      'height': 'unset'
    });
    $('.hide-article-box.hide-article-pos.text-center').hide();

    // 长文展开
    $('.hide-preCode-box').hide();
    $('.set-code-hide').css({
      'overflow-y': 'unset',
      'height': 'unset'
    })
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
    root.hide();
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
    try {
      if (/www.bilibili.com.*/.test(url)) {
        this.removeRefresh();
        this.disableGray();
        this.removeTrend();
        this.hiddenRecommend();
      }
      else if (/bilibili.com\/.+/.test(url)) {
        this.removeTrend();
        this.disableGray();
        this.hiddenTopic();
        if (globalSetting.bilibili.comment.enable) {
          this.hiddenComment();
        }
      }
    } catch(e) {
      console.error(e)
    }
  }
  /**
   * 移除动态页右侧的话题面板
   */
  hiddenTopic() {
    setTimeout(() => {
      $('.topic-panel').remove();
    }, 1000);
  }
  /**
   * 屏蔽小于播放量阈值的首页视频推荐
   */
  hiddenRecommend() {
    const recommendList = $('.bili-video-card.is-rcmd');
    if (globalSetting.bilibili.recommend.enable) {
      let count = 0;
      for (const recommend of recommendList) {
        const videoViewText = $('.bili-video-card__stats--item .bili-video-card__stats--text', $(recommend))[0]
        const videoViewStr = $(videoViewText).text();
        if (this.checkVideoView(videoViewStr, globalSetting.bilibili.recommend.viewThresh)) {
          $(recommend).hide();
          count++;
        }
      }
      console.log('[hidden recommend] hidden ' + count + ' videos, thresh=' + globalSetting.bilibili.recommend.viewThresh)
    }
  }
  /**
   * 检查视频播放量是否小于阈值
   */
  checkVideoView(view, thresh) {
    let index = 1;
    let num = 0;
    if (view.endsWith('万')) {
      index = 10000
    }
    num = parseInt(view) * index;
    return num < thresh;
  }
  /**
   * 移除首页推荐的刷新按钮
   */
  removeRefresh() {
    setTimeout(() => {
      $('.feed-roll-btn').remove()
    }, 1000);
  }
  /**
   * 移除搜索栏的Bilibili热搜
   */
  removeTrend() {
    setTimeout(() => {
      const app = $('.search-panel')[0];
      const observer = new MutationObserver((mutations) => {
        $('.trending').remove();
      });
      observer.observe(app, { subtree: true, childList: true });
      setTimeout(() => {
        $('.nav-search-input').attr('placeholder', '');
        $('.nav-search-input').attr('title', '');
      }, 500);
    }, 500)
  }
  /**
   * Remove gray background
   */
  disableGray() {
    document.getElementsByTagName('html')[0].classList = [];
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
      if (checkBlocks(text, globalSetting.bilibili.comment.blockList)) {
        $(this).remove();
        self.commentBlockResult.main++;
      } else {
        $('.reply-item', $(this)).each(function () {
          // 子评论
          let text = $(this).text();
          if (checkBlocks(text, globalSetting.bilibili.comment.blockList)) {
            $(this).remove();
            self.commentBlockResult.sub++;
          }
        });
      }
    });
  }
}

const handler = {
  bilibiliHandler: null,
  csdnHandler: null,
  baiduHandler: null
};
const url = document.URL;
const init = async () => {
  const url = document.URL;
  const title = document.title

  try {
    globalSetting = await chrome.runtime.sendMessage({ type: 'setting' })
    console.log(globalSetting)
  
    if (/jb51.net/.test(url)) {
      $('.jb51code').css({
        'user-select': 'auto',
        '-webkit-user-select': 'auto'
      })
      console.log($._data($('.jb51code')[0], 'events'))
      // $._data($('.jb51code')[0], 'events').copy[0].handler = () => {}
    } else if (/bilibili.com/.test(url) && globalSetting.bilibili.enable) {
      document.getElementsByTagName('html')[0].classList = [];
      handler.bilibiliHandler = new BilibiliHandler();
      handler.bilibiliHandler.handle(url);
      setTimeout(() => {
        console.log($('.bili-dyn-item .bili-dyn-item__more .bili-popover'))
      $('.bili-dyn-item .bili-dyn-item__more .bili-popover').show()
      }, 3000)
    } else if (/csdn.net/.test(url) && globalSetting.csdn.enable) {
      handler.csdnHandler = new CSDNHandler();
      handler.csdnHandler.handle(url);
    } else if (/baidu.com/.test(url) && globalSetting.baidu.enable) {
      document.body.classList.remove('big-event-gray');
      handler.baiduHandler = new BaiduHandler();
      handler.baiduHandler.handle(url);
    } else if(/zhihu.com/.test(url)) {
      $('.AppHeader-messages').remove();
      setTimeout(() => {
        
        if(/\(.*\) /.test(title)) {
          console.log(title)
          document.title = title.replace(/\(.*\) /, '')
        }
      }, 2000);
    }
  } catch(e) {
    console.error(e)
  }
}

init()

function hackMelvorIdle(module, action, value) {
  console.log(game)
  if(action === 'speed') {
    if(module !== 'mining' || module !== 'smithing') return
    game[module].baseInterval = game[module].baseInterval / 10
    if(module === 'mining') {
      game.mining.passiveRegenInterval = 250
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.type) {
    case 'result':
      sendResponse(handler.bilibiliHandler.commentBlockResult);
      break
    case 'melvor':
      const { module, action, value } = request.melvor
      hackMelvorIdle(module, action, value)
      break
    default:
      console.warn('unknown message type')
      break
  }
});