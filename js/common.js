/* ============================================================
 * 共用交互層：屏幕適配 / 圖標 / 提示 / 彈窗 / 導航欄 / 主題 / 多語言
 * ============================================================ */

/* ---------- 16:9 大屏縮放適配 ---------- */
function fitScreen() {
  const el = document.getElementById('screen');
  if (!el) return;
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  el.style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fitScreen);

/* ---------- 多語言（繁體中文 / English） ---------- */
let LANG = localStorage.getItem('lang') || 'zh';
const DICT = {
  en: {
    /* 導航 */
    '總覽': 'Overview', '監控': 'Monitor', '警報': 'Alerts', '維護': 'Maintenance',
    '分析': 'Analysis', '報告': 'Reports', '更多': 'More',
    '系統設定': 'Settings', '操作日誌': 'Audit Log', '幫助中心': 'Help', '數據報表': 'Data Sheets',
    '帳號資料': 'Profile', '偏好設定': 'Preferences', '退出登入': 'Sign Out',
    '功能開發中，敬請期待': 'Feature under construction', '演示版本，功能開發中': 'Demo build · coming soon',
    '深色模式': 'Dark', '淺色模式': 'Light', '切換主題': 'Theme', '切換語言': 'Language',
    /* 頭部 */
    '香港消防設備管理總覽': 'HK Fire Equipment Overview', '全港設備態勢 · 實時監測': 'Citywide Real-time Monitoring',
    '全港總覽': 'Overview', '返回總覽': 'Back to Overview', '返回物業': 'Back to Property', '返回物業視圖': 'Back to Property',
    '消防設備大屏': 'Fire Safety Dashboard', '樓層消防點位': 'Floor Fire Devices', '樓宇視圖': 'BUILDING VIEW',
    /* KPI */
    '簽約物業': 'Properties', '樓宇總數': 'Buildings', '設備總數': 'Devices', '設備在線率': 'Online Rate',
    '當前告警': 'Active Alerts', '今日維護': "Today's Maint.", '樓層總數': 'Floors', '在線設備': 'Online Devices',
    '維護中設備': 'Under Maint.', '感測器正常率': 'Sensor Health', '樓宇數量': 'Buildings',
    '共': 'Total', '今日計劃': "Today's Plan", '異常': 'Abnormal', '正常率': 'Normal Rate', '至': 'to',
    '個': '', '棟': '', '層': '', '條': '', '項': '',
    /* 狀態 / 等級 */
    '在線': 'Online', '高級': 'Critical', '維護': 'Maint.', '離線': 'Offline',
    '嚴重': 'Critical', '一般': 'Major', '預警': 'Minor', '未處理': 'Open', '處理中': 'Processing',
    '嚴重告警': 'Critical', '維護/一般告警': 'Maint. / Major', '運行正常': 'Normal', '數據中斷': 'No Data',
    '有告警': 'Alerts', '部分離線': 'Partial Offline', '無告警': 'No Alerts', '告警': 'Alerts',
    /* 感測器 / 設備 */
    '火災感測': 'Fire Sensing', '水浸/噴淋': 'Water / Sprinkler', '暖通空調': 'HVAC', '消防泵組': 'Pump Group', '通訊模組': 'Comm Module',
    '煙感探測器': 'Smoke Detector', '溫感探測器': 'Heat Detector', '噴淋頭': 'Sprinkler Head', '消防栓': 'Hydrant',
    '空調機組': 'AHU', '排煙風機': 'Smoke Fan', '消防水泵': 'Fire Pump', '控制主機': 'Control Panel', '中繼器': 'Repeater',
    /* 告警類型 */
    '煙感觸發': 'Smoke Triggered', '溫感異常': 'Heat Abnormal', '水壓過低': 'Low Water Pressure', '噴淋故障': 'Sprinkler Fault',
    '水泵故障': 'Pump Fault', '通訊中斷': 'Comm Lost', '電源異常': 'Power Abnormal', '排煙風機停機': 'Smoke Fan Stopped',
    '空調超溫': 'HVAC Overheat', '誤報待核': 'False Alarm Pending',
    /* 維護類型 */
    '例行巡檢': 'Routine Inspection', '季度聯動測試': 'Quarterly Test', '更換噴淋頭': 'Sprinkler Swap',
    '傳感器校準': 'Sensor Calibration', '年度大修': 'Annual Overhaul', '電池更換': 'Battery Swap',
    '今日': 'Today', '明日': 'Tomorrow',
    /* 區域 */
    '全港': 'All HK', '香港島': 'Hong Kong Is.', '九龍': 'Kowloon', '新界': 'New Territories',
    /* 面板標題 */
    '設備狀態分布': 'Device Status', '感測器狀態概覽': 'Sensor Overview', '感測器分類統計': 'Sensor by Type',
    '項目狀況': 'Project Status', '點擊切換項目視圖': 'Click to switch project',
    '返回查看全局': 'Back to Overview', '已切換項目視圖': 'Switched to project view',
    '已返回全局視圖': 'Back to global view', '消防設備管理': 'Fire Equipment Management',
    '今日起 7 天': 'Next 7 days', '物業': 'Props.',
    '系統健康趨勢': 'Health Trend', '維護計劃': 'Maintenance Plan', '最新告警': 'Latest Alerts',
    '物業告警清單': 'Property Alerts', '當前樓層設備狀態': 'Floor Device Status', '感測器類型統計': 'Sensor Types',
    '當前樓層告警': 'Floor Alerts', '設備詳情': 'Device Detail', '各樓層設備在線率': 'Online Rate by Floor',
    '各樓層告警數量': 'Alerts by Floor', '各樓宇設備在線率': 'Online Rate by Building', '各樓宇告警數量': 'Alerts by Building',
    '設備在線率最低 TOP 5': 'Lowest Online Rate · TOP 5', '告警數量最多 TOP 5': 'Most Alerts · TOP 5',
    '全部': 'All', '全部樓宇': 'All Buildings', '24小時': '24H', '7天': '7D', '30天': '30D',
    '本物業': 'This Property', '點擊進入樓宇': 'Click to open building', '當前樓層 FLOOR': 'FLOOR',
    /* 地圖 */
    '搜索物業名稱…': 'Search property…', '搜索樓宇名稱…': 'Search building…',
    '自動巡檢 · 每 30 秒切換重點物業': 'Auto patrol · key properties every 30s',
    '點擊進入物業視圖 →': 'Click to open property view →',
    '狀態': 'Status', '設備': 'Devices', '樓宇': 'Buildings', '設備總數': 'Total Devices',
    '地圖加載失敗，請檢查網絡連接': 'Map failed to load · check network',
    /* 彈窗 / 按鈕 */
    '告警詳情': 'Alert Detail', '所屬物業': 'Property', '樓宇 / 樓層': 'Building / Floor', '發生時間': 'Time',
    '持續時間': 'Elapsed', '設備類型': 'Device Type', '處理狀態': 'Status', '處理建議': 'Recommendation',
    '關聯設備': 'Related Device', '關閉': 'Close', '查看物業視圖': 'Property View', '定位到樓層設備': 'Locate Device',
    '放大': 'Zoom In', '縮小': 'Zoom Out', '重置': 'Reset', '重置視圖': 'Reset View',
    /* 設備詳情 */
    '基礎信息': 'Basics', '安裝位置': 'Location', '所屬感測器': 'Sensors', '供應商': 'Vendor',
    '最近巡檢': 'Last Check', '下次校準': 'Next Calibration', '最近告警': 'Recent Alert',
    '安裝於': 'Installed', '點擊定位設備': 'Click to locate device', '點擊平面圖設備查看': 'Click a device on the plan',
    '點擊切換樓層': 'Click to switch floor', '當前樓層': 'Current Floor', '在線率': 'Online Rate',
    /* 空狀態 */
    '暫無數據': 'No Data', '當前篩選條件下暫無告警': 'No alerts under current filter',
    '沒有符合條件的樓宇': 'No matching buildings', '該樓宇暫無未關閉告警': 'No open alerts in this building',
    '當前樓層暫無感測器': 'No sensors on this floor', '當前樓層無未關閉告警': 'No open alerts on this floor',
    '未來 7 天暫無維護計劃': 'No maintenance in 7 days',
    /* 物業 / 樓宇名 */
    '國際金融中心': 'IFC', '太古坊': 'Taikoo Place', '華潤大廈': 'CRC Tower', '環球貿易廣場': 'ICC',
    '港威大廈': 'Gateway', '又一城': 'Festival Walk', '奧海城': 'Olympian City', '德福廣場': 'Telford Plaza',
    '新城市廣場': 'New Town Plaza', '香港科學園': 'HKSTP', '將軍澳中心': 'TKO Centre',
    '屯門市廣場': 'TM Town Plaza', '荃灣廣場': 'TW Plaza',
    'IFC 一期': 'IFC Tower 1', 'IFC 二期': 'IFC Tower 2', 'IFC 商場': 'IFC Mall',
    '德宏大廈': 'Dorset House', '多盛大廈': 'Dexter House', '林肯大廈': 'Lincoln House',
    '華潤大廈主樓': 'CRC Tower Main', 'ICC 主塔': 'ICC Main Tower', '圓方商場': 'Elements Mall',
    '港威一座': 'Gateway T1', '港威二座': 'Gateway T2', '港威三座': 'Gateway T3',
    '又一城商場': 'Festival Walk Mall', '又一城寫字樓': 'Festival Walk Office',
    '奧海城一期': 'Olympian City 1', '奧海城二期': 'Olympian City 2', '奧海城三期': 'Olympian City 3',
    '德福一期': 'Telford 1', '德福二期': 'Telford 2',
    '新城市一期': 'NTP 1', '新城市三期': 'NTP 3', '新城市五期': 'NTP 5',
    '科研樓一座': 'R&D Bldg 1', '科研樓二座': 'R&D Bldg 2', '科研樓三座': 'R&D Bldg 3',
    '將軍澳商場': 'TKO Mall', '將軍澳中心基座': 'TKO Centre Podium',
    '屯門市廣場一期': 'TMTP 1', '屯門市廣場二期': 'TMTP 2', '屯門市廣場三期': 'TMTP 3',
    '荃灣廣場商場': 'TW Plaza Mall', '荃灣廣場寫字樓': 'TW Plaza Office',
    /* 地區 / 供應商 */
    '中環': 'Central', '鰂魚涌': 'Quarry Bay', '灣仔': 'Wan Chai', '西九龍': 'West Kowloon', '尖沙咀': 'Tsim Sha Tsui',
    '九龍塘': 'Kowloon Tong', '大角咀': 'Tai Kok Tsui', '九龍灣': 'Kowloon Bay', '沙田': 'Sha Tin',
    '大埔': 'Tai Po', '將軍澳': 'Tseung Kwan O', '屯門': 'Tuen Mun', '荃灣': 'Tsuen Wan',
    '西門子': 'Siemens', '霍尼韋爾': 'Honeywell', '諾帝菲爾': 'Notifier', '施耐德': 'Schneider', '泛海三江': 'FHSJ',
    /* 樓層位置 */
    '西北角機房': 'NW Plant Room', '北側走廊西': 'N Corridor W', '北側走廊中': 'N Corridor M', '北側走廊東': 'N Corridor E',
    '東北辦公區': 'NE Office', '東側茶水間': 'E Pantry', '東側走廊': 'E Corridor', '東側會議室': 'E Meeting',
    '東南角機房': 'SE Plant Room', '南側走廊東': 'S Corridor E', '南側走廊中': 'S Corridor M', '南側走廊西': 'S Corridor W',
    '西南樓梯間': 'SW Staircase', '西側走廊南': 'W Corridor S', '西側走廊北': 'W Corridor N', '西側設備間': 'W Plant Room',
    '辦公區 A': 'Office A', '辦公區 B': 'Office B', '辦公區 C': 'Office C', '開放辦公區': 'Open Office',
    '培訓室': 'Training', '電梯廳': 'Lift Lobby', '核心筒': 'Core', '消防前室': 'Fire Vestibule',
    '機房': 'Plant Room', '會議室 I': 'Meeting I', '會議室 II': 'Meeting II', '茶水間': 'Pantry', '樓梯間': 'Staircase',
    '設備間': 'Equip. Room', '電梯廳 · 消防前室': 'Lift Lobby · Vestibule',
    /* 租戶 */
    '香港恒益集團': 'Hang Yick Group', '中原金融控股': 'Centraline Fin.', '亞太通商律師行': 'Asia-Pacific Law',
    '南華物流集團': 'Nam Wah Logistics', '啟德科技有限公司': 'Kai Tak Tech', '寶華保險': 'Po Wah Ins.',
    '維信會計師事務所': 'Wilson CPA',
    /* 其他 */
    '顯示': 'Show', '按風險排序': 'sorted by risk', '評分': 'Score', '樓層': 'Floors', '離線': 'Offline',
    '嚴重告警物業數': 'Critical Properties', '覆蓋': 'Covering', '大區域': 'regions', '最高': 'Tallest',
    '感測器': 'Sensors', '未來 7 天': 'Next 7 days', '健康評分': 'Health Score', '分': '',
    '值班管理員': 'Duty Manager', '陳志明': 'Chan Chi-ming', '消防局 · 中西區': 'FSD · Central & Western',
    '當前': 'Now', '層': 'F', '設備在線率': 'Online Rate', '樓宇 · 樓層': 'Building · Floor', '所屬感測器': 'Sensors',
    '設備總數': 'Total Devices', '設備': 'Devices', '離線': 'Offline', '維護': 'Maint.'
  }
};
function T(s) {
  if (LANG === 'en' && DICT.en[s] != null) return DICT.en[s];
  return s;
}
/* 設備名翻譯：「煙感探測器 123」→「Smoke Detector 123」 */
function tDev(s) {
  if (LANG !== 'en' || !s) return s;
  const i = s.lastIndexOf(' ');
  return i > 0 ? T(s.slice(0, i)) + ' ' + s.slice(i + 1) : T(s);
}
function applyI18nStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = T(el.dataset.i18nTitle); });
}

