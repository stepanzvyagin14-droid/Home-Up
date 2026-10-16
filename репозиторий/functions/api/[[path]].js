const SUPABASE_URL = 'https://fsxputemwveouteusdsy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_srJqOHjNtODKifwwL3j7Vg_7-ynR2L3';
const DEVELOPERS = ['baconsigma67656'];
const OFFLINE_RATE = 5;
const EXCHANGE_RATE = 5;
const INITIAL_SUPPLY = 100;
const SELL_SPREAD = 0.85;
const WHEEL_COST = 100;
const DAILY_CD = 24 * 60 * 60 * 1000;
const DAILY_GRACE = 48 * 60 * 60 * 1000;
const CRAFT_COST = 5;
const OFFLINE_MIN_GAP = 60 * 1000;

const RARITIES = {
  common:{label:'Обычный',color:'#7a7a88',basePrice:2,next:'uncommon'},
  uncommon:{label:'Необычный',color:'#6a8df0',basePrice:8,next:'rare'},
  rare:{label:'Редкий',color:'#9b6fd0',basePrice:35,next:'epic'},
  epic:{label:'Эпический',color:'#e06ebf',basePrice:220,next:'legendary'},
  legendary:{label:'Легендарный',color:'#f0c14b',basePrice:1600,next:null},
};
const ITEMS = [
  {name:'P250 Sand Dune',icon:'🔫',rarity:'common'},
  {name:'MP9 Storm',icon:'🔫',rarity:'common'},
  {name:'Nova Predator',icon:'🔫',rarity:'common'},
  {name:'Dual Berettas Colony',icon:'🔫',rarity:'common'},
  {name:'Galil AR Cerberus',icon:'🔫',rarity:'common'},
  {name:'Glock-18 Water Elemental',icon:'🔫',rarity:'uncommon'},
  {name:'M4A1-S Varicamo',icon:'🔫',rarity:'uncommon'},
  {name:'USP-S Blueprint',icon:'🔫',rarity:'uncommon'},
  {name:'P90 Asiimov',icon:'🔫',rarity:'uncommon'},
  {name:'Five-SeveN Case Hardened',icon:'🔫',rarity:'uncommon'},
  {name:'AK-47 Redline',icon:'🔫',rarity:'rare'},
  {name:'AWP Electric Hive',icon:'🔫',rarity:'rare'},
  {name:'Desert Eagle Code Red',icon:'🔫',rarity:'rare'},
  {name:'AK-47 Vulcan',icon:'🔫',rarity:'rare'},
  {name:'M4A1-S Hyper Beast',icon:'🔫',rarity:'rare'},
  {name:'M4A4 Howl',icon:'🔫',rarity:'epic'},
  {name:'AWP Asiimov',icon:'🔫',rarity:'epic'},
  {name:'Karambit Fade',icon:'🔪',rarity:'epic'},
  {name:'Glock Fade',icon:'🔫',rarity:'epic'},
  {name:'Deagle Blaze',icon:'🔫',rarity:'epic'},
  {name:'AWP Dragon Lore',icon:'🔫',rarity:'legendary'},
  {name:'Butterfly Knife | Gold',icon:'🔪',rarity:'legendary'},
  {name:'M9 Bayonet | Doppler',icon:'🔪',rarity:'legendary'},
  {name:'AK-47 Fire Serpent',icon:'🔫',rarity:'legendary'},
  {name:'AWP Gungnir',icon:'🔫',rarity:'legendary'},
];
const CASES = [
  {id:'starter',name:'Стартовый',icon:'📦',price:25,color:'#7a7a88',weights:{common:70,uncommon:30},pool:['common','uncommon']},
  {id:'standard',name:'Стандартный',icon:'🎁',price:50,color:'#6a8df0',weights:{common:50,uncommon:30,rare:15,epic:4,legendary:1}},
  {id:'premium',name:'Премиум',icon:'💎',price:150,color:'#9b6fd0',weights:{uncommon:40,rare:35,epic:20,legendary:5}},
  {id:'elite',name:'Элитный',icon:'👑',price:500,color:'#e06ebf',weights:{rare:40,epic:45,legendary:15}},
  {id:'knife',name:'Ножевой',icon:'🔪',price:1200,color:'#f0c14b',weights:{epic:75,legendary:25},filterKnife:true},
  {id:'dragon',name:'Драконий',icon:'🐉',price:3000,color:'#ff4444',weights:{epic:50,legendary:50},filterDragon:true},
];
const WHEEL_PRIZES = [
  {type:'coins',value:20,color:'#5a5a68',label:'20',weight:20},
  {type:'coins',value:50,color:'#4b69c4',label:'50',weight:18},
  {type:'coins',value:100,color:'#2c3d84',label:'100',weight:15},
  {type:'coins',value:250,color:'#6b3fa0',label:'250',weight:12},
  {type:'coins',value:500,color:'#432176',label:'500',weight:10},
  {type:'coins',value:1000,color:'#c74b9b',label:'1000',weight:8},
  {type:'coins',value:2000,color:'#8a296a',label:'2000',weight:6},
  {type:'coins',value:5000,color:'#d4a017',label:'5000',weight:3},
  {type:'item',rarity:'epic',color:'#e06ebf',label:'EPIC',weight:5},
  {type:'item',rarity:'legendary',color:'#f0c14b',label:'LEGEND',weight:3},
];
const DAILY_REWARDS = [100,200,350,500,750,1000,2500];
const AVATARS = ['🐺','🦊','🐉','🦁','🐯','🦅','🐻','🐼','🦖','👾','🤖','👑','💎','🔥','⚡','🌟'];

