/* ============================================================
 * 香港消防設備管理大屏 · 數據層
 * 確定性種子隨機：三級頁面數據保持一致
 * ============================================================ */

/* ---------- 種子隨機 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRng(seed) { return mulberry32(typeof seed === 'string' ? seedOf(seed) : seed); }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

/* ---------- 常量 ---------- */
const C = {
  ok: '#27E6A3', crit: '#FF3B30', warn: '#FFB547', idle: '#8EA8BF', caution: '#FF6A3D',
  accent: '#3478FF', cyan: '#19D3FF', ice: '#5CE1E6', purple: '#8B5CF6'
};
const REGION_NAME = { HK: '香港島', KL: '九龍', NT: '新界' };

const SENSOR_TYPES = [
  { key: 'fire',  label: '火',      full: '火災感測' },
  { key: 'water', label: '水',      full: '水浸/噴淋' },
  { key: 'hvac',  label: '暖通空調', full: '暖通空調' },
  { key: 'pump',  label: '泵',      full: '消防泵組' },
  { key: 'comm',  label: '通訊',    full: '通訊模組' }
];

const DEVICE_KINDS = [
  { key: 'smoke',  label: '煙感探測器', sensor: 'fire',  icon: 'flame' },
  { key: 'temp',   label: '溫感探測器', sensor: 'fire',  icon: 'flame' },
  { key: 'sprink', label: '噴淋頭',     sensor: 'water', icon: 'droplet' },
  { key: 'valve',  label: '消防栓',     sensor: 'water', icon: 'droplet' },
  { key: 'ahu',    label: '空調機組',   sensor: 'hvac',  icon: 'fan' },
  { key: 'vent',   label: '排煙風機',   sensor: 'hvac',  icon: 'fan' },
  { key: 'pump',   label: '消防水泵',   sensor: 'pump',  icon: 'pump' },
  { key: 'panel',  label: '控制主機',   sensor: 'comm',  icon: 'comm' },
  { key: 'repeat', label: '中繼器',     sensor: 'comm',  icon: 'comm' }
];

const STATUS_NAME = { online: '在線', crit: '高級', maint: '維護', offline: '離線' };

const ALARM_TYPES = [
  { label: '煙感觸發',   kind: 'smoke',  level: 1 },
  { label: '溫感異常',   kind: 'temp',   level: 1 },
  { label: '水壓過低',   kind: 'sprink', level: 2 },
  { label: '噴淋故障',   kind: 'sprink', level: 1 },
  { label: '水泵故障',   kind: 'pump',   level: 1 },
  { label: '通訊中斷',   kind: 'repeat', level: 2 },
  { label: '電源異常',   kind: 'panel',  level: 2 },
  { label: '排煙風機停機', kind: 'vent',  level: 1 },
  { label: '空調超溫',   kind: 'ahu',    level: 3 },
  { label: '誤報待核',   kind: 'smoke',  level: 3 }
];
const LEVEL_NAME = { 1: '嚴重', 2: '一般', 3: '預警' };
const LEVEL_COLOR = { 1: C.crit, 2: C.warn, 3: C.caution };

const MAINT_TYPES = ['例行巡檢', '季度聯動測試', '更換噴淋頭', '傳感器校準', '年度大修', '電池更換'];
const STAFF = ['梁文傑', '黃志強', '林嘉敏', '吳國輝', '張美玲', '陳家豪', '李淑芬', '鄭子明'];

