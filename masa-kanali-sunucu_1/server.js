// Masa Kanalı — küçük oyun sunucusu.
// Sayfayı sunar ve aynı oda kodundaki oyuncular arasında "presence" mesajlarını aktarır.
// Oyunun fiziği kaptanın (odayı ilk kuran) tarayıcısında çalışır; sunucu sadece aktarıcıdır.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const THREE = path.join(__dirname, 'node_modules', 'three', 'build', 'three.min.js');
const MAX_MSG = 8 * 1024;          // bir mesaj en fazla 8 KB
const MAX_PER_SEC = 80;            // istemci başına saniyede en fazla mesaj
const MAX_PER_ROOM = 8;

const files = {
  '/': { file: path.join(PUBLIC, 'index.html'), type: 'text/html; charset=utf-8' },
  '/index.html': { file: path.join(PUBLIC, 'index.html'), type: 'text/html; charset=utf-8' },
  '/three.min.js': { file: THREE, type: 'application/javascript; charset=utf-8' },
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  const f = files[url];
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
  fs.readFile(f.file, (err, data) => {
    if (err) { res.writeHead(500); return res.end('Sunucu hatası'); }
    res.writeHead(200, { 'content-type': f.type, 'cache-control': url === '/three.min.js' ? 'public, max-age=86400' : 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MSG });
const clients = new Map(); // peer -> { ws, presence, code, budget, last }
let nextId = 1;

const validCode = (c) => typeof c === 'string' && /^[A-Z0-9]{4}$/.test(c);
function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function members(code) { const out = []; for (const [peer, c] of clients) if (code && c.code === code) out.push([peer, c]); return out; }

function roomsSummary() {
  const rooms = {};
  for (const [, c] of clients) {
    if (!c.code || !c.presence.j) continue;
    const r = rooms[c.code] || (rooms[c.code] = { code: c.code, names: [], playing: false });
    r.names.push(typeof c.presence.n === 'string' ? c.presence.n.slice(0, 14) : 'Oyuncu');
    const st = c.presence.st;
    if (st && typeof st === 'object' && st.ph && st.ph !== 'lobby') r.playing = true;
  }
  return { t: 'rooms', n: clients.size, rooms: Object.values(rooms).slice(0, 30) };
}
let summaryDirty = true;
setInterval(() => {
  if (!summaryDirty) return;
  summaryDirty = false;
  const msg = JSON.stringify(roomsSummary());
  for (const [, c] of clients) if (c.ws.readyState === 1) c.ws.send(msg);
}, 1000);

wss.on('connection', (ws) => {
  const peer = 'p' + (nextId++).toString(36) + Math.random().toString(36).slice(2, 6);
  const me = { ws, presence: {}, code: '', budget: MAX_PER_SEC, last: Date.now() };
  clients.set(peer, me);
  send(ws, { t: 'hello', peer });
  send(ws, roomsSummary());
  summaryDirty = true;

  ws.on('message', (raw) => {
    const now = Date.now();
    me.budget = Math.min(MAX_PER_SEC, me.budget + ((now - me.last) / 1000) * MAX_PER_SEC);
    me.last = now;
    if (me.budget < 1) return; // fazla hızlı: mesajı at
    me.budget -= 1;
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
    if (!msg || msg.t !== 'p' || typeof msg.presence !== 'object' || msg.presence === null || Array.isArray(msg.presence)) return;

    const presence = msg.presence;
    let code = validCode(presence.c) ? presence.c : '';
    if (code && code !== me.code && members(code).length >= MAX_PER_ROOM) {
      send(ws, { t: 'full', code });
      code = '';
      delete presence.c;
    }
    me.presence = presence;

    if (code !== me.code) {
      // odadan ayrıl
      for (const [p, c] of members(me.code)) if (p !== peer) send(c.ws, { t: 'left', peer });
      me.code = code;
      // yeni odanın mevcut halini gönder, diğerlerine haber ver
      send(ws, { t: 'reset', list: members(code).filter(([p]) => p !== peer).map(([p, c]) => ({ peer: p, presence: c.presence })) });
      summaryDirty = true;
    }
    if (me.code) {
      const out = JSON.stringify({ t: 'p', peer, presence });
      for (const [p, c] of members(me.code)) if (p !== peer && c.ws.readyState === 1) c.ws.send(out);
    }
    if (presence.n !== undefined || presence.st === undefined) summaryDirty = true;
  });

  ws.on('close', () => {
    for (const [p, c] of members(me.code)) if (p !== peer) send(c.ws, { t: 'left', peer });
    clients.delete(peer);
    summaryDirty = true;
  });
  ws.on('error', () => {});
});

// Bağlantısı kopan istemcileri temizle
setInterval(() => {
  for (const [, c] of clients) {
    if (c.ws.isAlive === false) { c.ws.terminate(); continue; }
    c.ws.isAlive = false;
    try { c.ws.ping(); } catch (e) {}
  }
}, 20000);
wss.on('connection', (ws) => { ws.isAlive = true; ws.on('pong', () => (ws.isAlive = true)); });

server.listen(PORT, () => console.log('Masa Kanalı çalışıyor: http://localhost:' + PORT));