async function sb(path, opts = {}){
  const url = SUPABASE_URL + '/rest/v1' + path;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(opts.headers || {}),
  };
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if(!res.ok) throw new Error((data && data.message) || (data && data.error) || 'Supabase error ' + res.status);
  return data;
}

async function hashPassword(pw){
  const enc = new TextEncoder().encode('homeup_salt_' + pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function verifyPassword(pw, hash){
  return (await hashPassword(pw)) === hash;
}
async function makeToken(userId){
  const exp = Date.now() + 90 * 24 * 3600 * 1000;
  const data = userId + '.' + exp;
  const enc = new TextEncoder().encode('homeup_secret_' + data);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const sig = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  return data + '.' + sig;
}
async function verifyToken(token){
  if(!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if(parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  const data = uid + '.' + exp;
  const enc = new TextEncoder().encode('homeup_secret_' + data);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const expected = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  if(expected !== sig) return null;
  if(Date.now() > parseInt(exp)) return null;
  return parseInt(uid);
}

function sendJSON(data, status = 200){
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
function isDev(u){ return u && DEVELOPERS.includes(u.username.toLowerCase()); }

async function getSupply(name){
  const rows = await sb('/supply?item_name=eq.' + encodeURIComponent(name) + '&select=*');
  if(rows && rows.length) return rows[0];
  const newRow = { item_name:name, drops:0, trend:0, updated:Date.now() };
  try { await sb('/supply', { method:'POST', body: JSON.stringify(newRow) }); } catch(e){}
  return newRow;
}
async function getItemPrice(name){
  const item = ITEMS.find(i => i.name === name);
  if(!item) return 0;
  const s = await getSupply(name);
  const base = RARITIES[item.rarity].basePrice;
  const sf = INITIAL_SUPPLY / (INITIAL_SUPPLY + s.drops);
  const tm = 1 + s.trend * 0.15;
  return Math.max(1, Math.round(base * sf * tm));
}
async function getSellPrice(name){
  return Math.max(1, Math.floor((await getItemPrice(name)) * SELL_SPREAD));
}
async function registerDrop(name, c = 1){
  const s = await getSupply(name);
  await sb('/supply?item_name=eq.' + encodeURIComponent(name), {
    method: 'PATCH',
    body: JSON.stringify({ drops: s.drops + c, updated: Date.now() }),
  });
}
async function unregisterDrop(name, c = 1){
  const s = await getSupply(name);
  await sb('/supply?item_name=eq.' + encodeURIComponent(name), {
    method: 'PATCH',
    body: JSON.stringify({ drops: Math.max(0, s.drops - c), updated: Date.now() }),
  });
}
async function getAllMarket(){
  const supplies = await sb('/supply?select=*');
  const list = [];
  for(const item of ITEMS){
    const s = supplies.find(x => x.item_name === item.name) || { drops:0, trend:0 };
    const base = RARITIES[item.rarity].basePrice;
    const sf = INITIAL_SUPPLY / (INITIAL_SUPPLY + s.drops);
    const tm = 1 + s.trend * 0.15;
    const price = Math.max(1, Math.round(base * sf * tm));
    const sellPrice = Math.max(1, Math.floor(price * SELL_SPREAD));
    list.push({ name:item.name, icon:item.icon, rarity:item.rarity, price, sellPrice, supply:s.drops, trend:s.trend, history:[price] });
  }
  return list;
}
async function getInv(userId){
  const rows = await sb('/inventory?user_id=eq.' + userId + '&select=*');
  const inv = {};
  for(const r of rows){ if(r.count > 0) inv[r.item_name] = r.count; }
  return inv;
}
async function addItem(userId, name, c = 1){
  const ex = await sb('/inventory?user_id=eq.' + userId + '&item_name=eq.' + encodeURIComponent(name) + '&select=*');
  if(ex && ex.length){
    await sb('/inventory?user_id=eq.' + userId + '&item_name=eq.' + encodeURIComponent(name), {
      method:'PATCH', body: JSON.stringify({ count: ex[0].count + c }),
    });
  } else {
    await sb('/inventory', { method:'POST', body: JSON.stringify({ user_id:userId, item_name:name, count:c }) });
  }
}
async function removeItem(userId, name, c = 1){
  const ex = await sb('/inventory?user_id=eq.' + userId + '&item_name=eq.' + encodeURIComponent(name) + '&select=*');
  if(!ex || !ex.length) return;
  const nc = Math.max(0, ex[0].count - c);
  if(nc === 0){
    await sb('/inventory?user_id=eq.' + userId + '&item_name=eq.' + encodeURIComponent(name), { method:'DELETE' });
  } else {
    await sb('/inventory?user_id=eq.' + userId + '&item_name=eq.' + encodeURIComponent(name), {
      method:'PATCH', body: JSON.stringify({ count: nc }),
    });
  }
}

function pickByWeights(w){
  const t = Object.values(w).reduce((a,b) => a+b, 0);
  let r = Math.random() * t;
  for(const [k,v] of Object.entries(w)){ if(r < v) return k; r -= v; }
  return Object.keys(w)[0];
}
function rollFromCase(c){
  const r = pickByWeights(c.weights);
  let pool = ITEMS.filter(i => i.rarity === r);
  if(c.pool) pool = pool.filter(i => c.pool.includes(i.rarity));
  if(c.filterKnife) pool = pool.filter(i => i.icon === '🔪');
  if(c.filterDragon) pool = pool.filter(i => i.rarity === 'legendary' || i.name.includes('Dragon') || i.name.includes('Howl'));
  if(!pool.length) pool = ITEMS.filter(i => i.rarity === r);
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickWheelPrize(){
  const t = WHEEL_PRIZES.reduce((s,p) => s + p.weight, 0);
  let r = Math.random() * t;
  for(let i = 0; i < WHEEL_PRIZES.length; i++){ if(r < WHEEL_PRIZES[i].weight) return i; r -= WHEEL_PRIZES[i].weight; }
  return 0;
}

async function getAuthUser(context){
  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const uid = await verifyToken(token);
  if(!uid) return null;
  const rows = await sb('/users?id=eq.' + uid + '&select=*');
  if(!rows || !rows.length) return null;
  const u = rows[0];
  const now = Date.now();
  const gap = now - (u.last_seen || now);
  if(gap > OFFLINE_MIN_GAP){
    const minutes = Math.floor(gap / 60000);
    const gained = minutes * OFFLINE_RATE;
    u.offline_coins = (u.offline_coins || 0) + gained;
    u.last_offline_gain = gained;
    await sb('/users?id=eq.' + uid, {
      method:'PATCH',
      body: JSON.stringify({ offline_coins: u.offline_coins, last_seen: now }),
    });
  } else {
    u.last_offline_gain = 0;
    await sb('/users?id=eq.' + uid, { method:'PATCH', body: JSON.stringify({ last_seen: now }) });
  }
  return u;
}
async function publicUser(u){
  const inv = await getInv(u.id);
  return {
    id: u.id, username: u.username, avatar: u.avatar, coins: u.coins,
    totalTaps: u.total_taps, lastDaily: u.last_daily, dailyStreak: u.daily_streak,
    totalClaimed: u.total_claimed, created: u.created, inventory: inv,
    isDev: isDev(u), offlineCoins: u.offline_coins || 0, lastOfflineGain: u.last_offline_gain || 0,
  };
}

async function getRelationship(a, b){
  const f1 = await sb('/friendships?from_id=eq.' + a + '&to_id=eq.' + b + '&select=*');
  const f2 = await sb('/friendships?from_id=eq.' + b + '&to_id=eq.' + a + '&select=*');
  if((f1 && f1.length && f1[0].status === 'accepted') || (f2 && f2.length && f2[0].status === 'accepted')) return 'friends';
  if(f1 && f1.length && f1[0].status === 'pending') return 'outgoing';
  if(f2 && f2.length && f2[0].status === 'pending') return 'incoming';
  return 'none';
}

export async function onRequest(context){
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if(method === 'OPTIONS'){
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    });
  }

  try {
    if(path === '/api/register' && method === 'POST'){
      const body = await request.json();
      const uname = (body.username || '').trim();
      const password = body.password || '';
      if(uname.length < 3 || uname.length > 20) return sendJSON({ error:'Имя: 3-20 символов' }, 400);
      if(!/^[a-zA-Zа-яА-Я0-9_]+$/.test(uname)) return sendJSON({ error:'Только буквы, цифры и _' }, 400);
      if(password.length < 4) return sendJSON({ error:'Пароль минимум 4 символа' }, 400);
      const ex = await sb('/users?username=ilike.' + encodeURIComponent(uname) + '&select=id');
      if(ex && ex.length) return sendJSON({ error:'Имя занято' }, 400);
      const hash = await hashPassword(password);
      const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const now = Date.now();
      const inserted = await sb('/users', {
        method:'POST',
        body: JSON.stringify({
          username: uname, password: hash, avatar,
          coins: 100, offline_coins: 0, total_taps: 0,
          last_daily: 0, daily_streak: 0, total_claimed: 0,
          last_seen: now, created: now,
        }),
      });
      const user = inserted[0];
      const token = await makeToken(user.id);
      return sendJSON({ token, username: user.username });
    }

    if(path === '/api/login' && method === 'POST'){
      const body = await request.json();
      const uname = (body.username || '').trim();
      const password = body.password || '';
      if(!uname || !password) return sendJSON({ error:'Заполни поля' }, 400);
      const rows = await sb('/users?username=ilike.' + encodeURIComponent(uname) + '&select=*');
      if(!rows || !rows.length) return sendJSON({ error:'Пользователь не найден' }, 400);
      const u = rows[0];
      if(!(await verifyPassword(password, u.password))) return sendJSON({ error:'Неверный пароль' }, 400);
      const now = Date.now();
      const gap = now - (u.last_seen || now);
      let gainedOffline = 0;
      if(gap > OFFLINE_MIN_GAP){
        const m = Math.floor(gap / 60000);
        gainedOffline = m * OFFLINE_RATE;
        await sb('/users?id=eq.' + u.id, {
          method:'PATCH',
          body: JSON.stringify({ offline_coins: (u.offline_coins || 0) + gainedOffline, last_seen: now }),
        });
      } else {
        await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ last_seen: now }) });
      }
      const token = await makeToken(u.id);
      return sendJSON({ token, username: u.username, offlineGain: gainedOffline });
    }

    if(path === '/api/me' && method === 'GET'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      return sendJSON(await publicUser(u));
    }

    if(path === '/api/heartbeat' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      return sendJSON({ offlineCoins: u.offline_coins || 0 });
    }

    if(path === '/api/avatar' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      if(!AVATARS.includes(body.avatar)) return sendJSON({ error:'Неверный аватар' }, 400);
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ avatar: body.avatar }) });
      return sendJSON({ ok:true });
    }

    if(path === '/api/tap' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const nc = u.coins + 1;
      const nt = (u.total_taps || 0) + 1;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: nc, total_taps: nt }) });
      return sendJSON({ coins: nc });
    }

    if(path === '/api/cases' && method === 'GET')
      return sendJSON(CASES.map(c => ({ id:c.id, name:c.name, icon:c.icon, price:c.price, color:c.color })));
    if(path === '/api/items' && method === 'GET') return sendJSON(ITEMS);
    if(path === '/api/rarities' && method === 'GET') return sendJSON(RARITIES);

    if(path === '/api/shop/exchange' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const have = u.offline_coins || 0;
      let c = Math.max(EXCHANGE_RATE, Math.floor((parseInt(body.count) || 0) / EXCHANGE_RATE) * EXCHANGE_RATE);
      if(have < c) c = Math.floor(have / EXCHANGE_RATE) * EXCHANGE_RATE;
      if(c < EXCHANGE_RATE) return sendJSON({ error:'Минимум ' + EXCHANGE_RATE + ' офлайн-коинов' }, 400);
      const regular = c / EXCHANGE_RATE;
      const newOffline = have - c;
      const newCoins = u.coins + regular;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ offline_coins: newOffline, coins: newCoins }) });
      return sendJSON({ ok:true, coins:newCoins, offlineCoins:newOffline, exchanged:c, gained:regular });
    }

    if(path === '/api/shop/free' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      if(!isDev(u)) return sendJSON({ error:'Только разработчик' }, 403);
      const amount = 1000;
      const newCoins = u.coins + amount;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: newCoins }) });
      return sendJSON({ ok:true, coins:newCoins, amount });
    }

    if(path === '/api/open-case' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const c = CASES.find(x => x.id === body.caseId);
      if(!c) return sendJSON({ error:'Кейс не найден' }, 400);
      const m = Math.max(1, Math.min(10, parseInt(body.multi) || 1));
      const cost = c.price * m;
      if(u.coins < cost) return sendJSON({ error:'Недостаточно монет' }, 400);
      const results = [];
      for(let i = 0; i < m; i++) results.push(rollFromCase(c));
      const newCoins = u.coins - cost;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: newCoins }) });
      const itemsOut = [];
      for(const it of results){
        await addItem(u.id, it.name, 1);
        await registerDrop(it.name, 1);
        const price = await getItemPrice(it.name);
        itemsOut.push({ name:it.name, icon:it.icon, rarity:it.rarity, price });
      }
      return sendJSON({ items: itemsOut, coins: newCoins });
    }

    if(path === '/api/daily' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const now = Date.now();
      if(now - u.last_daily < DAILY_CD) return sendJSON({ error:'Ещё рано' }, 400);
      let streak = u.daily_streak || 0;
      if(u.last_daily && now - u.last_daily > DAILY_GRACE) streak = 0;
      const dayIdx = streak % 7;
      const reward = DAILY_REWARDS[dayIdx];
      let ns = streak + 1; if(ns >= 7) ns = 0;
      const newCoins = u.coins + reward;
      const newClaimed = (u.total_claimed || 0) + 1;
      await sb('/users?id=eq.' + u.id, {
        method:'PATCH',
        body: JSON.stringify({ coins: newCoins, last_daily: now, daily_streak: ns, total_claimed: newClaimed }),
      });
      return sendJSON({ reward, day: dayIdx+1, coins: newCoins, dailyStreak: ns, lastDaily: now, totalClaimed: newClaimed });
    }

    if(path === '/api/market' && method === 'GET') return sendJSON(await getAllMarket());

    if(path === '/api/buy' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      if(!ITEMS.find(i => i.name === body.itemName)) return sendJSON({ error:'Нет предмета' }, 400);
      const price = await getItemPrice(body.itemName);
      if(u.coins < price) return sendJSON({ error:'Недостаточно монет' }, 400);
      const newCoins = u.coins - price;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: newCoins }) });
      await addItem(u.id, body.itemName, 1);
      await registerDrop(body.itemName, 1);
      const inv = await getInv(u.id);
      return sendJSON({ coins: newCoins, inventory: inv });
    }

    if(path === '/api/sell' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const inv = await getInv(u.id);
      const have = inv[body.itemName] || 0;
      const cnt = Math.max(1, Math.min(body.count || 1, have));
      if(have < cnt) return sendJSON({ error:'Нет предметов' }, 400);
      const sp = await getSellPrice(body.itemName);
      const total = sp * cnt;
      const newCoins = u.coins + total;
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: newCoins }) });
      await removeItem(u.id, body.itemName, cnt);
      await unregisterDrop(body.itemName, cnt);
      const newInv = await getInv(u.id);
      return sendJSON({ coins: newCoins, inventory: newInv, earned: total });
    }

    if(path === '/api/upgrade' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const bet = body.bet;
      const targetName = body.targetName;
      const chance = body.chance;
      if(!bet || typeof bet !== 'object' || !targetName || typeof chance !== 'number')
        return sendJSON({ error:'Неверные данные' }, 400);
      if(chance < 5 || chance > 95) return sendJSON({ error:'Неверный шанс' }, 400);
      const target = ITEMS.find(i => i.name === targetName);
      if(!target) return sendJSON({ error:'Цели нет' }, 400);
      const inv = await getInv(u.id);
      let betValue = 0;
      for(const [name, cnt] of Object.entries(bet)){
        if(!ITEMS.find(i => i.name === name)) return sendJSON({ error:'Неизвестный предмет' }, 400);
        const c = Math.max(0, parseInt(cnt) || 0);
        if(c <= 0) continue;
        if((inv[name] || 0) < c) return sendJSON({ error:'Недостаточно ' + name }, 400);
        betValue += (await getItemPrice(name)) * c;
      }
      const targetPrice = await getItemPrice(targetName);
      const requiredBet = Math.round(targetPrice * chance / 100);
      if(betValue < requiredBet) return sendJSON({ error:'Мало вложено' }, 400);
      const success = Math.random() * 100 < chance;
      for(const [name, cnt] of Object.entries(bet)){
        const c = parseInt(cnt) || 0;
        if(c > 0){ await removeItem(u.id, name, c); await unregisterDrop(name, c); }
      }
      if(success){ await addItem(u.id, targetName, 1); await registerDrop(targetName, 1); }
      const newInv = await getInv(u.id);
      return sendJSON({
        success, chance,
        targetItem: { name:target.name, icon:target.icon, rarity:target.rarity },
        betValue, targetPrice, inventory: newInv, coins: u.coins,
      });
    }

    if(path === '/api/craft' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const item = ITEMS.find(i => i.name === body.itemName);
      if(!item) return sendJSON({ error:'Предмет не найден' }, 400);
      if(!RARITIES[item.rarity].next) return sendJSON({ error:'Легендарку нельзя крафтить' }, 400);
      const inv = await getInv(u.id);
      if((inv[item.name] || 0) < CRAFT_COST) return sendJSON({ error:'Нужно ' + CRAFT_COST + ' шт.' }, 400);
      const nextRarity = RARITIES[item.rarity].next;
      const pool = ITEMS.filter(i => i.rarity === nextRarity);
      const result = pool[Math.floor(Math.random() * pool.length)];
      await removeItem(u.id, item.name, CRAFT_COST);
      await unregisterDrop(item.name, CRAFT_COST);
      await addItem(u.id, result.name, 1);
      await registerDrop(result.name, 1);
      const price = await getItemPrice(result.name);
      const newInv = await getInv(u.id);
      return sendJSON({
        result: { name:result.name, icon:result.icon, rarity:result.rarity, price },
        consumed: { name:item.name, count:CRAFT_COST },
        inventory: newInv, coins: u.coins,
      });
    }

    if(path === '/api/wheel' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      if(u.coins < WHEEL_COST) return sendJSON({ error:'Недостаточно монет' }, 400);
      const idx = pickWheelPrize();
      const prize = WHEEL_PRIZES[idx];
      let newCoins = u.coins - WHEEL_COST;
      const payload = { type:prize.type, label:prize.label, index:idx };
      if(prize.type === 'coins'){ newCoins += prize.value; payload.coins = prize.value; }
      else {
        const pool = ITEMS.filter(i => i.rarity === prize.rarity);
        const it = pool[Math.floor(Math.random() * pool.length)];
        await addItem(u.id, it.name, 1);
        await registerDrop(it.name, 1);
        payload.item = { name:it.name, icon:it.icon, rarity:it.rarity };
      }
      await sb('/users?id=eq.' + u.id, { method:'PATCH', body: JSON.stringify({ coins: newCoins }) });
      const newInv = await getInv(u.id);
      return sendJSON({ prize:payload, coins:newCoins, inventory:newInv });
    }

    if(path === '/api/leaderboard' && method === 'GET'){
      const rows = await sb('/users?select=username,avatar,coins,total_taps&order=coins.desc&limit=20');
      return sendJSON(rows.map(u => ({
        username: u.username, avatar: u.avatar, coins: u.coins,
        totalTaps: u.total_taps,
        isDev: DEVELOPERS.includes(u.username.toLowerCase()),
      })));
    }

    if(path === '/api/news' && method === 'GET'){
      const rows = await sb('/news?select=*&order=pinned.desc,created_at.desc');
      return sendJSON(rows.map(n => ({
        id:n.id, title:n.title, content:n.content,
        author:n.author, authorAvatar:n.author_avatar,
        createdAt:n.created_at, pinned:n.pinned,
      })));
    }
    if(path === '/api/news' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      if(!isDev(u)) return sendJSON({ error:'Только разработчик' }, 403);
      const body = await request.json();
      if(!body.title || !body.content) return sendJSON({ error:'Заполни все поля' }, 400);
      const t = String(body.title).trim().slice(0, 100);
      const c = String(body.content).trim().slice(0, 2000);
      if(t.length < 2) return sendJSON({ error:'Заголовок слишком короткий' }, 400);
      if(c.length < 2) return sendJSON({ error:'Текст слишком короткий' }, 400);
      const inserted = await sb('/news', {
        method:'POST',
        body: JSON.stringify({
          title:t, content:c, author:u.username,
          author_avatar:u.avatar, pinned:!!body.pinned, created_at:Date.now(),
        }),
      });
      const n = inserted[0];
      return sendJSON({ id:n.id, title:n.title, content:n.content, author:n.author, authorAvatar:n.author_avatar, createdAt:n.created_at, pinned:n.pinned });
    }
    if(path.startsWith('/api/news/') && method === 'DELETE'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      if(!isDev(u)) return sendJSON({ error:'Только разработчик' }, 403);
      const id = parseInt(path.split('/').pop());
      await sb('/news?id=eq.' + id, { method:'DELETE' });
      return sendJSON({ ok: true });
    }
    if(path === '/api/news/pin' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      if(!isDev(u)) return sendJSON({ error:'Только разработчик' }, 403);
      const body = await request.json();
      const rows = await sb('/news?id=eq.' + body.id + '&select=*');
      if(!rows || !rows.length) return sendJSON({ error:'Нет новости' }, 404);
      const newPinned = !rows[0].pinned;
      await sb('/news?id=eq.' + body.id, { method:'PATCH', body: JSON.stringify({ pinned: newPinned }) });
      return sendJSON({ ok: true, pinned: newPinned });
    }

    if(path === '/api/users/search' && method === 'GET'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const q = (url.searchParams.get('q') || '').toLowerCase().trim();
      if(q.length < 2) return sendJSON([]);
      const rows = await sb('/users?select=id,username,avatar,coins&username=ilike.*' + encodeURIComponent(q) + '*&limit=20');
      const list = [];
      for(const x of rows){
        if(x.id === u.id) continue;
        const rel = await getRelationship(u.id, x.id);
        list.push({
          username: x.username, avatar: x.avatar, coins: x.coins,
          isDev: DEVELOPERS.includes(x.username.toLowerCase()),
          relationship: rel,
        });
      }
      return sendJSON(list);
    }

    if(path === '/api/friends' && method === 'GET'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const rows = await sb('/friendships?or=(from_id.eq.' + u.id + ',to_id.eq.' + u.id + ')&select=*');
      const friends = [], incoming = [], outgoing = [];
      for(const f of rows){
        const otherId = f.from_id === u.id ? f.to_id : f.from_id;
        const other = await sb('/users?id=eq.' + otherId + '&select=username,avatar,coins');
        if(!other || !other.length) continue;
        const o = other[0];
        const entry = { username:o.username, avatar:o.avatar, coins:o.coins, isDev: DEVELOPERS.includes(o.username.toLowerCase()) };
        if(f.status === 'accepted') friends.push(entry);
        else if(f.status === 'pending' && f.to_id === u.id) incoming.push(entry);
        else if(f.status === 'pending' && f.from_id === u.id) outgoing.push(entry);
      }
      return sendJSON({ friends, incoming, outgoing });
    }

    if(path === '/api/friends/request' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const target = await sb('/users?username=ilike.' + encodeURIComponent(body.username || '') + '&select=id');
      if(!target || !target.length) return sendJSON({ error:'Игрок не найден' }, 404);
      const tid = target[0].id;
      if(tid === u.id) return sendJSON({ error:'Это ты' }, 400);
      const rel = await getRelationship(u.id, tid);
      if(rel !== 'none') return sendJSON({ error:'Заявка уже есть' }, 400);
      await sb('/friendships', { method:'POST', body: JSON.stringify({ from_id:u.id, to_id:tid, status:'pending', created_at:Date.now() }) });
      return sendJSON({ ok:true, relationship:'outgoing' });
    }

    if(path === '/api/friends/accept' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const target = await sb('/users?username=ilike.' + encodeURIComponent(body.username || '') + '&select=id');
      if(!target || !target.length) return sendJSON({ error:'Игрок не найден' }, 404);
      const tid = target[0].id;
      const f = await sb('/friendships?from_id=eq.' + tid + '&to_id=eq.' + u.id + '&status=eq.pending&select=*');
      if(!f || !f.length) return sendJSON({ error:'Заявки нет' }, 400);
      await sb('/friendships?id=eq.' + f[0].id, { method:'PATCH', body: JSON.stringify({ status:'accepted' }) });
      return sendJSON({ ok: true });
    }

    if(path === '/api/friends/decline' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const target = await sb('/users?username=ilike.' + encodeURIComponent(body.username || '') + '&select=id');
      if(!target || !target.length) return sendJSON({ error:'Игрок не найден' }, 404);
      const tid = target[0].id;
      const f = await sb('/friendships?from_id=eq.' + tid + '&to_id=eq.' + u.id + '&status=eq.pending&select=*');
      if(f && f.length) await sb('/friendships?id=eq.' + f[0].id, { method:'DELETE' });
      return sendJSON({ ok: true });
    }

    if(path === '/api/friends/remove' && method === 'POST'){
      const u = await getAuthUser(context);
      if(!u) return sendJSON({ error:'Не авторизован' }, 401);
      const body = await request.json();
      const target = await sb('/users?username=ilike.' + encodeURIComponent(body.username || '') + '&select=id');
      if(!target || !target.length) return sendJSON({ error:'Игрок не найден' }, 404);
      const tid = target[0].id;
      const rows = await sb('/friendships?or=(and(from_id.eq.' + u.id + ',to_id.eq.' + tid + '),and(from_id.eq.' + tid + ',to_id.eq.' + u.id + '))&select=id');
      for(const r of rows){ await sb('/friendships?id=eq.' + r.id, { method:'DELETE' }); }
      return sendJSON({ ok: true });
    }

    return sendJSON({ error: 'Не найдено: ' + path }, 404);
  } catch(e){
    console.error('API error:', e);
    return sendJSON({ error: 'Ошибка сервера: ' + (e.message || 'unknown') }, 500);
  }
}