/* ---------- 物業與樓宇 ---------- */
/* lng/lat 為高德地圖真實經緯度 */
const PROPERTIES = [
  { id: 'p01', name: '國際金融中心', en: 'IFC',           region: 'HK', district: '中環',   addr: '香港中環金融街8號',     manager: '陳志明', phone: '+852 2188 8888', lng: 114.1588, lat: 22.2849, base: 4200,
    buildings: [{ n: 'IFC 一期', f: 42 }, { n: 'IFC 二期', f: 88 }, { n: 'IFC 商場', f: 5 }] },
  { id: 'p02', name: '太古坊',       en: 'TAIKOO PLACE',  region: 'HK', district: '鰂魚涌', addr: '鰂魚涌太古坊道1號',   manager: '李慧嫻', phone: '+852 2844 8888', lng: 114.2145, lat: 22.2851, base: 3800,
    buildings: [{ n: '德宏大廈', f: 40 }, { n: '多盛大廈', f: 36 }, { n: '林肯大廈', f: 32 }] },
  { id: 'p03', name: '華潤大廈',     en: 'CRC TOWER',     region: 'HK', district: '灣仔',   addr: '灣仔港灣道26號',       manager: '黃國樑', phone: '+852 2828 0888', lng: 114.1738, lat: 22.2797, base: 2100,
    buildings: [{ n: '華潤大廈主樓', f: 48 }] },
  { id: 'p04', name: '環球貿易廣場', en: 'ICC',           region: 'KL', district: '西九龍', addr: '西九龍柯士甸道西1號', manager: '趙詠芝', phone: '+852 2698 8888', lng: 114.1600, lat: 22.3036, base: 4600,
    buildings: [{ n: 'ICC 主塔', f: 118 }, { n: '圓方商場', f: 4 }] },
  { id: 'p05', name: '港威大廈',     en: 'GATEWAY',       region: 'KL', district: '尖沙咀', addr: '尖沙咀廣東道15號',    manager: '周啟邦', phone: '+852 2118 8888', lng: 114.1690, lat: 22.2965, base: 2600,
    buildings: [{ n: '港威一座', f: 38 }, { n: '港威二座', f: 35 }, { n: '港威三座', f: 37 }] },
  { id: 'p06', name: '又一城',       en: 'FESTIVAL WALK', region: 'KL', district: '九龍塘', addr: '九龍塘達之路80號',     manager: '何雅雯', phone: '+852 2844 0333', lng: 114.1785, lat: 22.3366, base: 1900,
    buildings: [{ n: '又一城商場', f: 7 }, { n: '又一城寫字樓', f: 22 }] },
  { id: 'p07', name: '奧海城',       en: 'OLYMPIAN CITY', region: 'KL', district: '大角咀', addr: '大角咀海泓道1號',     manager: '馬冠聰', phone: '+852 2770 8888', lng: 114.1610, lat: 22.3221, base: 2400,
    buildings: [{ n: '奧海城一期', f: 30 }, { n: '奧海城二期', f: 36 }, { n: '奧海城三期', f: 28 }] },
  { id: 'p08', name: '德福廣場',     en: 'TELFORD PLAZA', region: 'KL', district: '九龍灣', addr: '九龍灣偉業街33號',    manager: '許樂怡', phone: '+852 2750 8888', lng: 114.2105, lat: 22.3228, base: 1600,
    buildings: [{ n: '德福一期', f: 28 }, { n: '德福二期', f: 34 }] },
  { id: 'p09', name: '新城市廣場',   en: 'NEW TOWN PLAZA',region: 'NT', district: '沙田',   addr: '沙田沙田正街18號',    manager: '曾仲豪', phone: '+852 2684 8888', lng: 114.1868, lat: 22.3814, base: 3600,
    buildings: [{ n: '新城市一期', f: 18 }, { n: '新城市三期', f: 24 }, { n: '新城市五期', f: 20 }] },
  { id: 'p10', name: '香港科學園',   en: 'HKSTP',         region: 'NT', district: '大埔',   addr: '大埔科技大道西',      manager: '葉朗然', phone: '+852 2629 8888', lng: 114.2070, lat: 22.4266, base: 2200,
    buildings: [{ n: '科研樓一座', f: 12 }, { n: '科研樓二座', f: 12 }, { n: '科研樓三座', f: 10 }] },
  { id: 'p11', name: '將軍澳中心',   en: 'TKO CENTRE',    region: 'NT', district: '將軍澳', addr: '將軍澳唐德街1號',     manager: '凌紫君', phone: '+852 2174 8888', lng: 114.2598, lat: 22.3063, base: 1500,
    buildings: [{ n: '將軍澳商場', f: 6 }, { n: '將軍澳中心基座', f: 40 }] },
  { id: 'p12', name: '屯門市廣場',   en: 'TM TOWN PLAZA', region: 'NT', district: '屯門',   addr: '屯門屯盛街1號',       manager: '鄧浩然', phone: '+852 2451 8888', lng: 113.9760, lat: 22.3913, base: 1800,
    buildings: [{ n: '屯門市廣場一期', f: 22 }, { n: '屯門市廣場二期', f: 26 }, { n: '屯門市廣場三期', f: 30 }] },
  { id: 'p13', name: '荃灣廣場',     en: 'TW PLAZA',      region: 'NT', district: '荃灣',   addr: '荃灣大壩街4號',       manager: '謝佩欣', phone: '+852 2493 8888', lng: 114.1225, lat: 22.3707, base: 1700,
    buildings: [{ n: '荃灣廣場商場', f: 8 }, { n: '荃灣廣場寫字樓', f: 32 }] }
];

