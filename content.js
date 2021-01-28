{
  let urlMap = {
    'index': 'bilibili.com',
    'video': 'bilibili.com/video',
    'read': 'bilibili.com/read',
    'film': 'bilibili.com/bangumi',
    'follow': 't.bilibili.com'
  }
  let url = document.URL
  console.log(url)
  console.log('running')
  let settings = {}
  let blockList = []
  let blockRemove = ['bili_manga', 'bili_dance', 'bili_cheese', 'bili_life', 'bili_fashion', 'bili_information', 'bili_ent', 'bili_food', 'bili_music', 'bili_digital', 'bili_movie', 'bili_teleplay', 'bili_cinephile', 'bili_documentary']
  // 运行结果
  let result = {
    main_comment: 0,
    sub_comment: 0
  }
  // 查找text中是否存在被屏蔽内容
  function findBlocks(text) {
    for (const blockItem of blockList) {
      if ((blockItem.isReg && new RegExp(blockItem.text).test(text)) ||   // 使用正则
        text.replace(/ /g, '').indexOf(blockItem.text) > -1) {            // 去除空格后使用关键词
        return true
      }
    }
    return false
  }
  // 给页面中page节点添加DOM监听，动态概览页的方法有所不同
  function addObserver(page, isAbstractPage = false) {
    let config = {
      subtree: true,
      childList: true
    }
    let comment_list = null
    let obs = null
    let isRoot = true
    obs = new MutationObserver(() => {
      // 当前是否监测的是评论列表的根节点
      if (isRoot) {
        comment_list = page.getElementsByClassName('comment-list')[0]
        // 评论列表节点已加载，更换监测源
        if (comment_list) {
          isRoot = false
          if (!isAbstractPage) {
            obs.disconnect()
            obs.observe(comment_list, config)
          }
        }
        return
      }
      let comments = null
      if (isAbstractPage) {
        comments = page.getElementsByClassName('list-item')
      } else {
        comments = comment_list.getElementsByClassName('list-item')
      }
      if (comments.length) {
        // 遍历所有主评论
        for (const comment of comments) {
          if (comment.style.display === 'none') {
            continue
          }
          let text = comment.getElementsByClassName('text')[0].innerHTML
          if (findBlocks(text)) {
            comment.style.display = 'none'
            result.main_comment++
          } else if (settings.scope.sub_comment) {
            let replies = comment.getElementsByClassName('reply-item')
            // 遍历所有子评论
            for (const reply of replies) {
              if (reply.style.display === 'none') {
                continue
              }
              let text = reply.getElementsByClassName('text-con')[0].innerHTML
              if (findBlocks(text)) {
                reply.style.display = 'none'
                result.sub_comment++
              }
            }
          }
        }
      }
    })
    obs.observe(page, config)
  }
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'get') {
      sendResponse(result)
    }
  })
  window.onload = function () {
    chrome.runtime.sendMessage({ type: 'get' }, response => {
      // console.log('收到来自background的回复：', response)
      settings = response.settings
      blockList = response.list
      setTimeout(() => {
        let page = null
        let isAbstractPage = false
        if (url.indexOf(urlMap.video) > -1 && settings.pages.video) {
          // 使用class玄学问题失效了，改为父节点的id
          page = document.getElementById('comment')
          // page = document.getElementsByClassName('comment')[0]
        } else if (url.indexOf(urlMap.read) > -1 && settings.pages.article) {
          page = document.getElementsByClassName('comment-holder')[0]
          // page = document.getElementsByClassName('comment-list')[0]
        } else if (url.indexOf(urlMap.film) > -1 && settings.pages.film) {
          // page = document.getElementById('comment_module')
          page = document.getElementsByClassName('comm')[0]
        } else if (url.indexOf(urlMap.follow) > -1) {
          if (settings.pages.follow_news_abstract) {
            // 动态概览页
            page = document.getElementsByClassName('feed-card')[0]
            isAbstractPage = true
          }
          if (!page && settings.pages.follow_news_detail) {
            // 动态详情页
            page = document.getElementsByClassName('detail-card')[0]
            isAbstractPage = false
          }
        } else {
          return
        }
        // console.log(page.outerHTML)
        addObserver(page, isAbstractPage)
      }, 100)
      if (url.indexOf(urlMap.index) > -1) {
        removeComponents(blockRemove)
      }
    })
  }
  // 隐藏bilibili首页板块
  function removeComponents(ids) {
    for (const id of ids) {
      let tag = document.getElementById(id)
      if (tag) {
        tag.style.display = 'none'
      } else {
        console.log('block ' + id + ': not found')
      }
    }
  }
}
