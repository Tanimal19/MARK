<div align="center">
  <img alt="Victor Logo" src="https://github.com/Tanimal19/Victor/blob/2780a488d727fe62bc0f57a9ab6769f92bfcdbf7/Logo(no%20text).svg" width="120px">
  <br>
  <br>
  <strong>
    <p>Victor</p>
  </strong>
  <p>
    simple markdown editor
  </p>
</div>

# About

**Victor** is a simple markdown editor that is inspired by [Obsidian](https://obsidian.md/)  
As a noob in computer science, I start this project to improve myself at my sophomore winter vacation.  
While this is just a project for fun and learning, if you're interested, you can still download it to take a look.  
I would greatly appreciate any feedback.

Demo Video: <https://www.youtube.com/watch?v=4kHRNkl6V8Y>

<br>
<br>

# Feature

- support basic markdown rules
- indents in markdown
- three preview mode (Code/Preview/Both)
- light mode/dark mode
- search keyword in markdown
- import/export markdown file
- export to pdf file

<br>
<br>

# Devlog 📝

- 1/7
  - Use `<textarea>` to handle input
  - Line numbers
  - Cursor line highlight
<br>

- 1/8
  - Fixed horizontal scroll bar for input area
  - And some UI fix
<br>

- 1/9
  - **Realized that my code was a mess**
  - Adjust variable naming logic
  - Change program flow
<br>

- 1/10
  - Use [markdown-it](https://github.com/markdown-it/markdown-it) to implement markdown convert
  - Spend a lot of time figuring out what the hell is **electron IPC**
<br>

- 1/11
  - Markdown converting is done
<br>

- 1/13
  - You can insert tab in `<textarea>` now
  - **However, markdown can't convert tab space to preview**
  - Code block highlight
<br>

- 1/14
  - Spend a lot of time figuring out source code of **markdown-it** (6000+ lines drives me crazy)
  - Finally, tab space can appear in markdown preview
  - Disable indent code block, because it's annoying
<br>

- 1/15
  - Improve some css, looks prettier!
<br>

- 1/16
  - Sync scroll between Input and Preview area (but it's not smooth enough)
<br>

- 1/17
  - Switch view between `Code`, `Preview`, `Both`
  - UI improve
<br>

- 1/18
  - Import and Save markdown files
<br>

- 1/22
  - Export PDF using [puppeteer](https://pptr.dev/api/puppeteer.page.pdf)
<br>

- 2/13
  - Build up setting menu (but only a few features)
  - User can switch between light and dark mode
<br>

- 2/14
  - Applying JSON to store user's settings
<br>

- 2/15
  - Position prompt: display line and column at bottom right
<br>

- 2/16
  - Making logo of `victor` (which is not so good)
<br>

- 2/27
  - Some UI improve
  - Add searching (search and highlight)
<br>
