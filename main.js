const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let syncProcess = null;

function startSyncServer() {
  const fs = require('fs');
  const path = require('path');
  const http = require('http');
  const { spawn } = require('child_process');

  let serverLaunched = false;

  function launchBackgroundServer() {
    if (serverLaunched) return;
    serverLaunched = true;

    const nodeBinary = fs.existsSync('C:\\Program Files\\nodejs\\node.exe')
      ? 'C:\\Program Files\\nodejs\\node.exe'
      : (fs.existsSync('C:\\Program Files (x86)\\nodejs\\node.exe')
          ? 'C:\\Program Files (x86)\\nodejs\\node.exe'
          : 'node');

    const candidatePaths = [
      path.join(process.resourcesPath || '', 'sync_server_3008.js'),
      path.join(__dirname, 'sync_server_3008.js'),
      'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\sync_server_3008.js',
      path.join('C:', 'Users', 'JOSUE', 'AppData', 'Local', 'Programs', 'NEXUS POS ENTERPRISE', 'resources', 'sync_server_3008.js')
    ];

    const realServerPath = candidatePaths.find(p => p && fs.existsSync(p));
    const workDir = realServerPath ? path.dirname(realServerPath) : process.cwd();

    if (realServerPath) {
      try {
        syncProcess = spawn(nodeBinary, [realServerPath], {
          cwd: workDir,
          detached: true,
          windowsHide: true,
          stdio: 'ignore'
        });
        syncProcess.unref();
        console.log(`🚀 [NEXUS ELECTRON] Servidor Node background activo en silencio (Firewall OK): ${realServerPath}`);
      } catch (e) {
        console.error('Error lanzando proceso node background:', e);
        try {
          require(realServerPath);
        } catch (err) {}
      }
    }
  }

  // Comprobar si ya está respondiendo en puerto 3008
  const checkReq = http.get('http://127.0.0.1:3008/api/ping', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ [NEXUS] Servidor de sincronización 3008 ya está activo y respondiendo.');
    } else {
      launchBackgroundServer();
    }
  });

  checkReq.on('error', () => {
    launchBackgroundServer();
  });

  checkReq.setTimeout(1000, () => {
    checkReq.destroy();
    launchBackgroundServer();
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.ico');
  
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'NEXUS POS ENTERPRISE',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Interceptar la apertura de URLs externas (WhatsApp, links web) para abrir en el navegador/app predeterminada del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://api.whatsapp.com') || url.startsWith('https://wa.me') || url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.maximize();

  const distHtml = path.join(__dirname, 'caja_local', 'frontend', 'dist', 'index.html');
  const localHtml = path.join(__dirname, 'index.html');

  if (require('fs').existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else if (require('fs').existsSync(localHtml)) {
    mainWindow.loadFile(localHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


// ==========================================
// IPC HANDLERS: GESTIÓN DE IMPRESORAS Y TICKETS
// ==========================================
ipcMain.handle('get-system-printers', async (event) => {
  try {
    const printers = await event.sender.getPrintersAsync();
    console.log('[NEXUS IMPRESORAS DETECTADAS]:', printers.map(p => p.name));
    return printers;
  } catch (err) {
    console.error('Error al obtener impresoras del sistema:', err);
    return [];
  }
});

ipcMain.handle('print-ticket-html', async (event, { html, deviceName, silent, copies, ticketWidth }) => {
  try {
    const is80 = ticketWidth === '80mm';
    // Ancho a 96 DPI: 58mm = ~219px (usamos 215), 80mm = ~302px (usamos 300)
    const winWidth = is80 ? 300 : 215;

    const printWin = new BrowserWindow({
      show: false,
      width: winWidth,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    return new Promise((resolve) => {
      const useSilent = silent === true && Boolean(deviceName);
      if (!useSilent) {
        try { printWin.show(); } catch(_) {}
      }
      printWin.webContents.print(
        {
          silent: useSilent,
          printBackground: true,
          deviceName: deviceName || '',
          margins: { marginType: 'none' },
          copies: copies || 1
        },
        (success, failureReason) => {
          setTimeout(() => {
            try {
              if (!printWin.isDestroyed()) printWin.close();
            } catch(e) {}
          }, 1200);
          resolve({ success, failureReason });
        }
      );
    });
  } catch (err) {
    console.error('Error al imprimir ticket:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  startSyncServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (syncProcess && !syncProcess.killed) {
    try {
      syncProcess.kill();
    } catch(e) {}
  }
});
