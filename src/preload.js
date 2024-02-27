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