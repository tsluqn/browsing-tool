// label和key对应
let lang = {
  bili_live: '直播',
  bili_douga: '动画',
  bili_anime: '番剧',
  bili_guochuang: '国创',
  bili_manga: '漫画',
  bili_music: '音乐',
  bili_dance: '舞蹈',
  bili_game: '游戏',
  bili_technology: '知识',
  bili_cheese: '课堂',
  bili_digital: '数码',
  bili_life: '生活',
  bili_food: '美食',
  bili_animal: '动物圈',
  bili_kichiku: '鬼畜',
  bili_fashion: '时尚',
  bili_information: '资讯',
  bili_ent: '娱乐',
  bili_read: '专栏',
  bili_movie: '电影',
  bili_teleplay: 'TV剧',
  bili_cinephile: '影视',
  bili_documentary: '纪录片',
  article: '专栏',
  film: '番剧/电影/纪录片',
  video: '视频',
  follow_news_abstract: '动态概览页',
  follow_news_detail: '动态详情页',
  main_comment: '主评论',
  sub_comment: '子评论'
}

let bg = chrome.extension.getBackgroundPage()
let cur = 'blocks'

function loadData(settings, list) {
  // 屏蔽词列表
  let content = `<tr>
                  <th>序号</th>
                  <th>关键词</th>
                  <th>正则</th>
                  <th>操作</th>
                </tr>`
  for(let i=0;i<list.length;i++) {
  content += `<tr>
              <td>${i}</td>
              <td>${list[i].text}</td>
              <td>${list[i].isReg ? '是' : '否'}</td>
              <td><button type="button" class="close" aria-label="Close"><span data-index=${i} aria-hidden="true">&times;</span></button></td>
            </tr>`
  }
  $('#block-list').html(content)
  // 板块
  content = ''
  function getOuter(inner) {
    return  `<div class="checkbox checkbox-e">
              <label>
                ${inner}
              </label>
             </div>`
  }
  for (const key of bg.getLabels()) {
    content += getOuter(
      `<input type="checkbox" value="${key}" ${settings.modules[key] ? 'checked' : ''}> ${lang[key]}`)
  }
  $('#modules').html(content)
  // 类型
  content = ''
  for (const key in settings.types) {
    content += getOuter(
      `<input type="checkbox" value="${key}" ${settings.types[key] ? 'checked' : ''}> ${lang[key]}`)
  }
  $('#types').html(content)
  // 页面范围
  content = ''
  for (const key in settings.pages) {
    content += getOuter(
      `<input type="checkbox" value="${key}" ${settings.pages[key] ? 'checked' : ''}> ${lang[key]}`)
  }
  $('#pages').html(content)
}

$(document).ready(()=>{
  settings = bg.getSettings()
  list = bg.getList()
  loadData(bg.getSettings(), bg.getList())

  // *************** 添加各种事件 ****************
  // 主页板块
  $('#modules').delegate('input', 'click', (e) => {
    let item = $(e.target)
    let res = bg.alterSettings('modules', item.val(), item[0].checked)
    if (res) {
      bg.save()
    } else {
      console.log('edit error')
    }
  })
  // 屏蔽范围
  $('#pages').delegate('input', 'click', (e) => {
    let item = $(e.target)
    let res = bg.alterSettings('pages', item.val(), item[0].checked)
    if (res) {
      bg.save()
    } else {
      console.log('edit error')
    }
  })
  // 屏蔽类型
  $('#types').delegate('input', 'click', (e) => {
    let item = $(e.target)
    let res = bg.alterSettings('types', item.val(), item[0].checked)
    if (res) {
      bg.save()
    } else {
      console.log('edit error')
    }
  })
  // -------- 以下是屏蔽词相关 -----------
  $('#block-list').delegate('span', 'click', (e)=>{
    let index = e.target.getAttribute('data-index')
    bg.removeKey(index)
    loadData(bg.getSettings(), bg.getList())
  })

  $('#export-btn').click(() => {
    bg.exportList()
    alert('导出成功')
  })

  $('#import-btn').click(() => {
    let fileList = $('#upload-btn')[0].files
    if (fileList.length > 0) {
      bg.importList(fileList[0], () => {
        loadData(bg.getSettings(), bg.getList())
        alert('导入成功')
      })
    } else {
      alert('请上传文件')
    }
  })

  $('#add-btn').click(() => {
    let key = $('#key-word').val()
    let isReg = $('#reg-checkbox')[0].checked
    let res = bg.addKey(key, isReg)
    bg.save()
    loadData(bg.getSettings(), bg.getList())
    $('#key-word').val('')
    $('#reg-checkbox')[0].checked = false
  })

  $('#clear-btn').click(() => {
    bg.setList([])
    bg.save()
    loadData(bg.getSettings(), bg.getList())
  })

  // ----------- Tab切换 -------------
  $('#blocks-btn').click(()=>{
    if('blocks'===cur){
      return
    }
    $('#' + cur + '-btn').parent('li').removeClass('active')
    $('#' + cur).hide()
    $('#blocks').show()
    $('#blocks-btn').parent('li').addClass('active')
    cur = 'blocks'
  })

  $('#commits-btn').click(()=>{
    if('commits'===cur){
      return
    }
    $('#' + cur + '-btn').parent('li').removeClass('active')
    $('#' + cur).hide()
    $('#commits').show()
    $('#commits-btn').parent('li').addClass('active')
    cur = 'commits'
  })
})