/* ---------- 主題（深色 / 淺色） ---------- */
let THEME = localStorage.getItem('theme') || 'dark';
function applyTheme(t) {
  THEME = t;
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
  const btn = document.getElementById('tbTheme');
  if (btn) btn.innerHTML = icon(t === 'dark' ? 'moon' : 'sun', 16);
  if (typeof window.__mapSetStyle === 'function') window.__mapSetStyle(t);
}
function toggleTheme() { applyTheme(THEME === 'dark' ? 'light' : 'dark'); }
function setLang(l) {
  if (l === LANG) return;
  localStorage.setItem('lang', l);
  location.reload();
}

/* ---------- Toast ---------- */
let __toastTimer = null;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.innerHTML = `${icon('bell', 15)} ${T(msg)}`;
  el.classList.add('show');
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- 線性圖標 ---------- */
const ICON_PATHS = {
  flame: '<path d="M12 3c2.6 3.1 5 5.4 5 8.7a5 5 0 0 1-10 0c0-1.5.6-2.7 1.5-3.9.4 1 1 1.7 2 2.2-.3-2.5.2-4.9 1.5-7z"/>',
  droplet: '<path d="M12 3.5s5.8 6 5.8 9.7a5.8 5.8 0 0 1-11.6 0C6.2 9.5 12 3.5 12 3.5z"/>',
  fan: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c0-3-1-5.3 2.4-5.8 2.6-.4 3.9 2.7 1.6 4.5M14 13.2c2.6 1.5 5 1.9 3.6 5-1.1 2.4-4.4 1.6-4.7-1.3M10 13.2c-2.6 1.5-4.4 3.4-6.1.8-1.3-2.2 1.2-4.5 3.8-3.2"/>',
  pump: '<path d="M12 2.8l7.4 4.3v9.8L12 21.2l-7.4-4.3V7.1z"/><circle cx="12" cy="12" r="2.6"/><path d="M12 5.2v4.2M12 14.6v4.2M6.8 8.9l3.4 2M13.8 13.1l3.4 2"/>',
  comm: '<path d="M4.5 12.2a7.5 7.5 0 0 1 15 0M7.8 12.2a4.2 4.2 0 0 1 8.4 0"/><circle cx="12" cy="13.6" r="1.6" fill="currentColor" stroke="none"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  warn: '<path d="M12 4L2.8 19.5h18.4z"/><path d="M12 10v4.2"/><circle cx="12" cy="17" r=".4" fill="currentColor"/>',
  cal: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4"/>',
  phone: '<path d="M6.8 3.5L10 4l1.2 4-2 1.6a13 13 0 0 0 5.2 5.2l1.6-2 4 1.2.5 3.2a1.8 1.8 0 0 1-2 2A16.5 16.5 0 0 1 3.5 5.5a1.8 1.8 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M9 11.8l2.1 2.1 4-4.2"/>',
  chev: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  build: '<path d="M5 21V5.5L13 3v18M13 9l6 1.8V21M5 21h16"/><path d="M8 8.5h2M8 12.5h2M8 16.5h2M16 14.5h1"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  layers: '<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M4.5 12.5L12 16.5l7.5-4M4.5 16.5L12 20.5l7.5-4"/>',
  storm: '<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5"/>',
  tool: '<path d="M14.5 6.5a4 4 0 0 0-5.4 5L4 16.6V20h3.4l5.1-5.1a4 4 0 0 0 5-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 12h5M10 15.5h5"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  moon: '<path d="M20 13.2A8 8 0 1 1 10.8 4a6.6 6.6 0 0 0 9.2 9.2z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.4 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.4-3.9-8.5s1.3-6.1 3.9-8.5z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.5h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
  logout: '<path d="M9 4H5.5v16H9M15 8l4 4-4 4M19 12H9.5"/>',
  dots: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M20 20H4"/>'
};
function icon(name, size = 16, sw = 1.7) {
  return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}

