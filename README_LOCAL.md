# Sửa Bài Local

Sửa Bài is a local AI content editing and generation tool.
It is designed for rewriting, improving, and producing Vietnamese marketing content
without requiring a separate hosted API from the original reference product.

## Run

```powershell
npm install
npm run dev
```

Open the local URL printed by the server, for example:

```text
http://localhost:3002/
```

## AI setup

In the left panel:

- `API key`: your AI provider key.
- `Model`: default is `gpt-4.1-mini`.
- `Base URL`: leave empty for OpenAI Responses API. Set this only for an
  OpenAI-compatible provider, where the app will call
  `<baseUrl>/chat/completions`.

The key is stored in browser `localStorage` for internal use. Do not deploy this
as a public app without moving secrets to server-side environment variables.

## Features

- Three modes: quick, basic, advanced.
- Advanced two-pass workflow: angle strategy first, final copy second.
- Vietnamese prompt engine with anti-generic and anti-fabrication rules.
- Local template presets.
- Local generation history.
- Copy output.

## Verification

```powershell
node --test app\lib\ai-client.test.js app\lib\prompt-engine.test.js
npm run lint
npm run build
```
