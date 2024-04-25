// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

let jsonObj;
ipcRenderer.once('applyUser', function (event, jsonObjL) {
  jsonObj = jsonObjL;
  const rootEle = document.documentElement;
  for (const key in jsonObj) {
    rootEle.style.setProperty(key, jsonObj[key]);
  }
  rootEle.style.setProperty('--line-height-r', '-' + jsonObj['--line-height']);
});

contextBridge.exposeInMainWorld(
  "customAPI", {
  mdConvert: (text) => {
    return ipcRenderer.sendSync("mdConvert", text);
  },
  saveMarkdown: (content) => {
    ipcRenderer.send("saveMarkdown", content);
    return;
  },
  importMarkdown: () => {
    return ipcRenderer.sendSync("importMarkdown");
  },
  exportPdf: () => {
    const previewEle = document.getElementById('preview-wrap');
    const content = previewEle.outerHTML;
    ipcRenderer.send("exportPdf", content);
    return;
  },
  startRecord: () => {
    ipcRenderer.send("startRecord");
    ipcRenderer.on('transcript', function (event, str) {
      const transcriptList = document.querySelector('#transcript-wrap ul');
      const item = document.createElement('li');
      item.textContent = str;
      transcriptList.appendChild(item);
      const transcriptWrap = document.getElementById('transcript-wrap');
      transcriptWrap.scrollTop = transcriptWrap.scrollHeight;

      identifyCommand(str);
    });
    return;
  },
  stopRecord: () => {
    ipcRenderer.send("stopRecord");
    ipcRenderer.removeAllListeners('transcript');
    return;
  },
  getUser: (property) => {
    return jsonObj[property];
  },
  changeUser: (property, value) => {
    jsonObj[property] = value;
    return;
  },
  saveUser: () => {
    ipcRenderer.send("saveUser", jsonObj);
    return;
  },
}
);

let selectedText;

function identifyCommand(str) {
  const inputEle = document.getElementById('input-textarea');
  const start = inputEle.selectionStart;
  const end = inputEle.selectionEnd;

  const args = str.split(' ');

  switch (args[0]) {
    case "input":
      const inputText = str.substring(str.indexOf(' ') + 1).trim();

      const oldValue = inputEle.value;
      const newValue = oldValue.substring(0, start) + inputText + oldValue.substring(end);
      inputEle.value = newValue;

      inputEle.focus();
      inputEle.selectionStart = inputEle.selectionEnd = end + inputText.length;
      break;

    case "select":
      inputEle.selectionStart = parseInt(args[1]);
      inputEle.selectionEnd = parseInt(args[2]);
      break;

    case "delete":
      break;

    default:
      console.log("unknown command");

  }
}