/* 每棟樓宇的風險畫像（影響狀態分布，保證演示層次） */
const RISK_PROFILE = {
  'p04:0': { online: .905, crit: 2, maint: 2.4, offline: 1.8 },   // ICC 主塔：有嚴重告警
  'p06:1': { online: .874, crit: 1, maint: 3.2, offline: 2.6 },   // 又一城寫字樓：在線率低
  'p12:1': { online: .902, crit: 1, maint: 2.2, offline: 2.1 },   // 屯門市二期：風險
  'p08:0': { online: .938, crit: 0, maint: 2.6, offline: 1.6 },
  'p13:1': { online: .926, crit: 1, maint: 1.8, offline: 1.4 }
};

/* ---------- 聚合統計 ---------- */
function buildStats() {
  const now = Date.now();
  const P = PROPERTIES.map((p, pi) => {
    const r = makeRng('prop:' + p.id);
    let total = 0, online = 0, crit = 0, maint = 0, offline = 0;
    const bStats = p.buildings.map((b, bi) => {
      const prof = RISK_PROFILE[p.id + ':' + bi] || { online: .94 + r() * .05, crit: 0, maint: 1 + r() * 1.6, offline: .5 + r() * 1.1 };
      const cnt = Math.max(40, Math.round(p.base * (b.f / p.buildings.reduce((s, x) => s + x.f, 0))));
      const st = {
        name: b.n, floors: b.f, total: cnt,
        online: Math.round(cnt * prof.online),
        crit: Math.round(cnt * prof.crit / 100),
        maint: Math.max(1, Math.round(cnt * prof.maint / 100)),
        offline: Math.max(0, Math.round(cnt * prof.offline / 100))
      };
      st.online = Math.max(0, cnt - st.crit - st.maint - st.offline);
      total += cnt; online += st.online; crit += st.crit; maint += st.maint; offline += st.offline;
      return st;
    });
    /* 感測器 */
    const sensorTotal = Math.round(p.base * 1.6);
    const w = [.34, .22, .16, .12, .16];
    const sensors = SENSOR_TYPES.map((t, i) => {
      const tt = Math.round(sensorTotal * w[i]);
      const abn = Math.min(8, ri(r, 0, 6) + (i === 0 ? ri(r, 0, 2) : 0));
      return { ...t, total: tt, abnormal: abn, normal: tt - abn };
    });
    const sensorAbn = sensors.reduce((s, x) => s + x.abnormal, 0);
    return { ...p, idx: pi, bStats, total, online, crit, maint, offline, sensors, sensorAbn,
      onlineRate: +(online / total * 100).toFixed(1),
      sensorRate: +((sensorTotal - sensorAbn) / sensorTotal * 100).toFixed(1) };
  });

  /* 告警（未關閉未恢復） */
  const alarms = [];
  const ar = makeRng('alarms');
  const riskPool = ['p04', 'p06', 'p12', 'p08', 'p13', 'p01', 'p02', 'p09'];
  for (let i = 0; i < 42; i++) {
    const pid = i < 16 ? riskPool[Math.floor(ar() * riskPool.length)] : PROPERTIES[Math.floor(ar() * PROPERTIES.length)].id;
    const p = P.find(x => x.id === pid);
    const bi = Math.floor(ar() * p.buildings.length);
    const b = p.buildings[bi];
    const t = ALARM_TYPES[Math.floor(ar() * ALARM_TYPES.length)];
    const minsAgo = ri(ar, 2, 4600);
    const level = ar() < .18 ? 1 : (ar() < .55 ? 2 : 3);
    alarms.push({
      id: 'AL-' + String(2026000 + i),
      level, levelName: LEVEL_NAME[level], type: t.label, kind: t.kind,
      propertyId: pid, propertyName: p.name, building: b.n,
      floor: ri(ar, 1, b.f) + 'F',
      time: now - minsAgo * 60000,
      status: ar() < .58 ? '未處理' : '處理中'
    });
  }
  alarms.sort((a, b) => b.time - a.time);

  /* 健康評分（PRD 口徑：嚴重告警-5 / 離線率-3 / 維護率-1 / 傳感器異常率-2，按百分比扣分） */
  P.forEach(p => {
    const ca = alarms.filter(a => a.propertyId === p.id && a.level === 1).length;
    p.critAlarms = ca;
    p.alarmCount = alarms.filter(a => a.propertyId === p.id).length;
    const pct = n => p.total ? n / p.total * 100 : 0;
    const sensorTotal = p.sensors.reduce((s, x) => s + x.total, 0) || 1;
    p.score = Math.max(0, Math.round(100 - ca * 5 - pct(p.offline) * 3 - pct(p.maint) - p.sensorAbn / sensorTotal * 100 * 2));
    p.risk = p.alarmCount * 2 + (100 - p.score);
  });
  const overall = P.reduce((s, p) => s + p.score, 0) / P.length;

  /* 維護計劃（今日起 7 天） */
  const maintenance = [];
  const mr = makeRng('maint');
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  for (let i = 0; i < 26; i++) {
    const p = PROPERTIES[Math.floor(mr() * PROPERTIES.length)];
    const b = p.buildings[Math.floor(mr() * p.buildings.length)];
    const d = ri(mr, 0, 7), hh = ri(mr, 9, 18), mm = pick(mr, ['00', '30']);
    const dt = new Date(day0.getTime() + d * 864e5);
    maintenance.push({
      id: 'MT-' + String(1200 + i),
      dayOffset: d,
      date: `${dt.getMonth() + 1}/${dt.getDate()}`,
      time: `${String(hh).padStart(2, '0')}:${mm}`,
      ts: dt.getTime() + hh * 36e5,
      propertyId: p.id, propertyName: p.name, building: b.n,
      device: pick(mr, DEVICE_KINDS).label + ' ' + String(ri(mr, 100, 999)),
      type: pick(mr, MAINT_TYPES),
      assignee: pick(mr, STAFF),
      done: d === 0 && ar() < .3
    });
  }
  maintenance.sort((a, b) => a.ts - b.ts);

  const totalDevices = P.reduce((s, p) => s + p.total, 0);
  const totalOnline = P.reduce((s, p) => s + p.online, 0);
  const totalBuildings = PROPERTIES.reduce((s, p) => s + p.buildings.length, 0);
  const global = {
    properties: P.length, buildings: totalBuildings, devices: totalDevices,
    onlineRate: +(totalOnline / totalDevices * 100).toFixed(1),
    alarms: alarms.length, maintToday: maintenance.filter(m => m.dayOffset === 0).length,
    score: Math.round(overall),
    crit: P.reduce((s, p) => s + p.crit, 0),
    maint: P.reduce((s, p) => s + p.maint, 0),
    offline: P.reduce((s, p) => s + p.offline, 0),
    sensors: P.reduce((s, p) => s + p.sensors.reduce((a, x) => a + x.total, 0), 0),
    sensorAbn: P.reduce((s, p) => s + p.sensorAbn, 0)
  };
  return { P, alarms, maintenance, global };
}
const DB = buildStats();

