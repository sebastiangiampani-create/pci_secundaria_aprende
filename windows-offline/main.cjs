const { app, BrowserWindow, Menu, dialog, protocol, net, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_ID = 'ar.edu.pci.secundariaaprende';
const APP_TITLE = 'PCI Secundaria Aprende';
const BACKUP_FORMAT = 'pci-secundaria-aprende-localstorage-v1';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'pci',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
if (portableDir) {
  const portableDataDir = path.join(portableDir, 'PCI-Datos');
  fs.mkdirSync(portableDataDir, { recursive: true });
  app.setPath('userData', portableDataDir);
}

function appRoot() {
  return path.join(process.resourcesPath, 'app');
}

function safeAppFile(requestUrl) {
  const url = new URL(requestUrl);
  let pathname = decodeURIComponent(url.pathname || '/');
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const relativePath = pathname.replace(/^\/+/, '');
  const root = appRoot();
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function registerOfflineProtocol() {
  protocol.handle('pci', async (request) => {
    const target = safeAppFile(request.url);
    if (!target) return new Response('Acceso denegado', { status: 403 });
    try {
      return await net.fetch(pathToFileURL(target).toString());
    } catch {
      return new Response('Archivo no encontrado', { status: 404 });
    }
  });
}

function redirectExternalRuntimeAssets() {
  const ses = session.defaultSession;
  ses.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      const url = details.url;

      if (url.startsWith('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/')) {
        return callback({ redirectURL: 'pci://app/_offline/vendor/xlsx.full.min.js' });
      }
      if (url.startsWith('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/')) {
        return callback({ redirectURL: 'pci://app/_offline/vendor/exceljs.min.js' });
      }
      if (url.startsWith('https://fonts.googleapis.com/')) {
        return callback({ redirectURL: 'pci://app/_offline/google-fonts.css' });
      }
      if (url.startsWith('https://fonts.gstatic.com/')) {
        return callback({ cancel: true });
      }
      if (url.startsWith('https://licensebuttons.net/')) {
        return callback({ redirectURL: 'pci://app/_offline/cc-badge.svg' });
      }

      return callback({ cancel: true });
    }
  );
}

async function readLocalStorage(win) {
  const raw = await win.webContents.executeJavaScript(
    `JSON.stringify((()=>{const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);out[k]=localStorage.getItem(k);}return out;})())`,
    true
  );
  return JSON.parse(raw || '{}');
}

async function exportBackup(win) {
  const storage = await readLocalStorage(win);
  const stamp = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(win, {
    title: 'Exportar respaldo completo',
    defaultPath: path.join(app.getPath('documents'), `PCI-Respaldo-${stamp}.json`),
    filters: [{ name: 'Respaldo PCI', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return;

  const payload = {
    format: BACKUP_FORMAT,
    app: APP_TITLE,
    source: 'r37-windows-offline',
    createdAt: new Date().toISOString(),
    storage
  };
  fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf8');
  await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Respaldo creado',
    message: 'El respaldo completo fue guardado correctamente.',
    detail: result.filePath
  });
}

async function importBackup(win) {
  const selected = await dialog.showOpenDialog(win, {
    title: 'Restaurar respaldo completo',
    properties: ['openFile'],
    filters: [{ name: 'Respaldo PCI', extensions: ['json'] }]
  });
  if (selected.canceled || !selected.filePaths[0]) return;

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(selected.filePaths[0], 'utf8'));
  } catch {
    await dialog.showMessageBox(win, {
      type: 'error',
      title: 'Respaldo inválido',
      message: 'No se pudo leer el archivo seleccionado.'
    });
    return;
  }

  if (payload?.format !== BACKUP_FORMAT || !payload.storage || typeof payload.storage !== 'object') {
    await dialog.showMessageBox(win, {
      type: 'error',
      title: 'Respaldo inválido',
      message: 'El archivo no corresponde a un respaldo completo de PCI Secundaria Aprende.'
    });
    return;
  }

  const confirm = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Cancelar', 'Restaurar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Restaurar respaldo',
    message: 'La información local actual será reemplazada por la del respaldo.',
    detail: 'Esta operación no modifica ninguna versión online.'
  });
  if (confirm.response !== 1) return;

  const serialized = JSON.stringify(payload.storage);
  await win.webContents.executeJavaScript(
    `(()=>{const data=${serialized};localStorage.clear();for(const [k,v] of Object.entries(data)){localStorage.setItem(k,String(v));}return true;})()`,
    true
  );
  win.webContents.reload();
}

function buildMenu(win) {
  return Menu.buildFromTemplate([
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Exportar respaldo completo...',
          accelerator: 'Ctrl+Shift+S',
          click: () => exportBackup(win)
        },
        {
          label: 'Restaurar respaldo completo...',
          click: () => importBackup(win)
        },
        { type: 'separator' },
        {
          label: 'Abrir carpeta de datos locales',
          click: () => shell.openPath(app.getPath('userData'))
        },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { role: 'resetZoom', label: 'Tamaño normal' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    }
  ]);
}

function createSplash() {
  const splash = new BrowserWindow({
    width: 760,
    height: 520,
    frame: false,
    transparent: false,
    resizable: false,
    show: false,
    center: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });
  splash.once('ready-to-show', () => splash.show());
  splash.loadURL('pci://app/_offline/splash.html');
  return splash;
}

function injectOfflineBranding(win) {
  try {
    const source = fs.readFileSync(path.join(appRoot(), '_offline', 'branding-runtime.js'), 'utf8');
    win.webContents.executeJavaScript(source, true).catch(() => {});
  } catch {}
}

function createWindow() {
  const splash = createSplash();
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: APP_TITLE,
    autoHideMenuBar: false,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  Menu.setApplicationMenu(buildMenu(win));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('pci://')) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  win.webContents.on('did-finish-load', () => injectOfflineBranding(win));
  win.once('ready-to-show', () => {
    win.show();
    if (!splash.isDestroyed()) splash.close();
  });

  win.loadURL('pci://app/index.html');
  return win;
}

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);
  registerOfflineProtocol();
  redirectExternalRuntimeAssets();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
