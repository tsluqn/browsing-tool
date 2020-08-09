# bilibili-comment-filter
Chrome插件，使用关键词屏蔽bilibili评论区内容。练手用。
## 简介
屏蔽内容包括主评论和子评论，形式为关键词或正则表达式，正则表达式无需JavaScript中的正斜杠包围，如正则表达式`/w+/`只需要添加w+即可。添加屏蔽词后需要刷新网页

目前可应用在：
- 视频页(bilibili.com/video)
- 专栏页(bilibili.com/read)
- 番剧/纪录片等(bilibili.com/bangumi)
- 动态概览页(t.bilibili.com)
- 动态详情页(t.bilibili.com)

可对以上内容进行配置，以及导入导出屏蔽词列表

## 用法
- git clone本仓库，或
- 下载crx文件并解压

Chrome扩展管理页面内打开开发者模式，加载已解压的程序包即可。

360极速浏览器/QQ浏览器等直接将crx文件拖入扩展管理页面即可。