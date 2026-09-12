// Small CDP helper using the installed Chromium/Edge and Node's built-in WebSocket.
// No download, package installation or production dependency.
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hubRoot = fileURLToPath(new URL('../', import.meta.url));
export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function launchBrowser() {
  const candidates = [process.env.HUB_BROWSER, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
  let executable;
  for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch { /* Try next installed browser. */ } }
  if (!executable) throw new Error('Kein vorhandener Chromium-Browser gefunden. HUB_BROWSER auf eine installierte Browserdatei setzen. Es wird nichts installiert.');
  const directory = await mkdtemp(path.join(hubRoot, '.browser-'));
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${directory}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', '--disable-default-apps', '--disable-crash-reporter', '--disable-features=Translate,MediaRouter', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let spawnError; child.on('error', error => { spawnError = error; });
  let connection, closing = false;
  async function cleanup() {
    if (closing) return; closing = true;
    if (connection) { try { await connection.call('Browser.close'); } catch { /* Closing socket is normal. */ } connection.socket.close(); }
    for (let i = 0; i < 30 && child.exitCode === null; i++) await pause(100);
    if (child.exitCode === null) child.kill();
    // Verify the absolute directory before recursive cleanup; never touch outside Hub.
    const realRoot = await realpath(hubRoot), realTarget = await realpath(directory);
    if (path.dirname(realTarget) !== realRoot || !path.basename(realTarget).startsWith('.browser-')) throw new Error('Unsicheres Browser-Aufräumziel.');
    await rm(realTarget, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
  try {
    let endpoint;
    for (let i = 0; i < 120; i++) {
      if (spawnError) throw spawnError;
      try { const [port, route] = (await readFile(path.join(directory, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/); endpoint = `ws://127.0.0.1:${port}${route}`; break; } catch { await pause(100); }
    }
    if (!endpoint) throw new Error('Browser-Debugging-Schnittstelle wurde nicht bereit.');
    const socket = new WebSocket(endpoint), pending = new Map(), listeners = new Set(); let id = 0;
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = pending.get(message.id); if (!request) return; pending.delete(message.id); clearTimeout(request.timer);
        message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
      } else for (const listener of listeners) listener(message);
    });
    socket.addEventListener('close', () => { for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Browserverbindung geschlossen.')); } pending.clear(); });
    const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP-Zeitlimit: ${method}`)); }, 15000);
      pending.set(requestId, { resolve, reject, timer }); socket.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    connection = { socket, call };
    return {
      executable, close: cleanup,
      async page({ beforeScript = '', routes = {}, width = 1440, height = 1000, scripts = true } = {}) {
        const { browserContextId } = await call('Target.createBrowserContext');
        const { targetId } = await call('Target.createTarget', { url: 'about:blank', browserContextId });
        const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
        const send = (method, params) => call(method, params, sessionId);
        const errors = [], requests = [], routeErrors = [];
        const listener = message => {
          if (message.sessionId !== sessionId) return;
          if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ' ' + (message.params.exceptionDetails.exception?.description || ''));
          if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
          if (message.method === 'Fetch.requestPaused') {
            const { requestId, request } = message.params, route = routes[new URL(request.url).pathname];
            (async () => {
              if (!route) return send('Fetch.continueRequest', { requestId });
              if (route.delay) await pause(route.delay);
              if (route.fail) return send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
              return send('Fetch.fulfillRequest', { requestId, responseCode: route.status || 200,
                responseHeaders: [{ name: 'Content-Type', value: route.type || 'application/json' }],
                body: Buffer.from(typeof route.body === 'string' ? route.body : JSON.stringify(route.body)).toString('base64') });
            })().catch(error => routeErrors.push(error));
          }
        };
        listeners.add(listener);
        await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
        if (beforeScript) await send('Page.addScriptToEvaluateOnNewDocument', { source: beforeScript });
        if (!scripts) await send('Emulation.setScriptExecutionDisabled', { value: true });
        if (Object.keys(routes).length) await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
        const evaluate = async expression => {
          const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
          if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
          return result.result.value;
        };
        const waitFor = async (expression, timeout = 12000) => {
          const start = Date.now(); let lastError;
          while (Date.now() - start < timeout) { try { if (await evaluate(expression)) return; } catch (error) { lastError = error; } await pause(50); }
          throw new Error(`Browser-Bedingung nicht erfüllt: ${expression}${lastError ? ` (${lastError.message})` : ''}`);
        };
        return { send, evaluate, waitFor, errors, requests, routeErrors,
          async go(url, ready = true) { await send('Page.navigate', { url }); if (ready) await waitFor('document.getElementById("hub-startup")?.hidden === true'); },
          async reload() { await send('Page.reload', { ignoreCache: true }); await pause(80); await waitFor('document.getElementById("hub-startup")?.hidden === true'); },
          async key(key, modifiers = 0) { const windowsVirtualKeyCode = key === 'Escape' ? 27 : key === 'Tab' ? 9 : key === 'Enter' ? 13 : undefined; await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode, modifiers }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode, modifiers }); if (key === 'Enter') await send('Runtime.evaluate', { expression: 'if (document.activeElement instanceof HTMLButtonElement) document.activeElement.click()', userGesture: true }); },
          async close() { listeners.delete(listener); await call('Target.disposeBrowserContext', { browserContextId }); },
        };
      },
    };
  } catch (error) { await cleanup(); throw error; }
}