/* ---------- 數字滾動 ---------- */
function countUp(el, to, opts = {}) {
  const dur = opts.dur || 1100, dec = opts.dec ?? 0, suffix = opts.suffix || '';
  const t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (to * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- 懸浮提示 ---------- */
const Tip = (() => {
  let el;
  const ensure = () => { if (!el) { el = document.createElement('div'); el.className = 'tip'; document.body.appendChild(el); } return el; };
  return {
    show(html, x, y) {
      const t = ensure();
      t.innerHTML = html; t.style.display = 'block';
      const r = t.getBoundingClientRect();
      let left = x + 18, top = y + 14;
      if (left + r.width > innerWidth - 12) left = x - r.width - 18;
      if (top + r.height > innerHeight - 12) top = y - r.height - 14;
      t.style.left = left + 'px'; t.style.top = top + 'px';
    },
    hide() { if (el) el.style.display = 'none'; }
  };
})();
/* 坐標換算：屏幕被 scale，需把事件坐標轉回 1920×1080 空間 */
function screenXY(e) {
  const screen = document.getElementById('screen');
  const r = screen.getBoundingClientRect();
  const s = r.width / 1920;
  return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
}

/* ---------- 告警詳情彈窗 ---------- */
function openAlarmModal(alarm) {
  closeAlarmModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'alarmModal';
  overlay.innerHTML = `
    <div class="modal">
      <header>
        <div class="m-title"><span class="lv-dot" style="background:${LEVEL_COLOR[alarm.level]}"></span>
          ${T('告警詳情')} <em>${alarm.id}</em></div>
        <button class="m-close">${icon('close', 16)}</button>
      </header>
      <div class="m-body">
        <div class="m-row m-head" style="--lc:${LEVEL_COLOR[alarm.level]}">
          <span class="m-type">${T(alarm.type)}</span>
          <span class="m-lv">${T(alarm.levelName)}${LANG === 'en' ? '' : '告警'}</span>
          <span class="m-status">${T(alarm.status)}</span>
        </div>
        <dl class="m-grid">
          <div><dt>${T('所屬物業')}</dt><dd>${T(alarm.propertyName)}</dd></div>
          <div><dt>${T('樓宇 / 樓層')}</dt><dd>${T(alarm.building)} · ${alarm.floor}</dd></div>
          <div><dt>${T('發生時間')}</dt><dd>${fmtMD(alarm.time)} ${fmtHM(alarm.time)} <em>（${ago(alarm.time)}）</em></dd></div>
          <div><dt>${T('持續時間')}</dt><dd>${ago(alarm.time).replace(T('前'), '')}</dd></div>
          <div><dt>${T('設備類型')}</dt><dd>${T((DEVICE_KINDS.find(k => k.key === alarm.kind) || {}).label || '-')}</dd></div>
          <div><dt>${T('處理狀態')}</dt><dd class="${alarm.status === '未處理' ? 't-crit' : 't-warn'}">${T(alarm.status)}</dd></div>
        </dl>
        <div class="m-sec">
          <h4>${T('處理建議')}</h4>
          <p>${LANG === 'en'
            ? (SUGGEST_EN[alarm.type] || 'Dispatch on-duty staff to verify the device within 10 minutes, then follow the emergency protocol.')
            : (SUGGEST[alarm.type] || '請值班人員 10 分鐘內到場核實設備狀態，確認後按應急預案處理並回寫處理結果。')}</p>
        </div>
        <div class="m-sec">
          <h4>${T('關聯設備')}</h4>
          <div class="m-dev">
            ${icon((DEVICE_KINDS.find(k => k.key === alarm.kind) || { icon: 'warn' }).icon, 18)}
            <span>${T(alarm.propertyName)} · ${T(alarm.building)} · ${alarm.floor} · ${T((DEVICE_KINDS.find(k => k.key === alarm.kind) || {}).label || '')}</span>
          </div>
        </div>
      </div>
      <footer>
        <button class="btn ghost" data-act="close">${T('關閉')}</button>
        <button class="btn" data-act="p">${T('查看物業視圖')}</button>
        <button class="btn primary" data-act="b">${T('定位到樓層設備')}</button>
      </footer>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) return closeAlarmModal();
    const act = e.target.closest('[data-act]')?.dataset.act;
    const r1 = window.__L1STATE__ ? '&r=' + window.__L1STATE__ : '';
    if (act === 'close') closeAlarmModal();
    if (act === 'p') location.href = `property.html?p=${alarm.propertyId}${r1}`;
    if (act === 'b') {
      const pi = PROPERTIES.findIndex(p => p.id === alarm.propertyId);
      const bi = PROPERTIES[pi].buildings.findIndex(b => b.n === alarm.building);
      location.href = `building.html?p=${alarm.propertyId}&b=${Math.max(0, bi)}&f=${alarm.floor}${r1}`;
    }
  });
}
function closeAlarmModal() {
  const m = document.getElementById('alarmModal');
  if (!m) return;
  m.classList.remove('show');
  setTimeout(() => m.remove(), 240);
}
const SUGGEST = {
  '煙感觸發': '立即通知安保人員現場確認是否存在火情；確認為誤報後執行消音並記錄，連續誤報需安排更換探測器。',
  '溫感異常': '核查區域溫度與探測器讀數，排查空調超溫或設備過熱，必要時切斷非必要負荷並通知工程部。',
  '水壓過低': '檢查市政供水與穩壓泵運行狀態，排查管道泄漏；聯繫水務署確認片區水壓，2 小時內復測。',
  '噴淋故障': '檢查噴淋末端試水裝置與報警閥，確認為堵塞或損壞後掛牌停用並 24 小時內更換噴淋頭。',
  '水泵故障': '切換至備用泵運行，檢查主泵電源與控制回路，通知維保單位 4 小時內到場檢修。',
  '通訊中斷': '檢查中繼器電源與總線接線，重啟通訊模組；持續中斷超過 30 分鐘需啟用人工巡檢補充。',
  '電源異常': '檢查 EPS 應急電源切換狀態與蓄電池電壓，確認市電供應，必要時啟用發電機支援。',
  '排煙風機停機': '現場檢查風機控制櫃與熱繼電器，手動啟動測試；故障期間加強該區域人工巡查。',
  '空調超溫': '調整空調運行參數，檢查濾網與冷凝器，高溫時段加密巡查頻次。',
  '誤報待核': '安排人員 30 分鐘內核實現場情況，確認後按誤報流程登記，並評估是否校準或更換探頭。'
};
/* 英文處理建議（與 SUGGEST 鍵對應） */
const SUGGEST_EN = {
  '煙感觸發': 'Dispatch security to verify fire condition on site; silence and log if false. Replace the detector after repeated false alarms.',
  '溫感異常': 'Cross-check zone temperature and detector reading; rule out HVAC overheat or equipment fault, shed non-critical load if needed.',
  '水壓過低': 'Inspect municipal supply and pressure pumps for leakage; confirm district pressure with WSD and re-test within 2 hours.',
  '噴淋故障': 'Check sprinkler test valve and alarm valve; tag out blocked or damaged heads and replace within 24 hours.',
  '水泵故障': 'Switch to standby pump; inspect power and control circuit. Contractor on site within 4 hours.',
  '通訊中斷': 'Check repeater power and bus wiring, restart the comm module; manual patrol required beyond 30 minutes of downtime.',
  '電源異常': 'Verify EPS transfer state and battery voltage; confirm mains supply and start generator if necessary.',
  '排煙風機停機': 'Inspect fan control cabinet and thermal relay, run manual start test; increase manual patrol during the fault.',
  '空調超溫': 'Adjust HVAC setpoints, clean filters and condenser; increase patrol frequency during hot hours.',
  '誤報待核': 'Verify on site within 30 minutes, register as false alarm if confirmed, then evaluate recalibration or replacement.'
};

/* ---------- 導航 ---------- */
const qs = k => new URLSearchParams(location.search).get(k);

/* ---------- 頂部導航欄（三頁統一） ---------- */
const NAV_ITEMS = [
  { key: 'overview', zh: '總覽', en: 'Overview' },
  { key: 'monitor',  zh: '監控', en: 'Monitor' },
  { key: 'alarm',    zh: '警報', en: 'Alerts' },
  { key: 'maint',    zh: '維護', en: 'Maintenance' },
  { key: 'analysis', zh: '分析', en: 'Analysis' },
  { key: 'report',   zh: '報告', en: 'Reports' }
];
function initTopbar(active) {
  const nav = document.getElementById('mainNav');
  if (nav) {
    nav.innerHTML = NAV_ITEMS.map(it => `
      <button class="mn ${it.key === active ? 'on' : ''}" data-k="${it.key}">${T(it.zh)}</button>`).join('')
      + `<div class="dd dd-nav">
          <button class="mn ${active === 'more' ? 'on' : ''}" data-k="more">${T('更多')}${icon('chev', 13)}</button>
          <div class="dd-menu">
            <button data-k="settings">${icon('gear', 14)} ${T('系統設定')}</button>
            <button data-k="logs">${icon('doc', 14)} ${T('操作日誌')}</button>
            <button data-k="help">${icon('shield', 14)} ${T('幫助中心')}</button>
          </div>
        </div>`;
    nav.addEventListener('click', e => {
      const item = e.target.closest('.mn');
      if (!item) return;
      const k = item.dataset.k;
      if (k === 'overview') {
        location.href = 'index.html';
        return;
      }
      if (!e.target.closest('.dd-nav')) toast('功能開發中，敬請期待');
    });
  }
  /* 右側控件：主題 / 語言 / 個人信息 */
  const ctrl = document.getElementById('tbCtrl');
  if (ctrl) {
    ctrl.innerHTML = `
      <button class="tb-btn" id="tbTheme" title="${T('切換主題')}"></button>
      <div class="lang-seg" title="${T('切換語言')}">
        <button data-lang="zh" class="${LANG === 'zh' ? 'on' : ''}">繁</button>
        <button data-lang="en" class="${LANG === 'en' ? 'on' : ''}">EN</button>
      </div>
      <div class="dd">
        <button class="user-btn" id="tbUser">
          <span class="av">陳</span><b>${T('值班管理員')}</b>${icon('chev', 13)}
        </button>
        <div class="dd-menu">
          <div class="dd-hd"><span class="av">陳</span><div><b>${T('陳志明')}</b><i>${T('消防局 · 中西區')}</i></div></div>
          <button data-u="profile">${icon('user', 14)} ${T('帳號資料')}</button>
          <button data-u="pref">${icon('gear', 14)} ${T('偏好設定')}</button>
          <hr>
          <button data-u="out" class="danger">${icon('logout', 14)} ${T('退出登入')}</button>
        </div>
      </div>`;
    document.getElementById('tbTheme').onclick = toggleTheme;
    ctrl.querySelectorAll('.lang-seg button').forEach(b => b.onclick = () => setLang(b.dataset.lang));
    ctrl.querySelectorAll('.dd-menu button').forEach(b => b.onclick = () => toast('演示版本，功能開發中'));
  }
  /* 下拉開合（更多 / 個人信息） */
  document.addEventListener('click', e => {
    document.querySelectorAll('.dd.open').forEach(dd => {
      if (!dd.contains(e.target)) dd.classList.remove('open');
    });
    const trigger = e.target.closest('.dd > .mn, .dd > .user-btn');
    if (trigger) {
      const dd = trigger.closest('.dd');
      const was = dd.classList.contains('open');
      document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open'));
      if (!was) dd.classList.add('open');
    }
  });
  applyTheme(THEME);
  applyI18nStatic();
}

/* ---------- 列表自動滾動（超出可視高度循環滾動） ---------- */
function autoScroll(el) {
  if (!el) return;
  let paused = false, top = 0;
  el.addEventListener('mouseenter', () => paused = true);
  el.addEventListener('mouseleave', () => paused = false);
  const h = () => el.firstElementChild ? el.firstElementChild.offsetHeight : 0;
  clearInterval(el._asTimer);
  el._asTimer = setInterval(() => {
    if (paused || el.scrollHeight <= el.clientHeight + 8) return;
    top += 1;
    if (top >= el.scrollHeight - el.clientHeight) top = 0;
    el.scrollTop = top;
  }, 60);
}

/* ---------- 通用：空狀態 ---------- */
const EMPTY = html => `<div class="empty">${icon('doc', 22)}<p>${T(html || '暫無數據')}</p></div>`;
