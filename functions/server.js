/**
 * HOME UP — сервер
 * Запуск: node server.js
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
const DB_FILE = path.join(__dirname, 'data.json');
const TOKEN_TTL = 90 * 24 * 3600 * 1000;
const DEVELOPERS = ['baconsigma67656'];

let db = { users: [], inventory: {}, supply: {}, priceHistory: {}, news: [], friendships: [] };
let dbDirty = false;

function loadDB(){
  try {
    if(fs.existsSync(DB_FILE)){
      const p = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db.users = p.users || [];
      db.inventory = p.inventory || {};
      db.supply = p.supply || {};
      db.priceHistory = p.priceHistory || {};
      db.news = p.news || [];
      db.friendships = p.friendships || [];
    }
  } catch(e){ console.error('DB load error:', e.message); }
}
function saveDB(){
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); dbDirty = false; }
  catch(e){ console.error('DB save error:', e.message); }
}
function markDirty(){
  dbDirty = true;
  if(markDirty.t) clearTimeout(markDirty.t);
  markDirty.t = setTimeout(saveDB, 500);
}
setInterval(() => { if(dbDirty) saveDB(); }, 5000);

function hashPassword(pw){
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function verifyPassword(pw, stored){
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}
function makeToken(id){
  const exp = Date.now() + TOKEN_TTL;
  const data = id + '.' + exp;
  return data + '.' + crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}
function verifyToken(token){
  if(!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if(parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  const data = uid + '.' + exp;
  if(crypto.createHmac('sha256', SECRET).update(data).digest('hex') !== sig) return null;
  if(Date.now() > parseInt(exp)) return null;
  return parseInt(uid);
}
function isDev(u){ return u && DEVELOPERS.includes(u.username.toLowerCase()); }

const RARITIES = {
  common:    { label:'Обычный',     color:'#7a7a88', basePrice:2,    next:'uncommon'  },
  uncommon:  { label:'Необычный',   color:'#6a8df0', basePrice:8,    next:'rare'      },
  rare:      { label:'Редкий',      color:'#9b6fd0', basePrice:35,   next:'epic'      },
  epic:      { label:'Эпический',   color:'#e06ebf', basePrice:220,  next:'legendary' },
  legendary: { label:'Легендарный', color:'#f0c14b', basePrice:1600, next:null        },
};
const ITEMS = [
  { name:'P250 Sand Dune',icon:'🔫',rarity:'common' },
  { name:'MP9 Storm',icon:'🔫',rarity:'common' },
  { name:'Nova Predator',icon:'🔫',rarity:'common' },
  { name:'Dual Berettas Colony',icon:'🔫',rarity:'common' },
  { name:'Galil AR Cerberus',icon:'🔫',rarity:'common' },
  { name:'Glock-18 Water Elemental',icon:'🔫',rarity:'uncommon' },
  { name:'M4A1-S Varicamo',icon:'🔫',rarity:'uncommon' },
  { name:'USP-S Blueprint',icon:'🔫',rarity:'uncommon' },
  { name:'P90 Asiimov',icon:'🔫',rarity:'uncommon' },
  { name:'Five-SeveN Case Hardened',icon:'🔫',rarity:'uncommon' },
  { name:'AK-47 Redline',icon:'🔫',rarity:'rare' },
  { name:'AWP Electric Hive',icon:'🔫',rarity:'rare' },
  { name:'Desert Eagle Code Red',icon:'🔫',rarity:'rare' },
  { name:'AK-47 Vulcan',icon:'🔫',rarity:'rare' },
  { name:'M4A1-S Hyper Beast',icon:'🔫',rarity:'rare' },
  { name:'M4A4 Howl',icon:'🔫',rarity:'epic' },
  { name:'AWP Asiimov',icon:'🔫',rarity:'epic' },
  { name:'Karambit Fade',icon:'🔪',rarity:'epic' },
  { name:'Glock Fade',icon:'🔫',rarity:'epic' },
  { name:'Deagle Blaze',icon:'🔫',rarity:'epic' },
  { name:'AWP Dragon Lore',icon:'🔫',rarity:'legendary' },
  { name:'Butterfly Knife | Gold',icon:'🔪',rarity:'legendary' },
  { name:'M9 Bayonet | Doppler',icon:'🔪',rarity:'legendary' },
  { name:'AK-47 Fire Serpent',icon:'🔫',rarity:'legendary' },
  { name:'AWP Gungnir',icon:'🔫',rarity:'legendary' },
];
const CASES = [
  { id:'starter', name:'Стартовый', icon:'📦', price:25, color:'#7a7a88', weights:{common:70,uncommon:30}, pool:['common','uncommon'] },
  { id:'standard',name:'Стандартный',icon:'🎁',price:50, color:'#6a8df0', weights:{common:50,uncommon:30,rare:15,epic:4,legendary:1} },
  { id:'premium', name:'Премиум',   icon:'💎', price:150,color:'#9b6fd0', weights:{uncommon:40,rare:35,epic:20,legendary:5} },
  { id:'elite',   name:'Элитный',   icon:'👑', price:500,color:'#e06ebf', weights:{rare:40,epic:45,legendary:15} },
  { id:'knife',   name:'Ножевой',   icon:'🔪', price:1200,color:'#f0c14b',weights:{epic:75,legendary:25}, filterKnife:true },
  { id:'dragon',  name:'Драконий',  icon:'🐉', price:3000,color:'#ff4444',weights:{epic:50,legendary:50}, filterDragon:true },
];
const WHEEL_PRIZES = [
  { type:'coins',value:20,  color:'#5a5a68',label:'20',  weight:20 },
  { type:'coins',value:50,  color:'#4b69c4',label:'50',  weight:18 },
  { type:'coins',value:100, color:'#2c3d84',label:'100', weight:15 },
  { type:'coins',value:250, color:'#6b3fa0',label:'250', weight:12 },
  { type:'coins',value:500, color:'#432176',label:'500', weight:10 },
  { type:'coins',value:1000,color:'#c74b9b',label:'1000',weight:8  },
  { type:'coins',value:2000,color:'#8a296a',label:'2000',weight:6  },
  { type:'coins',value:5000,color:'#d4a017',label:'5000',weight:3  },
  { type:'item',rarity:'epic',color:'#e06ebf',label:'EPIC',weight:5 },
  { type:'item',rarity:'legendary',color:'#f0c14b',label:'LEGEND',weight:3 },
];
const DAILY_REWARDS = [100, 200, 350, 500, 750, 1000, 2500];
const AVATARS = ['🐺','🦊','🐉','🦁','🐯','🦅','🐻','🐼','🦖','👾','🤖','👑','💎','🔥','⚡','🌟'];
const INITIAL_SUPPLY = 100, SELL_SPREAD = 0.85, WHEEL_COST = 100;
const DAILY_CD = 24*60*60*1000, DAILY_GRACE = 48*60*60*1000;
const CRAFT_COST = 5;

function getSupply(item){
  if(!db.supply[item]) db.supply[item] = { drops:0, trend:0, updated:Date.now() };
  return db.supply[item];
}
function getItemPrice(name){
  const item = ITEMS.find(i => i.name === name);
  if(!item) return 0;
  const s = getSupply(name);
  const base = RARITIES[item.rarity].basePrice;
  const sf = INITIAL_SUPPLY / (INITIAL_SUPPLY + s.drops);
  const tm = 1 + s.trend * 0.15;
  return Math.max(1, Math.round(base * sf * tm));
}
function getSellPrice(n){ return Math.max(1, Math.floor(getItemPrice(n) * SELL_SPREAD)); }
function pushHistory(name){
  if(!db.priceHistory[name]) db.priceHistory[name] = [];
  db.priceHistory[name].push(getItemPrice(name));
  if(db.priceHistory[name].length > 30) db.priceHistory[name].shift();
}
function registerDrop(name, c = 1){
  const s = getSupply(name);
  s.drops += c; s.updated = Date.now();
  for(let i = 0; i < c; i++) pushHistory(name);
  markDirty();
}
function unregisterDrop(name, c = 1){
  const s = getSupply(name);
  s.drops = Math.max(0, s.drops - c); s.updated = Date.now();
  pushHistory(name);
  markDirty();
}
setInterval(() => {
  for(const item of ITEMS){
    const s = getSupply(item.name);
    s.trend = Math.max(-1, Math.min(1, s.trend * 0.7 + (Math.random() - 0.5) * 0.6));
    pushHistory(item.name);
  }
  markDirty();
}, 15000);

function getInv(uid){ return db.inventory[uid] || {}; }
function addItem(uid, name, c = 1){
  if(!db.inventory[uid]) db.inventory[uid] = {};
  db.inventory[uid][name] = (db.inventory[uid][name] || 0) + c;
  markDirty();
}
function removeItem(uid, name, c = 1){
  if(!db.inventory[uid]) return;
  db.inventory[uid][name] = Math.max(0, (db.inventory[uid][name] || 0) - c);
  if(db.inventory[uid][name] === 0) delete db.inventory[uid][name];
  markDirty();
}

function pickByWeights(weights){
  const total = Object.values(weights).reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for(const [k,v] of Object.entries(weights)){ if(r < v) return k; r -= v; }
  return Object.keys(weights)[0];
}
function rollFromCase(c){
  const rarity = pickByWeights(c.weights);
  let pool = ITEMS.filter(i => i.rarity === rarity);
  if(c.pool) pool = pool.filter(i => c.pool.includes(i.rarity));
  if(c.filterKnife) pool = pool.filter(i => i.icon === '🔪');
  if(c.filterDragon) pool = pool.filter(i => i.rarity === 'legendary' || i.name.includes('Dragon') || i.name.includes('Howl'));
  if(!pool.length) pool = ITEMS.filter(i => i.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickWheelPrize(){
  const total = WHEEL_PRIZES.reduce((s,p) => s + p.weight, 0);
  let r = Math.random() * total;
  for(let i = 0; i < WHEEL_PRIZES.length; i++){ if(r < WHEEL_PRIZES[i].weight) return i; r -= WHEEL_PRIZES[i].weight; }
  return 0;
}
function getRelationship(a, b){
  const f1 = db.friendships.find(f => f.fromId === a && f.toId === b);
  const f2 = db.friendships.find(f => f.fromId === b && f.toId === a);
  if((f1 && f1.status === 'accepted') || (f2 && f2.status === 'accepted')) return 'friends';
  if(f1 && f1.status === 'pending') return 'outgoing';
  if(f2 && f2.status === 'pending') return 'incoming';
  return 'none';
}

function sendJSON(res, code, data){
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function readBody(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if(data.length > 200000) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Bad JSON')); } });
    req.on('error', reject);
  });
}
function getUser(req){
  const auth = req.headers.authorization || '';
  const uid = verifyToken(auth.replace('Bearer ', ''));
  if(!uid) return null;
  return db.users.find(u => u.id === uid);
}
function publicUser(u){
  return {
    id: u.id, username: u.username, avatar: u.avatar, coins: u.coins,
    totalTaps: u.totalTaps, lastDaily: u.lastDaily, dailyStreak: u.dailyStreak,
    totalClaimed: u.totalClaimed, created: u.created, inventory: getInv(u.id),
    isDev: isDev(u),
  };
}

async function handleAPI(req, res, pathname, url){
  try {
    if(pathname === '/api/register' && req.method === 'POST'){
      const { username, password } = await readBody(req);
      if(typeof username !== 'string' || typeof password !== 'string') return sendJSON(res, 400, { error:'Неверный формат' });
      const uname = username.trim();
      if(uname.length < 3 || uname.length > 20) return sendJSON(res, 400, { error:'Имя: 3-20 символов' });
      if(!/^[a-zA-Zа-яА-Я0-9_]+$/.test(uname)) return sendJSON(res, 400, { error:'Только буквы, цифры и _' });
      if(password.length < 4) return sendJSON(res, 400, { error:'Пароль минимум 4 символа' });
      if(db.users.some(u => u.username.toLowerCase() === uname.toLowerCase())) return sendJSON(res, 400, { error:'Имя занято' });
      const user = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        username: uname,
        password: hashPassword(password),
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        coins: 100, totalTaps: 0, lastDaily: 0, dailyStreak: 0, totalClaimed: 0,
        created: Date.now(),
      };
      db.users.push(user);
      markDirty();
      return sendJSON(res, 200, { token: makeToken(user.id), username: user.username });
    }
    if(pathname === '/api/login' && req.method === 'POST'){
      const { username, password } = await readBody(req);
      if(!username || !password) return sendJSON(res, 400, { error:'Заполни поля' });
      const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
      if(!user) return sendJSON(res, 400, { error:'Пользователь не найден' });
      if(!verifyPassword(password, user.password)) return sendJSON(res, 400, { error:'Неверный пароль' });
      return sendJSON(res, 200, { token: makeToken(user.id), username: user.username });
    }
    if(pathname === '/api/me' && req.method === 'GET'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      return sendJSON(res, 200, publicUser(u));
    }
    if(pathname === '/api/avatar' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { avatar } = await readBody(req);
      if(!AVATARS.includes(avatar)) return sendJSON(res, 400, { error:'Неверный аватар' });
      u.avatar = avatar; markDirty();
      return sendJSON(res, 200, { ok:true });
    }
    if(pathname === '/api/tap' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      if(!u._taps) u._taps = [];
      const now = Date.now();
      while(u._taps.length && now - u._taps[0] > 2000) u._taps.shift();
      if(u._taps.length >= 15) return sendJSON(res, 429, { error:'Автокликер!' });
      if(u._taps.length && now - u._taps[u._taps.length-1] < 40) return sendJSON(res, 429, { error:'Слишком быстро' });
      u._taps.push(now);
      u.coins += 1; u.totalTaps += 1; markDirty();
      return sendJSON(res, 200, { coins:u.coins });
    }
    if(pathname === '/api/cases' && req.method === 'GET')
      return sendJSON(res, 200, CASES.map(c => ({ id:c.id, name:c.name, icon:c.icon, price:c.price, color:c.color })));
    if(pathname === '/api/items' && req.method === 'GET') return sendJSON(res, 200, ITEMS);
    if(pathname === '/api/rarities' && req.method === 'GET') return sendJSON(res, 200, RARITIES);

    if(pathname === '/api/open-case' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { caseId, multi } = await readBody(req);
      const c = CASES.find(x => x.id === caseId); if(!c) return sendJSON(res, 400, { error:'Кейс не найден' });
      const m = Math.max(1, Math.min(10, parseInt(multi) || 1));
      const cost = c.price * m;
      if(u.coins < cost) return sendJSON(res, 400, { error:'Недостаточно монет' });
      const results = [];
      for(let i = 0; i < m; i++) results.push(rollFromCase(c));
      u.coins -= cost;
      for(const it of results){ addItem(u.id, it.name, 1); registerDrop(it.name, 1); }
      markDirty();
      return sendJSON(res, 200, {
        items: results.map(i => ({ name:i.name, icon:i.icon, rarity:i.rarity, price:getItemPrice(i.name) })),
        coins: u.coins,
      });
    }

    if(pathname === '/api/daily' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const now = Date.now();
      if(now - u.lastDaily < DAILY_CD) return sendJSON(res, 400, { error:'Ещё рано' });
      let streak = u.dailyStreak || 0;
      if(u.lastDaily && now - u.lastDaily > DAILY_GRACE) streak = 0;
      const dayIdx = streak % 7;
      const reward = DAILY_REWARDS[dayIdx];
      let ns = streak + 1; if(ns >= 7) ns = 0;
      u.coins += reward; u.lastDaily = now; u.dailyStreak = ns; u.totalClaimed = (u.totalClaimed||0) + 1;
      markDirty();
      return sendJSON(res, 200, { reward, day: dayIdx+1, coins:u.coins, dailyStreak:ns, lastDaily:now, totalClaimed:u.totalClaimed });
    }

    if(pathname === '/api/market' && req.method === 'GET'){
      const list = ITEMS.map(item => {
        const s = getSupply(item.name);
        return {
          name:item.name, icon:item.icon, rarity:item.rarity,
          price:getItemPrice(item.name), sellPrice:getSellPrice(item.name),
          supply:s.drops, trend:s.trend,
          history:(db.priceHistory[item.name] || [getItemPrice(item.name)]).slice(-30),
        };
      });
      return sendJSON(res, 200, list);
    }
    if(pathname === '/api/buy' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { itemName } = await readBody(req);
      if(!ITEMS.find(i => i.name === itemName)) return sendJSON(res, 400, { error:'Нет предмета' });
      const price = getItemPrice(itemName);
      if(u.coins < price) return sendJSON(res, 400, { error:'Недостаточно монет' });
      u.coins -= price; addItem(u.id, itemName, 1); registerDrop(itemName, 1); markDirty();
      return sendJSON(res, 200, { coins:u.coins, inventory:getInv(u.id) });
    }
    if(pathname === '/api/sell' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { itemName, count = 1 } = await readBody(req);
      const inv = getInv(u.id);
      const have = inv[itemName] || 0;
      const cnt = Math.max(1, Math.min(count, have));
      if(have < cnt) return sendJSON(res, 400, { error:'Нет предметов' });
      const total = getSellPrice(itemName) * cnt;
      u.coins += total; removeItem(u.id, itemName, cnt); unregisterDrop(itemName, cnt); markDirty();
      return sendJSON(res, 200, { coins:u.coins, inventory:getInv(u.id), earned:total });
    }

    if(pathname === '/api/upgrade' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { bet, targetName, chance } = await readBody(req);
      if(!bet || typeof bet !== 'object' || !targetName || typeof chance !== 'number')
        return sendJSON(res, 400, { error:'Неверные данные' });
      if(chance < 5 || chance > 95) return sendJSON(res, 400, { error:'Неверный шанс' });
      const target = ITEMS.find(i => i.name === targetName);
      if(!target) return sendJSON(res, 400, { error:'Цели нет' });
      const inv = getInv(u.id);
      let betValue = 0;
      for(const [name, cnt] of Object.entries(bet)){
        if(!ITEMS.find(i => i.name === name)) return sendJSON(res, 400, { error:'Неизвестный предмет' });
        const c = Math.max(0, parseInt(cnt) || 0);
        if(c <= 0) continue;
        if((inv[name] || 0) < c) return sendJSON(res, 400, { error:'Недостаточно ' + name });
        betValue += getItemPrice(name) * c;
      }
      const targetPrice = getItemPrice(targetName);
      const requiredBet = Math.round(targetPrice * chance / 100);
      if(betValue < requiredBet) return sendJSON(res, 400, { error:'Мало вложено' });
      const success = Math.random() * 100 < chance;
      for(const [name, cnt] of Object.entries(bet)){
        const c = parseInt(cnt) || 0;
        if(c > 0){ removeItem(u.id, name, c); unregisterDrop(name, c); }
      }
      if(success){ addItem(u.id, targetName, 1); registerDrop(targetName, 1); }
      markDirty();
      return sendJSON(res, 200, {
        success, chance, targetItem:{ name:target.name, icon:target.icon, rarity:target.rarity },
        betValue, targetPrice, inventory:getInv(u.id), coins:u.coins,
      });
    }

    if(pathname === '/api/craft' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { itemName } = await readBody(req);
      const item = ITEMS.find(i => i.name === itemName);
      if(!item) return sendJSON(res, 400, { error:'Предмет не найден' });
      if(!RARITIES[item.rarity].next) return sendJSON(res, 400, { error:'Легендарку нельзя крафтить' });
      const inv = getInv(u.id);
      if((inv[itemName] || 0) < CRAFT_COST) return sendJSON(res, 400, { error:`Нужно ${CRAFT_COST} шт.` });
      const nextRarity = RARITIES[item.rarity].next;
      const pool = ITEMS.filter(i => i.rarity === nextRarity);
      const result = pool[Math.floor(Math.random() * pool.length)];
      removeItem(u.id, itemName, CRAFT_COST);
      unregisterDrop(itemName, CRAFT_COST);
      addItem(u.id, result.name, 1);
      registerDrop(result.name, 1);
      markDirty();
      return sendJSON(res, 200, {
        result: { name:result.name, icon:result.icon, rarity:result.rarity, price:getItemPrice(result.name) },
        consumed: { name:item.name, count:CRAFT_COST },
        inventory: getInv(u.id), coins: u.coins,
      });
    }

    if(pathname === '/api/wheel' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      if(u.coins < WHEEL_COST) return sendJSON(res, 400, { error:'Недостаточно монет' });
      const idx = pickWheelPrize();
      const prize = WHEEL_PRIZES[idx];
      u.coins -= WHEEL_COST;
      const payload = { type:prize.type, label:prize.label, index:idx };
      if(prize.type === 'coins'){ u.coins += prize.value; payload.coins = prize.value; }
      else {
        const pool = ITEMS.filter(i => i.rarity === prize.rarity);
        const it = pool[Math.floor(Math.random() * pool.length)];
        addItem(u.id, it.name, 1); registerDrop(it.name, 1);
        payload.item = { name:it.name, icon:it.icon, rarity:it.rarity };
      }
      markDirty();
      return sendJSON(res, 200, { prize:payload, coins:u.coins, inventory:getInv(u.id) });
    }

    if(pathname === '/api/leaderboard' && req.method === 'GET'){
      const top = [...db.users].sort((a,b) => b.coins - a.coins).slice(0, 20)
        .map(u => ({ username:u.username, avatar:u.avatar, coins:u.coins, totalTaps:u.totalTaps, isDev:isDev(u) }));
      return sendJSON(res, 200, top);
    }

    if(pathname === '/api/news' && req.method === 'GET'){
      const list = [...db.news].sort((a,b) => {
        if(a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAt - a.createdAt;
      });
      return sendJSON(res, 200, list);
    }
    if(pathname === '/api/news' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      if(!isDev(u)) return sendJSON(res, 403, { error:'Только разработчик может делать новости' });
      const { title, content, pinned } = await readBody(req);
      if(!title || !content) return sendJSON(res, 400, { error:'Заполни все поля' });
      const t = String(title).trim().slice(0, 100);
      const c = String(content).trim().slice(0, 2000);
      if(t.length < 2) return sendJSON(res, 400, { error:'Заголовок слишком короткий' });
      if(c.length < 2) return sendJSON(res, 400, { error:'Текст слишком короткий' });
      const news = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: t, content: c,
        author: u.username, authorAvatar: u.avatar,
        createdAt: Date.now(), pinned: !!pinned,
      };
      db.news.push(news);
      markDirty();
      return sendJSON(res, 200, news);
    }
    if(pathname.startsWith('/api/news/') && req.method === 'DELETE'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      if(!isDev(u)) return sendJSON(res, 403, { error:'Только разработчик' });
      const id = parseInt(pathname.split('/').pop());
      const idx = db.news.findIndex(n => n.id === id);
      if(idx === -1) return sendJSON(res, 404, { error:'Новость не найдена' });
      db.news.splice(idx, 1);
      markDirty();
      return sendJSON(res, 200, { ok: true });
    }
    if(pathname === '/api/news/pin' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      if(!isDev(u)) return sendJSON(res, 403, { error:'Только разработчик' });
      const { id } = await readBody(req);
      const n = db.news.find(x => x.id === id);
      if(!n) return sendJSON(res, 404, { error:'Нет новости' });
      n.pinned = !n.pinned;
      markDirty();
      return sendJSON(res, 200, { ok: true, pinned: n.pinned });
    }

    if(pathname === '/api/users/search' && req.method === 'GET'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const q = (url.searchParams.get('q') || '').toLowerCase().trim();
      if(q.length < 2) return sendJSON(res, 200, []);
      const results = db.users
        .filter(x => x.id !== u.id && x.username.toLowerCase().includes(q))
        .slice(0, 20)
        .map(x => ({
          username: x.username,
          avatar: x.avatar,
          coins: x.coins,
          isDev: isDev(x),
          relationship: getRelationship(u.id, x.id),
        }));
      return sendJSON(res, 200, results);
    }

    if(pathname === '/api/friends' && req.method === 'GET'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const friends = [], incoming = [], outgoing = [];
      for(const f of db.friendships){
        if(f.fromId !== u.id && f.toId !== u.id) continue;
        const otherId = f.fromId === u.id ? f.toId : f.fromId;
        const other = db.users.find(x => x.id === otherId);
        if(!other) continue;
        const entry = { username:other.username, avatar:other.avatar, coins:other.coins, isDev:isDev(other) };
        if(f.status === 'accepted') friends.push(entry);
        else if(f.status === 'pending' && f.toId === u.id) incoming.push(entry);
        else if(f.status === 'pending' && f.fromId === u.id) outgoing.push(entry);
      }
      return sendJSON(res, 200, { friends, incoming, outgoing });
    }
    if(pathname === '/api/friends/request' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { username } = await readBody(req);
      const target = db.users.find(x => x.username.toLowerCase() === (username||'').toLowerCase());
      if(!target) return sendJSON(res, 404, { error:'Игрок не найден' });
      if(target.id === u.id) return sendJSON(res, 400, { error:'Это ты' });
      const rel = getRelationship(u.id, target.id);
      if(rel !== 'none') return sendJSON(res, 400, { error:'Заявка уже есть' });
      db.friendships.push({ fromId:u.id, toId:target.id, status:'pending', createdAt:Date.now() });
      markDirty();
      return sendJSON(res, 200, { ok: true, relationship: 'outgoing' });
    }
    if(pathname === '/api/friends/accept' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { username } = await readBody(req);
      const target = db.users.find(x => x.username.toLowerCase() === (username||'').toLowerCase());
      if(!target) return sendJSON(res, 404, { error:'Игрок не найден' });
      const f = db.friendships.find(x => x.fromId === target.id && x.toId === u.id && x.status === 'pending');
      if(!f) return sendJSON(res, 400, { error:'Заявки нет' });
      f.status = 'accepted'; f.acceptedAt = Date.now();
      markDirty();
      return sendJSON(res, 200, { ok: true });
    }
    if(pathname === '/api/friends/decline' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { username } = await readBody(req);
      const target = db.users.find(x => x.username.toLowerCase() === (username||'').toLowerCase());
      if(!target) return sendJSON(res, 404, { error:'Игрок не найден' });
      const idx = db.friendships.findIndex(x => x.fromId === target.id && x.toId === u.id && x.status === 'pending');
      if(idx !== -1) db.friendships.splice(idx, 1);
      markDirty();
      return sendJSON(res, 200, { ok: true });
    }
    if(pathname === '/api/friends/remove' && req.method === 'POST'){
      const u = getUser(req); if(!u) return sendJSON(res, 401, { error:'Не авторизован' });
      const { username } = await readBody(req);
      const target = db.users.find(x => x.username.toLowerCase() === (username||'').toLowerCase());
      if(!target) return sendJSON(res, 404, { error:'Игрок не найден' });
      db.friendships = db.friendships.filter(f => {
        const isBetween = (f.fromId === u.id && f.toId === target.id) || (f.fromId === target.id && f.toId === u.id);
        return !isBetween;
      });
      markDirty();
      return sendJSON(res, 200, { ok: true });
    }

    return sendJSON(res, 404, { error:'Не найдено' });
  } catch(e){
    console.error('API error:', e);
    return sendJSON(res, 500, { error:'Ошибка сервера' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  if(pathname.startsWith('/api/')) return handleAPI(req, res, pathname, url);

  const publicDir = path.join(__dirname, 'public');
  const filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(publicDir, filePath);
  if(!fullPath.startsWith(publicDir)){ res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(fullPath, (err, data) => {
    if(err){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('Not found'); }
    const ext = path.extname(fullPath);
    const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.ico':'image/x-icon', '.svg':'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

loadDB();
server.listen(PORT, () => {
  console.log('\n🚀 HOME UP сервер запущен');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`👑 Разработчики: ${DEVELOPERS.join(', ')}`);
  console.log(`👥 Пользователей: ${db.users.length}`);
  console.log(`📰 Новостей: ${db.news.length}\n`);
});
process.on('SIGINT', () => { console.log('\n💾 Сохраняю...'); saveDB(); process.exit(0); });
