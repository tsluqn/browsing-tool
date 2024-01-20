/**
 * 加载屏蔽词列表
 * @param {jQuery} root jQuery节点
 * @param {string[]} blockList 屏蔽词列表
 */
function loadBlockList(root, blockList) {
  let listHtml = '';
  blockList.forEach((item, index) => {
    listHtml += `<button type="button" class="list-group-item" data-index="${index}">${item}</button>`;
  });
  root.html(listHtml);
}

/**
 * 处理屏蔽词列表组件的逻辑
 * @param {jQuery} root jQuery节点
 * @param {object} setting 设置
 */
function handleBlockListComponent(root, setting) {
  const dataBindLabel = root.attr('data-bind');
  let [object, field] = getFieldFromObject(setting, dataBindLabel);
  let data = object[field];
  let currentIndex = undefined;

  loadBlockList($('.block-list', root), data.blockList);

  $('.block-list', root).on('click', 'button', e => {
    currentIndex = $(e.target).attr('data-index');
  });

  $('.add-btn', root).on('click', e => {
    const text = $('.add-input', root).val();
    if (text === '') {
      alert('无内容');
      return;
    }
    if (data.blockList.includes(text)) {
      alert('已存在');
      return;
    }
    data.blockList.push(text);
    chrome.runtime.sendMessage({ type: 'set-setting', setting }).then(res => {
      loadBlockList($('.block-list', root), data.blockList);
      $('.add-input', root).val('');
    })
  });

  $('.del-btn', root).on('click', e => {
    if (currentIndex) {
      data.blockList.splice(currentIndex, 1);
      currentIndex = undefined;
      chrome.runtime.sendMessage({ type: 'set-setting', setting }).then(res => {
        loadBlockList($('.block-list', root), data.blockList);
      })
    }
  });

  $('.import-btn', root).on('click', e => {
    const fileList = $('.choose-btn', root)[0].files;
    if (fileList.length > 0) {
      bg.importList(data, fileList[0], (isSuccess) => {
        if (!isSuccess) {
          alert('导入失败');
          return;
        }
        loadBlockList($('.block-list', root), data.blockList);
        bg.setSetting(setting);
        alert('导入成功');
      })
    } else {
      alert('请上传文件');
    }
  });

  $('.export-btn', root).on('click', e => {
    bg.exportList(data.blockList);
  });
}
/**
 * 处理Bilibili首页推荐播放量阈值
 * @param {jQuery} root 
 * @param {Object} setting 
 */
function handleRecommendVideoViewThresh(root, setting) {
  const dataBindLabel = $('#recommend-thresh').attr('data-bind');
  let [object, field] = getFieldFromObject(setting, dataBindLabel);
  $('#recommend-thresh').val(object[field]);
  $('#recommend-thresh').change(function() {
    object[field] = $('#recommend-thresh').val();
    bg.setSetting(setting);
  })
}
/**
 * 返回给定对象中指定数据的访问（被访问对象，被访问字段）
 * @param {object} object 对象
 * @param {string} fieldStr 点分隔的访问字符串
 * @returns 直接对象和被访问数据的字段
 */
function getFieldFromObject(object, fieldStr) {
  const fieldStrPart = fieldStr.split('.');
  let lastPart = null;
  fieldStrPart.forEach((part, index) => {
    if (index === fieldStrPart.length - 1) {
      lastPart = part;
    } else {
      object = object[part];
    }
  });
  return [object, lastPart];
}

$(document).ready(() => {
  chrome.runtime.sendMessage({ type: 'setting' }).then(setting => {
    $('.block-list-component').each(function () {
      handleBlockListComponent($(this), setting);
    });

    handleRecommendVideoViewThresh(null, setting)

    $('.form-switch > .form-check-input').each(function () {
      const dataBindLabel = $(this).attr('data-bind');
      let [object, field] = getFieldFromObject(setting, dataBindLabel);
      $(this).attr('checked', object[field])

      $(this).click(() => {
        console.log(setting)
        console.log(object, field)
        object[field] = $(this).is(':checked')
        console.log(setting)
        chrome.runtime.sendMessage({ type: 'set-setting', setting })
      })
    });
  });

  $('#reset-btn').on('click', e => {
    const res = window.confirm('是否重置设置项？');
    if (res) {
      bg.resetSetting();
      window.alert('重置成功');
      location.reload();
    }
  });
});
