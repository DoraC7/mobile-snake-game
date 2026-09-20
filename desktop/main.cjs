const { app, BrowserWindow, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '127.0.0.1';
const WEB_ROOT = path.join(__dirname, '..', 'dist');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function createLocalServer(token) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, `http://${HOST}`);
    const cookieToken = request.headers.cookie?.split(';').map((item) => item.trim())
      .find((item) => item.startsWith('snake_session='))?.slice('snake_session='.length);
    const queryToken = requestUrl.searchParams.get('token');
    if (queryToken !== token && cookieToken !== token) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(WEB_ROOT, relativePath);
    if (!filePath.startsWith(`${path.resolve(WEB_ROOT)}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Referrer-Policy': 'no-referrer',
        ...(queryToken === token ? { 'Set-Cookie': `snake_session=${token}; HttpOnly; SameSite=Strict; Path=/` } : {}),
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(data);
    });
  });
}

function createWindow(port, token) {
  const win = new BrowserWindow({
    width: 540,
    height: 900,
    minWidth: 390,
    minHeight: 620,
    backgroundColor: '#080c18',
    title: 'Snake',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.removeMenu();
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = `http://${HOST}:${port}/`;
    if (!url.startsWith(allowed)) event.preventDefault();
  });
  win.loadURL(`http://${HOST}:${port}/?token=${encodeURIComponent(token)}`);
}

let server;
app.whenReady().then(() => {
  const token = require('node:crypto').randomBytes(32).toString('hex');
  server = createLocalServer(token);
  server.listen(0, HOST, () => {
    const address = server.address();
    createWindow(address.port, token);
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const address = server.address();
      createWindow(address.port, token);
    }
  });
});

app.on('window-all-closed', () => {
  server?.close();
  if (process.platform !== 'darwin') app.quit();
});