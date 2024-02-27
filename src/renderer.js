
document.addEventListener('DOMContentLoaded', function () {

  const rootEle = document.documentElement;
  const rootStyles = getComputedStyle(rootEle);
  const lineHeight = parseInt(rootStyles.getPropertyValue('--line-height'));
  const tabSize = 2;
  const fullTabSpace = '  ';


  /* Textarea Input */
  const inputEle = document.getElementById('input-textarea');
  let lineIndex = [];   // store index of first text of each line

  function updateHeight() {
    inputEle.style.height = "auto";
    inputEle.style.height = inputEle.scrollHeight + (editorEle.offsetHeight - lineHeight) + 'px';
  }

  function updateLineIndex() {
    lineIndex.length = 0;
    const eachLines = inputEle.value.split('\n');
    let curPos = 0;

    for (const line of eachLines) {
      lineIndex.push(curPos);
      curPos += (line.length + 1);
    }
  }

  function handleInput() {
    const previewHidden = previewEle.classList.contains('hidden');

    updateLineIndex();
    if (!previewHidden) convertMarkdown();
    if (updateLineNumber()) {
      updateHeight();
      if (!previewHidden) updatePreviewMap();
      if (!previewHidden) updateScrollMap();
    }
    const line = getCursorLine();
    cursorLineHighlight(line);
    if (searching) wordHighlight(keyword.value);
    updatePrompt(line);
    fit();
  }

  function insertTab() {
    let currentLine = getCursorLine() - 1;
    let lineStartIndex = lineIndex[currentLine];
    let curStartIndex = inputEle.selectionStart;
    let tabLen = tabSize - ((curStartIndex - lineStartIndex) % tabSize);

    let tabSpace = '';
    for (let i = tabLen; i > 0; i--) { tabSpace += ' '; }
    let tempValue = inputEle.value.substring(0, curStartIndex) + tabSpace;

    const curEndIndex = inputEle.selectionEnd;
    let endIndex = curEndIndex + tabLen;
    while (1) {
      currentLine++;
      lineStartIndex = lineIndex[currentLine];
      if (lineStartIndex >= curEndIndex || lineStartIndex === undefined) { break; }
      tempValue += inputEle.value.substring(curStartIndex, lineStartIndex) + fullTabSpace;
      endIndex += tabSize;
      curStartIndex = lineStartIndex;
    }
    tempValue += inputEle.value.substring(curStartIndex);

    inputEle.value = tempValue;
    inputEle.selectionStart = inputEle.selectionEnd = endIndex;
  }

  function convertMarkdown() {
    // Convert markdown to html elements
    // block until convert is finished
    convertedText = window.customAPI.mdConvert(inputEle.value);
    previewEle.innerHTML = convertedText;

    let paraList = document.querySelectorAll('#preview-wrap p');
    paraList.forEach(paraEle => {
      if (!paraEle.querySelector('a') && !paraEle.querySelector('img')) {
        paraEle.innerHTML = paraEle.innerHTML.replace(/ /g, '&ensp;');
      }
    });
  }


  /* Line Number */
  const lineNumberEle = document.getElementById('line-number');
  let totalLineNumber = 1;
  let bottomLine;

  function updateLineNumber() {
    let lineChanged = false;
    // count current line numbers
    const textValue = escapeHtml(inputEle.value);
    const lines = textValue.match(/\n/g);
    const lineNumber = lines ? lines.length + 1 : 1;

    if (lineNumber > totalLineNumber) {
      // add new lines
      let gap = lineNumber - totalLineNumber;
      while (gap > 0) {
        let newLine = document.createElement("div");
        newLine.textContent = lineNumber + 1 - gap;
        lineNumberEle.appendChild(newLine);
        bottomLine = newLine;
        gap -= 1;
      }
      lineChanged = true;
    }
    if (lineNumber < totalLineNumber) {
      // remove lines
      let gap = totalLineNumber - lineNumber;
      while (gap > 0) {
        let temp = bottomLine.previousElementSibling;
        lineNumberEle.removeChild(bottomLine);
        bottomLine = temp;
        gap -= 1;
      }
      lineChanged = true;
    }

    totalLineNumber = lineNumber;
    return lineChanged;
  }


  /* Line Highlight */
  const lineHighlightEle = document.getElementById('line-highlight');
  let prevHighlight = 1;

  function getCursorLine() {
    beforeCursor = inputEle.value.substring(0, inputEle.selectionStart);
    const lines = beforeCursor.match(/\n/g);
    return lines ? lines.length + 1 : 1;
  }

  function cursorLineHighlight(cursorLineNumber) {
    lineHighlightEle.style.top = (lineHeight * (cursorLineNumber - 1)) + 'px';

    let lineNumberList = lineNumberEle.querySelectorAll('div');
    if (lineNumberList[prevHighlight - 1]) lineNumberList[prevHighlight - 1].classList.remove('highlight');
    lineNumberList[cursorLineNumber - 1].classList.add('highlight');
    prevHighlight = cursorLineNumber;
  }

  /* Word Highlight */
  const backdropEle = document.getElementById('backdrop');
  const wordHighlightEle = document.getElementById('word-highlight');

  function wordHighlight(word) {
    const text = inputEle.value;
    const regex = new RegExp(word, 'g');
    wordHighlightEle.innerHTML = text.replace(/\n/g, '<br>').replace(regex, `<mark>${word}</mark>`);
  }


  /* Fixed Horizontal Scrollbar */
  const scrollbar = document.getElementById('hz-scrollbar');
  const fakecontent = scrollbar.querySelector('div');
  let prevScroll;

  function fit() {
    if (inputEle.scrollWidth <= inputEle.offsetWidth) {
      scrollbar.style.display = 'none';
    }
    else {
      scrollbar.style.display = 'block';
    }
    scrollbar.style.width = inputEle.offsetWidth + 'px';
    fakecontent.style.width = inputEle.scrollWidth + 'px';
  }

  function syncScrollBarInput() {
    if (scrollbar.scrollLeft === prevScroll) return;
    prevScroll = scrollbar.scrollLeft;
    inputEle.scrollLeft = prevScroll;
  }

  function syncInputScrollBar() {
    if (inputEle.scrollLeft === prevScroll) return;
    prevScroll = inputEle.scrollLeft;
    scrollbar.scrollLeft = prevScroll;
  }


  /* Sync Scroll */
  const editorEle = document.getElementById('editor-wrap');
  let previewMap = new Map();
  let scrollMap = new Map();
  let prevLineScroll;

  function updatePreviewMap() {
    previewMap.clear();

    const elements = previewEle.querySelectorAll('[data-line]');
    elements.forEach(ele => {
      const line = parseInt(ele.getAttribute('data-line'));
      const eleStyle = getComputedStyle(ele);
      let eScrollTop = ele.offsetTop - parseInt(eleStyle.marginTop) - parseInt(previewStyle.paddingTop);
      previewMap.set(line, eScrollTop);
    });
    previewMap.set(totalLineNumber + 1, previewEle.scrollHeight);
  }

  function updateScrollMap() {
    scrollMap.clear();

    let prevScrollTop = 0;
    let prevLine = 0;
    for (let [line, curScrollTop] of previewMap.entries()) {
      const totalLine = line - prevLine;
      let fillLine = 0;
      let curLine = prevLine;
      while (curLine < line) {
        let fillHeight = (fillLine / totalLine) * (curScrollTop - prevScrollTop);
        let eScrollTop = prevScrollTop + fillHeight;

        scrollMap.set(curLine, eScrollTop);

        fillLine++;
        curLine++;
      }
      prevScrollTop = curScrollTop;
      prevLine = line;
    }
  }

  function syncEditorPreview() {
    const curScrollTop = editorEle.scrollTop;
    if (curScrollTop == prevLineScroll) return;

    const scrollLine = Math.floor(curScrollTop / 25) + 1;
    previewEle.scrollTop = scrollMap.get(scrollLine);
    prevLineScroll = previewEle.scrollTop;
  }

  function syncPreviewEditor() {
    const curScrollTop = previewEle.scrollTop;
    if (curScrollTop == prevLineScroll) return;

    for (let [line, eScrollTop] of scrollMap.entries()) {
      if (eScrollTop > curScrollTop) {
        editorEle.scrollTop = (line - 1 - 1) * lineHeight;
        prevLineScroll = editorEle.scrollTop;
        return;
      }
    }
  }


  /* Switch View */
  // code -> preview -> both
  const svgList = [
    '<path d="M13.5 6L10 18.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 8.5L3 12L6.5 15.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 8.5L21 12L17.5 15.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M4 21.4V2.6C4 2.26863 4.26863 2 4.6 2H16.2515C16.4106 2 16.5632 2.06321 16.6757 2.17574L19.8243 5.32426C19.9368 5.43679 20 5.5894 20 5.74853V21.4C20 21.7314 19.7314 22 19.4 22H4.6C4.26863 22 4 21.7314 4 21.4Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5.4V2.35355C16 2.15829 16.1583 2 16.3536 2C16.4473 2 16.5372 2.03725 16.6036 2.10355L19.8964 5.39645C19.9628 5.46275 20 5.55268 20 5.64645C20 5.84171 19.8417 6 19.6464 6H16.6C16.2686 6 16 5.73137 16 5.4Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M12 3H20.4C20.7314 3 21 3.26863 21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H12M12 3H3.6C3.26863 3 3 3.26863 3 3.6V20.4C3 20.7314 3.26863 21 3.6 21H12M12 3V21" stroke-width="1.5"/>'
  ]
  const viewBtn = document.getElementById('view-button');
  const viewSvg = viewBtn.querySelector('svg');
  const splitLine = document.getElementById('split-line');
  let currentView = 0;

  function switchView(view) {
    if (view == 0) {
      // code view
      currentView = 0;
      editorEle.classList.remove('hidden');
      splitLine.classList.add('hidden');
      previewEle.classList.add('hidden');
      previewEle.style.removeProperty('padding-left');
      previewEle.style.removeProperty('padding-right');
      promptWrap.classList.remove('hidden');
    }
    else if (view == 1) {
      // preview
      currentView = 1;
      editorEle.classList.add('hidden');
      splitLine.classList.add('hidden');
      previewEle.classList.remove('hidden');
      previewEle.style.paddingLeft = '50px';
      previewEle.style.paddingRight = '50px';
      promptWrap.classList.add('hidden');
    }
    else if (view == 2) {
      // both view
      currentView = 2;
      editorEle.classList.remove('hidden');
      splitLine.classList.remove('hidden');
      previewEle.classList.remove('hidden');
      previewEle.style.removeProperty('padding-left');
      previewEle.style.removeProperty('padding-right');
      promptWrap.classList.remove('hidden');
    }
    viewSvg.innerHTML = svgList[view];
  }


  /* Preview Area */
  const previewEle = document.getElementById('preview-wrap');
  const previewStyle = getComputedStyle(previewEle);
  let convertedText;


  /* Cursor events */
  document.addEventListener('selectionchange', function () {
    const line = getCursorLine();
    cursorLineHighlight(line);
    updatePrompt(line);
  });

  /* Input events */
  inputEle.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTab();
      handleInput();
    }
  });

  inputEle.addEventListener('input', function () {
    handleInput();
  });

  /* Scroll events */
  scrollbar.addEventListener('scroll', function () {
    syncScrollBarInput();
  });

  inputEle.addEventListener('scroll', function () {
    syncInputScrollBar();
    backdropEle.scrollTop = inputEle.scrollTop;
  });

  editorEle.addEventListener('scroll', function () {
    syncEditorPreview();
  });

  previewEle.addEventListener('scroll', function () {
    syncPreviewEditor();
  });

  /* Window resize events */
  window.addEventListener("resize", function () {
    fit();
    updatePreviewMap();
    updateScrollMap();
  });

  /* Button events */
  viewBtn.addEventListener('click', function () {
    currentView++;
    if (currentView > 2) currentView = 0;
    switchView(currentView);

    convertMarkdown();
    updatePreviewMap();
    updateScrollMap();
    fit();
  });

  const saveBtn = document.getElementById('save-button');
  saveBtn.addEventListener('click', function () {
    window.customAPI.saveMarkdown(inputEle.value);
  });

  const importBtn = document.getElementById('import-button');
  importBtn.addEventListener('click', function () {
    const content = window.customAPI.importMarkdown();
    if (content != null) {
      inputEle.value = content;
      handleInput();
    }
  });

  const exportBtn = document.getElementById('pdf-button');
  exportBtn.addEventListener('click', function () {
    convertMarkdown();
    switchView(1);
    window.customAPI.exportPdf();
  });

  /* Recording */
  const recordBtn = document.getElementById('record-button');
  const transcriptWrap = document.getElementById('transcript-wrap');
  let recording = false;
  recordBtn.addEventListener('click', function () {
    if (recording == false) {
      recording = true;
      window.customAPI.startRecord();
      transcriptWrap.classList.remove('hidden');
      transcriptWrap.appendChild(document.createElement('ul'));
      recordBtn.classList.add('side-icon-active');
      recordBtn.dataset.name = "already active";
    }
  });

  const closeRecBtn = document.getElementById('close-record');
  closeRecBtn.addEventListener('click', function () {
    if (recording) {
      recording = false;
      window.customAPI.stopRecord();
      transcriptWrap.classList.add('hidden');
      const transcriptList = document.querySelector('#transcript-wrap ul');
      transcriptList.remove();
      recordBtn.classList.remove('side-icon-active');
      recordBtn.dataset.name = "voice command";
    }
  });

  /* Dragging transcript-wrap */
  let isDragging = false;
  let offsetX, offsetY;

  transcriptWrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - transcriptWrap.getBoundingClientRect().left;
    offsetY = e.clientY - transcriptWrap.getBoundingClientRect().top;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      transcriptWrap.style.left = `${x}px`;
      transcriptWrap.style.top = `${y}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    if (!isElementInViewport(transcriptWrap)) {
      transcriptWrap.style.left = '50px';
      transcriptWrap.style.top = `185px`;
    }
  });

  /* Position Prompt */
  const promptWrap = document.getElementById('prompt-wrap');
  function updatePrompt(line) {
    let col = inputEle.selectionStart - lineIndex[line - 1];
    let sel = inputEle.selectionEnd - inputEle.selectionStart;
    if (sel != 0) {
      promptWrap.textContent = 'line ' + line + ', col ' + col + ', sel ' + sel;
    }
    else {
      promptWrap.textContent = 'line ' + line + ', col ' + col;
    }
  }

  /* Setting Menu */
  const setBtn = document.getElementById('setting-button');
  const setEle = document.getElementById('setting-wrap');
  let setActive = false;
  setBtn.addEventListener('click', function () {
    if (!setActive) {
      editorEle.classList.add('hidden');
      splitLine.classList.remove('hidden');
      previewEle.classList.remove('hidden');
      setActive = true;

      const sideIcons = document.querySelectorAll('.side-icon');
      sideIcons.forEach(icon => {
        if (icon.id != 'setting-button') {
          icon.classList.add('inactive');
        }
      });
    }
    else {
      switchView(currentView);
      setActive = false;

      const sideIcons = document.querySelectorAll('.side-icon');
      sideIcons.forEach(icon => {
        if (icon.id != 'setting-button') {
          icon.classList.remove('inactive');
        }
      });

      window.customAPI.saveUser();
    }

    setEle.classList.toggle('hidden');
  });

  /* Handle setting */
  function changeUserSetting(property, value) {
    rootEle.style.setProperty(property, value);
    window.customAPI.changeUser(property, value);
  }

  const darkSwitch = document.getElementById('dark-switch');
  if (window.customAPI.getUser('--primary-color') == '#F7F9F7') darkSwitch.checked = true;
  darkSwitch.addEventListener('change', function () {
    if (darkSwitch.checked) {
      // dark mode on
      changeUserSetting('--primary-color', '#F7F9F7');
      changeUserSetting('--background-color', '#31393C');
      changeUserSetting('--scrollbar-color', '#F7F9F785');
    }
    else {
      // light mode
      changeUserSetting('--primary-color', '#31393C');
      changeUserSetting('--background-color', '#F7F9F7');
      changeUserSetting('--scrollbar-color', '#31393c85');
    }
  });

  const secondColor = document.getElementById('second-color');
  secondColor.value = window.customAPI.getUser('--secondary-color');
  secondColor.addEventListener('change', function () {
    changeUserSetting('--secondary-color', secondColor.value);
  });

  const accentColor = document.getElementById('accent-color');
  accentColor.value = window.customAPI.getUser('--accent-color');
  accentColor.addEventListener('change', function () {
    changeUserSetting('--accent-color', accentColor.value);
    changeUserSetting('--icon-hover-background', accentColor.value.toString() + '60');
  });


  /* Search */
  let searching = false;
  const searchWrap = document.getElementById('search-wrap');
  const keyword = document.getElementById('keyword');
  const closeSrcBtn = document.getElementById('close-search');

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey) {
      if (e.key == 'f' || e.key == 'F') {
        searchWrap.classList.remove('hidden');
        keyword.focus();
        searching = true;
      }
    }
  });

  closeSrcBtn.addEventListener('mousedown', function () {
    searchWrap.classList.add('hidden');
    keyword.value = "";
    searching = false;
    wordHighlightEle.innerHTML = "";
  });

  keyword.addEventListener("input", function () {
    wordHighlight(keyword.value);
  });

})


function escapeHtml(text) {
  return text.replace(/[&<>"'/]/g, function (match) {
    const escapeMap = {
      '&': '&amp',
      '<': '&lt',
      '>': '&gt',
      '"': '&quot',
      "'": '&#39',
      '/': '&#x2F'
    }
    return escapeMap[match];
  });
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}