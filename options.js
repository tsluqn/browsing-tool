let bg = chrome.extension.getBackgroundPage();
/**
 * 加载bilibili首页模块列表
 * @param {object} settings 设置
 */
function loadBilibiliComponentList(settings) {
  let [componentList, blockList] = [settings.bilibili.component.componentList, settings.bilibili.component.blockList];
  let root = $('#component-list');
  let listHtml = '';
  for (const item of componentList) {
    const available = !blockList.includes(item.id);
    listHtml += `<div class="col-md-2">
                    <label class="checkbox-inline">
                      <input type="checkbox" class="component-item" value="${item.id}" ${available ? 'checked' : ''}> ${item.title}
                    </label>
                  </div>`;
  }
  root.html(listHtml);
  $('.component-item', root).on('click', e => {
    const target = $(e.target);
    const id = target.val();
    const checked = target[0].checked;
    if (!checked) {
      if (!blockList.includes(id)) {
        blockList.push(id);
      }
    } else {
      if (blockList.includes(id)) {
        blockList.splice(blockList.indexOf(id), 1);
      }
    }
    bg.setSettings(settings);
  });
}
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
 * @param {object} settings 设置
 */
function handleBlockListComponent(root, settings) {
  const dataBindLabel = root.attr('data-bind');
  let [object, field] = getFieldFromObject(settings, dataBindLabel);
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
    bg.setSettings(settings, () => {
      loadBlockList($('.block-list', root), data.blockList);
      $('.add-input', root).val('');
    });
  });

  $('.del-btn', root).on('click', e => {
    if (currentIndex) {
      data.blockList.splice(currentIndex, 1);
      currentIndex = undefined;
      bg.setSettings(settings, () => {
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
        bg.setSettings(settings);
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
  bg.getSettings(result => {
    const { settings } = result;
    loadBilibiliComponentList(settings);

    $('.block-list-component').each(function () {
      handleBlockListComponent($(this), settings);
    });

    $('.switch-for-enable').each(function () {
      const dataBindLabel = $(this).attr('data-bind');
      let [object, field] = getFieldFromObject(settings, dataBindLabel);

      $(this).bootstrapSwitch({
        state: object[field],
        onSwitchChange(event, state) {
          object[field] = state;
          bg.setSettings(settings);
        }
      });
    });
  });

  $('#reset-btn').on('click', e => {
    const res = window.confirm('是否重置设置项？');
    if (res) {
      bg.resetSettings();
      window.alert('重置成功');
      location.reload();
    }
  });
});
