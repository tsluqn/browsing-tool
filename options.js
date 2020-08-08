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
$.click("#export-list", e => {
  bg.exportList()
})
$.click("#import-list", e => {
  files = $("#import-file").files
  if (files.length) {
    bg.importList(files[0])
  }
})
$.click("#save-setting", e => {
  
})