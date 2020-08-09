let bg = chrome.extension.getBackgroundPage()
window.onload = function () {
  let settings = bg.getSettings()
  $("#bili-video").checked = settings.pages.video
  $("#bili-film").checked = settings.pages.film
  $("#bili-article").checked = settings.pages.article
  $("#bili-follow-news-abstract").checked = settings.pages.follow_news_abstract
  $("#bili-follow-news-detail").checked = settings.pages.follow_news_detail

  $("#bili-comment-main").checked = settings.scope.main_comment
  $("#bili-comment-sub").checked = settings.scope.sub_comment
}
$.click("#clear-list", e => {
  bg.setList([])
  bg.save()
  alert("清空成功")
})
$.click("#export-list", e => {
  bg.exportList()
})
$.click("#import-list", e => {
  files = $("#import-file").files
  if (files.length) {
    bg.importList(files[0])
    alert("导入成功")
  }
})
$.click("#save-setting", e => {
  let settings = {
    pages: {
      video: $("#bili-video").checked,
      film: $("#bili-film").checked,
      article: $("#bili-article").checked,
      follow_news_abstract: $("#bili-follow-news-abstract").checked,
      follow_news_detail: $("#bili-follow-news-detail").checked
    },
    scope: {
      main_comment: $("#bili-comment-main").checked,
      sub_comment: $("#bili-comment-sub").checked
    }
  }
  bg.setSettings(settings)
  bg.save()
  alert("保存成功")
})