/* ---------- 健康趨勢（range / 基準分 / 種子標籤，項目視圖傳入項目種子） ---------- */
function trendSeries(range, base, tag) {
  const n = range === '24h' ? 24 : range === '7d' ? 7 : 30;
  const r = makeRng('trend:' + (tag ? tag + ':' : '') + range);
  const now = new Date();
  const pts = [];
  let v = (base ?? DB.global.score) + (r() - .5) * 2;
  for (let i = n; i >= 0; i--) {
    v = Math.max(62, Math.min(97, v + (r() - .48) * (range === '24h' ? 1.6 : 2.6)));
    let label;
    if (range === '24h') { const d = new Date(now - i * 36e5); label = String(d.getHours()).padStart(2, '0') + ':00'; }
    else { const d = new Date(now - i * 864e5); label = (d.getMonth() + 1) + '/' + d.getDate(); }
    pts.push({ label, v: +v.toFixed(1) });
  }
  return pts;
}

/* ---------- L3：樓層與設備（惰性生成，同種子可復現） ---------- */
function floorList(p, b) { return floorsOf(PROPERTIES.find(x => x.id === p).buildings[b]); }
function floorsOf(b) {
  const list = [];
  for (let i = 2; i >= 1; i--) list.push('B' + i);
  list.push('G');
  for (let i = 1; i <= b.f; i++) list.push(i + 'F');
  return list;
}
function floorAgg(pid, bi) {
  const p = PROPERTIES.find(x => x.id === pid);
  const list = floorsOf(p.buildings[bi]);
  return list.map(f => {
    const r = makeRng('agg:' + pid + ':' + bi + ':' + f);
    const total = ri(r, 6, 14);
    const abnormal = r() < .34 ? ri(r, 1, 3) : 0;
    return { floor: f, total, abnormal, online: total - abnormal, rate: +(((total - abnormal) / total) * 100).toFixed(1) };
  });
}
function floorDevices(pid, bi, floor) {
  const r = makeRng('dev:' + pid + ':' + bi + ':' + floor);
  const agg = floorAgg(pid, bi).find(x => x.floor === floor);
  const list = [];
  const spots = FLOOR_SPOTS;
  const used = new Set();
  for (let i = 0; i < agg.total; i++) {
    const kind = DEVICE_KINDS[Math.floor(r() * DEVICE_KINDS.length)];
    let si = ri(r, 0, spots.length - 1);
    while (used.has(si)) si = (si + 1) % spots.length;
    used.add(si);
    const st = i < agg.abnormal ? (r() < .4 ? 'crit' : (r() < .5 ? 'offline' : 'maint')) : 'online';
    const no = String(ri(r, 1000, 9899));
    list.push({
      id: 'DV-' + no,
      name: kind.label + ' ' + kind.key.toUpperCase() + '-' + no,
      kind, status: st,
      x: spots[si].x, y: spots[si].y, loc: spots[si].loc,
      sensors: [kind.sensor].concat(r() < .35 ? ['comm'] : []),
      install: `202${ri(r, 1, 4)}-0${ri(r, 1, 9)}-1${ri(r, 0, 9)}`,
      lastCheck: `2026-0${ri(r, 1, 8)}-2${ri(r, 0, 8)}`,
      supplier: pick(r, ['西門子', '霍尼韋爾', '諾帝菲爾', '施耐德', '泛海三江'])
    });
  }
  return list;
}
/* 樓層平面圖點位（百分比坐標 + 位置描述） */
const FLOOR_SPOTS = [
  { x: 10, y: 16, loc: '西北角機房' }, { x: 26, y: 14, loc: '北側走廊西' }, { x: 44, y: 13, loc: '北側走廊中' },
  { x: 62, y: 14, loc: '北側走廊東' }, { x: 80, y: 16, loc: '東北辦公區' }, { x: 90, y: 30, loc: '東側茶水間' },
  { x: 89, y: 50, loc: '東側走廊' }, { x: 90, y: 70, loc: '東側會議室' }, { x: 80, y: 85, loc: '東南角機房' },
  { x: 62, y: 88, loc: '南側走廊東' }, { x: 44, y: 89, loc: '南側走廊中' }, { x: 26, y: 87, loc: '南側走廊西' },
  { x: 10, y: 84, loc: '西南樓梯間' }, { x: 9, y: 64, loc: '西側走廊南' }, { x: 10, y: 42, loc: '西側走廊北' },
  { x: 14, y: 28, loc: '西側設備間' }, { x: 34, y: 28, loc: '辦公區 A' }, { x: 52, y: 27, loc: '辦公區 B' },
  { x: 70, y: 28, loc: '辦公區 C' }, { x: 34, y: 72, loc: '開放辦公區' }, { x: 52, y: 72, loc: '開放辦公區' },
  { x: 70, y: 73, loc: '培訓室' }, { x: 30, y: 50, loc: '電梯廳' }, { x: 44, y: 50, loc: '核心筒' },
  { x: 56, y: 50, loc: '核心筒' }, { x: 68, y: 50, loc: '消防前室' }
];

/* ---------- 工具 ---------- */
const fmtNum = n => n.toLocaleString('en-US');
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
function fmtHM(ts) { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function fmtMD(ts) { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); }
function ago(ts) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (typeof LANG !== 'undefined' && LANG === 'en') {
    if (m < 60) return m + ' min ago';
    if (m < 1440) return Math.floor(m / 60) + ' h ago';
    return Math.floor(m / 1440) + ' d ago';
  }
  if (m < 60) return m + ' 分鐘前';
  if (m < 1440) return Math.floor(m / 60) + ' 小時前';
  return Math.floor(m / 1440) + ' 天前';
}
function scoreColor(v) { return v < 60 ? C.crit : v < 85 ? C.caution : C.ok; }
function statusColor(s) { return s === 'online' ? C.ok : s === 'crit' ? C.crit : s === 'maint' ? C.warn : C.idle; }
function propById(id) { return DB.P.find(p => p.id === id); }
