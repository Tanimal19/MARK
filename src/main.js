const { app, BrowserWindow, Menu, ipcMain, dialog, shell, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');


// Apple user setting
const jsonFile = './src/extraResources/victor.json';
//const jsonFile = path.join(process.resourcesPath, 'victor.json');
let jsonData = fs.readFileSync(jsonFile);
let jsonObj = JSON.parse(jsonData);

/*
 *  Apply markdown-it
 *  modified markdown-it/dist/index.cjs.js
 *  [3385] remove indent code blocks
 *  [3363] [3778] reserve every space in paragraph
 */
const md = require('markdown-it')({
  // Enable HTML tags in source
  html: true,

  // Use '/' to close single tags (<br />).
  // This is only for full CommonMark compatibility.
  xhtmlOut: false,

  // Convert '\n' in paragraphs into <br>
  breaks: true,

  // CSS language prefix for fenced blocks. Can be
  // useful for external highlighters.
  langPrefix: 'language-',

  // Autoconvert URL-like text to links
  linkify: true,

  // Enable some language-neutral replacement + quotes beautification
  // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.mjs
  typographer: false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: '“”‘’',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (__) { }
    }

    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(require('markdown-it-imsize'), { autofill: true });
const hljs = require('highlight.js/lib/common');

// Inject line number for each first level elements
function injectLineNumbers(tokens, idx, options, env, slf) {
  let line;
  if (tokens[idx].map && tokens[idx].level === 0) {
    line = tokens[idx].map[0];
    tokens[idx].attrJoin("class", "line");
    tokens[idx].attrSet("data-line", String(line + 1));
  }
  return slf.renderToken(tokens, idx, options, env, slf);
}
md.renderer.rules.paragraph_open = md.renderer.rules.heading_open = injectLineNumbers;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  Menu.setApplicationMenu(null);
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  mainWindow.webContents.send('applyUser', jsonObj);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


//console.log(systemPreferences.getMediaAccessStatus('microphone'));

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("mdConvert", (event, text) => {
  event.returnValue = md.render(text);
});

ipcMain.on("saveMarkdown", (event, content) => {
  const savePath = dialog.showSaveDialogSync(mainWindow, {
    title: 'save new markdown file',
    defaultPath: path.join(app.getPath('documents'), 'new.md')
  });
  if (savePath == undefined) {
    console.log('save failed');
  }
  else {
    fs.writeFileSync(savePath, content);
  }
});

ipcMain.on("importMarkdown", (event) => {
  const importPath = dialog.showOpenDialogSync(mainWindow, {
    title: 'import markdown file',
    defaultPath: app.getPath('documents'),
    properties: ['openFile']
  });
  if (importPath == undefined) {
    console.log('import failed');
    event.returnValue = null;
  }
  else {
    event.returnValue = fs.readFileSync(importPath[0], { encoding: 'utf8' });
  }
});

ipcMain.on("exportPdf", (event, content, styleText) => {
  const exportPath = dialog.showSaveDialogSync(mainWindow, {
    title: 'export as pdf',
    defaultPath: path.join(app.getPath('documents'), 'export.pdf')
  });
  if (exportPath == undefined) {
    console.log('export failed');
  }
  else {
    (async () => {
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.emulateMediaType('screen');

      // 載入 HTML 內容
      await page.setContent(content);
      await page.addStyleTag({ path: path.join(__dirname, 'index.css') });
      // https://github.com/puppeteer/puppeteer/issues/422#issuecomment-708142856
      await page.evaluateHandle('document.fonts.ready');

      // 生成 PDF
      await page.pdf({
        displayHeaderFooter: false,
        landscape: false,
        margin: undefined,
        path: exportPath,
        format: 'A4',
        printBackground: true
      });

      // 關閉瀏覽器
      await browser.close();

      await shell.showItemInFolder(exportPath);
    })();
  }
});

ipcMain.on("saveUser", (event, jsonObj) => {
  fs.writeFileSync(jsonFile, JSON.stringify(jsonObj));
});
