/* ============================================================
 * L1 全港消防設備總覽（高德地圖）· 支持項目視圖（Fai Huang / SHK）
 * ============================================================ */

fitScreen();
initTopbar('overview');
document.getElementById('brandIcon').innerHTML = icon('shield', 20);
document.getElementById('searchIcon').innerHTML = icon('search', 14);

/* ---------- 項目定義（兩個項目平分物業） ---------- */
const PROJECTS = (() => {
  const half = Math.ceil(DB.P.length / 2);
  return [
    { id: 'fh', name: 'Fai Huang', props: DB.P.slice(0, half) },
    { id: 'shk', name: 'SHK', props: DB.P.slice(half) }
  ];
})();
let projScope = sessionStorage.getItem('l1proj');
if (projScope && !PROJECTS.some(p => p.id === projScope)) projScope = null;
const curProject = () => PROJECTS.find(p => p.id === projScope);
const scopeProps = () => projScope ? curProject().props : DB.P;
const inScope = (pr, id) => pr.props.some(p => p.id === id);

/* ---------- 實時告警池 ---------- */
let liveAlarms = [...DB.alarms];
const scopeAlarmList = () => projScope ? liveAlarms.filter(a => inScope(curProject(), a.propertyId)) : liveAlarms;
const scopeMaintList = () => projScope ? DB.maintenance.filter(m => inScope(curProject(), m.propertyId)) : DB.maintenance;

/* 範圍聚合統計 */
function scopeStats() {
  const props = scopeProps();
  const sum = f => props.reduce((s, p) => s + f(p), 0);
  const total = sum(p => p.total), online = sum(p => p.online);
  return {
    props, nProps: props.length,
    buildings: sum(p => p.buildings.length),
    devices: total, online,
    onlineRate: +(online / total * 100).toFixed(1),
    crit: sum(p => p.crit), maint: sum(p => p.maint), offline: sum(p => p.offline),
    sensors: sum(p => p.sensors.reduce((a, x) => a + x.total, 0)),
    sensorAbn: sum(p => p.sensorAbn),
    maintToday: scopeMaintList().filter(m => m.dayOffset === 0).length,
    score: Math.round(sum(p => p.score) / props.length)
  };
}
function projAgg(pr) {
  const sum = f => pr.props.reduce((s, p) => s + f(p), 0);
  const alarms = liveAlarms.filter(a => inScope(pr, a.propertyId));
  const critCnt = sum(p => p.crit);
  return {
    buildings: sum(p => p.buildings.length), devices: sum(p => p.total),
    alarms: alarms.length,
    score: Math.round(sum(p => p.score) / pr.props.length),
    col: alarms.some(a => a.level === 1) || critCnt > 0 ? C.crit : (alarms.length || sum(p => p.maint) > 0) ? C.warn : C.ok
  };
}

/* ---------- 篩選狀態（hash 優先，storage 兜底） ---------- */
const hashState = (location.hash.match(/s=([^&]+)/) || [])[1];
const savedL1 = hashState ? JSON.parse(decodeURIComponent(hashState)) : JSON.parse(sessionStorage.getItem('l1f') || '{}');
const saveL1 = () => {
  const s = JSON.stringify({ region: regionFilter, status: statusFilter, trend: trendRange, alarmLevel });
  sessionStorage.setItem('l1f', s);
  window.__L1STATE__ = encodeURIComponent(s);
};
let regionFilter = savedL1.region || 'ALL';
let statusFilter = savedL1.status || null;
let trendRange = savedL1.trend || '24h';
let alarmLevel = savedL1.alarmLevel || 0;
let searchQ = '';

/* 統一下鑽入口：攜帶當前篩選狀態 */
const goProperty = id => { location.href = `property.html?p=${id}${window.__L1STATE__ ? '&r=' + window.__L1STATE__ : ''}`; };

function propStatus(p) {
  if (p.critAlarms > 0 || p.crit > 0) return 'crit';
  if (p.alarmCount > 0 || p.maint > 0) return 'warn';
  if (p.onlineRate < 85) return 'idle';
  return 'ok';
}
const ST_LABEL = { crit: '嚴重告警', warn: '維護/一般告警', ok: '運行正常', idle: '數據中斷' };
const stColor = st => statusColor(st === 'warn' ? 'maint' : st === 'idle' ? 'offline' : st === 'crit' ? 'crit' : 'online');

/* ============================================================
 * 渲染層（全局 / 項目範圍通用）
 * ============================================================ */

/* ---------- 頭部 ---------- */
function updateHeader() {
  const st = scopeStats();
  document.querySelector('.hd-title h1').textContent = projScope
    ? `${curProject().name} · ${T('消防設備管理')}` : T('香港消防設備管理總覽');
  document.getElementById('hdScore').innerHTML = CHART.gauge(st.score, { size: 44, width: 5 });
}

/* ---------- KPI ---------- */
function renderKPIs() {
  const st = scopeStats();
  const al = scopeAlarmList();
  let tall = { f: 0, n: '—' };
  scopeProps().forEach(p => p.buildings.forEach(b => { if (b.f > tall.f) tall = b; }));
  const regions = new Set(scopeProps().map(p => p.region)).size;
  const kpiDefs = [
    { label: '簽約物業', icon: 'grid', num: st.nProps, unit: '個', sub: `${T('覆蓋')} <b class="up">${regions}</b> ${T('大區域')}` },
    { label: '樓宇總數', icon: 'build', num: st.buildings, unit: '棟', sub: `${T('最高')} <b>${tall.f}F</b> ${T(tall.n)}` },
    { label: '設備總數', icon: 'layers', num: st.devices, unit: '個', sub: `${T('感測器')} <b>${fmtNum(st.sensors)}</b> ${T('個')}` },
    { label: '設備在線率', icon: 'arrowUp', ring: st.onlineRate, sub: `${T('離線')} <b class="down">${fmtNum(st.offline)}</b> ${T('個')}` },
    { label: '當前告警', icon: 'warn', num: al.length, unit: '條', color: 'var(--crit)', sub: `${T('嚴重')} <b class="down">${al.filter(a => a.level === 1).length}</b> · ${T('處理中')} <b>${al.filter(a => a.status === '處理中').length}</b>` },
    { label: '今日維護', icon: 'tool', num: st.maintToday, unit: '項', color: 'var(--warn)', sub: `${T('未來 7 天')} <b>${scopeMaintList().length}</b> ${T('項')}` }
  ];
  document.getElementById('kpis').innerHTML = kpiDefs.map(k => `
  <div class="kpi">
    <span class="k-label">${icon(k.icon, 14)}${T(k.label)}</span>
    <span class="k-val">
      ${k.ring != null
        ? `<span class="num" id="kpiRate" style="color:${scoreColor(k.ring)}">0.0</span><span class="unit">%</span>`
        : `<span class="num count" data-to="${k.num}" style="${k.color ? 'color:' + k.color : ''}">0</span><span class="unit">${T(k.unit)}</span>`}
    </span>
    <span class="k-sub">${k.sub}</span>
  </div>`).join('');
  document.querySelectorAll('.kpi .count').forEach(el => countUp(el, +el.dataset.to));
  countUp(document.getElementById('kpiRate'), st.onlineRate, { dec: 1 });
}

/* ---------- 左上：設備狀態餅圖（ECharts 實心餅圖，hover 交互） ---------- */
let pieChart = null;
function renderDonut() {
  const st = scopeStats();
  const devData = [
    { key: 'online', label: '在線', value: st.devices - st.crit - st.maint - st.offline, color: C.ok },
    { key: 'crit', label: '高級', value: st.crit, color: C.crit },
    { key: 'maint', label: '維護', value: st.maint, color: C.warn },
    { key: 'offline', label: '離線', value: st.offline, color: C.idle }
  ];
  document.getElementById('devSub').textContent = projScope ? curProject().name : T('全港 · 實時');
  document.getElementById('devDonut').innerHTML = `
    <div id="pieChart"></div>
    <div class="legend">${devData.map(d => `
      <div class="lg-item ${statusFilter && statusFilter !== d.key ? 'dim' : ''}" data-k="${d.key}">
        <span class="lg-dot" style="background:${d.color}"></span>
        <span class="lg-name">${T(d.label)}</span>
        <span class="lg-val">${fmtNum(d.value)}</span>
        <span class="lg-pct">${(d.value / st.devices * 100).toFixed(1)}%</span>
      </div>`).join('')}
    </div>`;
  document.querySelectorAll('#devDonut .lg-item').forEach(el => {
    el.onclick = () => {
      const k = el.dataset.k;
      statusFilter = statusFilter === k ? null : k;
      renderDonut();
      applyMapFilter();
      saveL1();
    };
  });

  const pieEl = document.getElementById('pieChart');
  if (window.echarts) {
    if (pieChart) pieChart.dispose();
    pieChart = echarts.init(pieEl, null, { renderer: 'canvas' });
    window.__pieChart = pieChart; /* 調試/驗證接口 */
    pieChart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(8,15,30,.94)',
        borderColor: 'rgba(99,140,210,.35)',
        padding: [8, 12],
        textStyle: { color: '#DCE6F5', fontSize: 12.5 },
        formatter: p => `<b>${p.name}</b><br/>${T('設備')} <b style="color:${p.color}">${fmtNum(p.value)}</b> ${T('個')} · ${p.percent}%`
      },
      series: [{
        type: 'pie',
        radius: '82%',
        center: ['50%', '50%'],
        minAngle: 4,
        animationType: 'expansion',
        animationDuration: 700,
        animationEasing: 'cubicOut',
        itemStyle: { borderColor: 'transparent', borderWidth: 0, borderRadius: 0 },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: { shadowBlur: 24, shadowColor: 'rgba(25,211,255,.5)' },
          label: {
            show: true,
            position: 'inside',
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            fontFamily: 'DIN Alternate, Bahnschrift, var(--num-font)',
            textBorderColor: 'rgba(6,12,24,.6)',
            textBorderWidth: 2,
            formatter: p => p.percent.toFixed(1) + '%'
          }
        },
        data: devData.filter(d => d.value > 0).map(d => ({ name: T(d.label), value: d.value, itemStyle: { color: d.color, shadowBlur: 14, shadowColor: d.color + '73' } }))
      }]
    });
  } else {
    pieEl.innerHTML = CHART.pie(devData, { size: 172 });
  }
}

/* ---------- 右下：感測器概覽 ---------- */
function renderSensors() {
  const props = scopeProps();
  const rows = SENSOR_TYPES.map(t => {
    const total = props.reduce((s, p) => s + p.sensors.find(x => x.key === t.key).total, 0);
    const abn = props.reduce((s, p) => s + p.sensors.find(x => x.key === t.key).abnormal, 0);
    return { label: `${icon(({ fire: 'flame', water: 'droplet', hvac: 'fan', pump: 'pump', comm: 'comm' })[t.key], 14)} ${T(t.full)}`, total, normal: total - abn, abnormal: abn, color: t.key === 'comm' ? C.purple : undefined };
  });
  const st = scopeStats();
  document.getElementById('sensorSub').textContent = `${T('正常率')} ${((st.sensors - st.sensorAbn) / st.sensors * 100).toFixed(2)}%`;
  document.getElementById('sensorPanel').innerHTML = CHART.stackedBars(rows);
}

/* ---------- 右上：健康趨勢（項目範圍用項目基準分） ---------- */
function renderTrend() {
  const st = scopeStats();
  const pts = trendSeries(trendRange, projScope ? st.score : undefined, projScope || undefined);
  const panel = document.getElementById('trendPanel');
  panel.innerHTML = CHART.line(pts, { h: 210 });
  const svg = panel.querySelector('svg');
  const cursor = svg.querySelector('.ln-cursor');
  const line = cursor.querySelector('line'), dot = cursor.querySelector('circle');
  svg.addEventListener('mousemove', e => {
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * 1000;
    const idx = Math.round((mx - 44) / (1000 - 58) * (pts.length - 1));
    if (idx < 0 || idx >= pts.length) return;
    const x = 44 + idx * (942 / (pts.length - 1));
    const min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v));
    const span = Math.max(4, max - min);
    const lo = min - span * .18, hi = max + span * .18;
    const y = 18 + (hi - pts[idx].v) / (hi - lo) * (210 - 48);
    cursor.style.display = '';
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    const sc = screenXY(e);
    Tip.show(`<div style="font-weight:600;margin-bottom:2px">${pts[idx].label}</div>
      <div class="t-row"><span>${T('健康評分')}</span><b style="color:${scoreColor(pts[idx].v)}">${pts[idx].v}</b></div>`, sc.x, sc.y);
  });
  svg.addEventListener('mouseleave', () => { cursor.style.display = 'none'; Tip.hide(); });
}

/* ---------- 左下：項目狀況 ---------- */
function renderProjects() {
  document.getElementById('projSub').textContent = projScope ? curProject().name : T('點擊切換項目視圖');
  document.getElementById('projPanel').innerHTML = `
    ${projScope ? `<button class="proj-back" id="projBack">${icon('back', 14)} ${T('返回查看全局')}</button>` : ''}
    <div class="proj-list">
      ${PROJECTS.map(pr => {
        const st = projAgg(pr);
        return `<button class="proj-card ${projScope === pr.id ? 'on' : ''}" data-id="${pr.id}">
          <span class="p-dot" style="background:${st.col}"></span>
          <span class="pc-main">
            <b>${pr.name}</b>
            <span>${T('物業')} ${pr.props.length} · ${T('樓宇')} ${st.buildings} · ${T('設備')} ${fmtNum(st.devices)}</span>
            <span>${T('告警')} <b class="down">${st.alarms}</b> ${T('條')} · ${T('健康評分')} <b style="color:${scoreColor(st.score)}">${st.score}</b></span>
          </span>
          <span class="pc-go">${icon('chev', 14)}</span>
        </button>`;
      }).join('')}
    </div>`;
  document.querySelectorAll('.proj-card').forEach(c => c.onclick = () => setProject(c.dataset.id));
  const back = document.getElementById('projBack');
  if (back) back.onclick = () => setProject(null);
}

function setProject(id) {
  if ((id || null) === projScope) return;
  projScope = id || null;
  if (projScope) sessionStorage.setItem('l1proj', projScope);
  else sessionStorage.removeItem('l1proj');
  renderAll();
  toast(id ? '已切換項目視圖' : '已返回全局視圖');
}

/* ---------- 底部左：維護計劃 ---------- */
function renderMaint() {
  const html = scopeMaintList().map(m => {
    const day = m.dayOffset === 0 ? T('今日') : m.dayOffset === 1 ? T('明日') : m.date;
    return `<div class="maint-row ${m.done ? 'done' : ''}">
      <div class="m-date"><b>${day}</b><span>${m.time}</span></div>
      <div class="m-main"><div class="t">${tDev(m.device)} · ${T(m.type)}</div>
        <div class="s">${T(m.propertyName)} · ${T(m.building)}</div></div>
      <div class="m-who">${m.assignee}</div>
    </div>`;
  }).join('');
  document.getElementById('maintPanel').innerHTML =
    `<div class="list"><div class="list-scroll" id="maintScroll">${html}</div></div>`;
  autoScroll(document.getElementById('maintScroll'));
}

/* ---------- 底部右：最新告警（含模擬實時推送） ---------- */
function alarmRowHTML(a, cls = '') {
  return `<div class="alarm-row ${cls}" data-id="${a.id}">
    <span class="a-dot l${a.level}" style="background:${LEVEL_COLOR[a.level]}"></span>
    <div class="a-main">
      <div class="a-type">${T(a.type)}<em>${T(a.levelName)}</em></div>
      <div class="a-loc">${T(a.propertyName)} · ${T(a.building)} · ${a.floor}</div>
    </div>
    <span class="a-time">${fmtHM(a.time)}</span>
    <span class="a-st ${a.status === '未處理' ? 'open' : 'doing'}">${T(a.status)}</span>
  </div>`;
}
function renderAlarms() {
  const list = scopeAlarmList().filter(a => !alarmLevel || a.level === alarmLevel).slice(0, 100);
  document.getElementById('alarmPanel').innerHTML = list.length
    ? `<div class="list"><div class="list-scroll" id="alarmScroll">${list.map(a => alarmRowHTML(a)).join('')}</div></div>`
    : EMPTY('當前篩選條件下暫無告警');
  document.querySelectorAll('#alarmPanel .alarm-row').forEach(row => {
    row.onclick = () => openAlarmModal(liveAlarms.find(a => a.id === row.dataset.id));
  });
  autoScroll(document.getElementById('alarmScroll'));
}

/* ============================================================
 * 中央高德地圖
 * ============================================================ */
const hoverCard = document.getElementById('hoverCard');
const mapPanel = document.querySelector('.map-panel');
const panelW = () => mapPanel.clientWidth;
const panelH = () => mapPanel.clientHeight;

const MAP_STYLE = { dark: 'amap://styles/darkblue', light: 'amap://styles/light' };
const HK_CENTER = [114.175, 22.335];
let gdMap = null;
const gdMarkers = {};

function markerHTML(p, focus) {
  const st = propStatus(p);
  const col = stColor(st);
  const d = Math.round(Math.min(26, 15 + p.total / 620));
  return `<div class="gm-mk ${st}${focus ? ' focus' : ''}" style="--c:${col}">
    <span class="gm-ring"></span>
    <span class="gm-dot" style="width:${d}px;height:${d}px;background:${col}33;border-color:${col}"></span>
    <span class="gm-core"></span>
    <b class="gm-lb">${T(p.name)}</b>
  </div>`;
}

function initMap() {
  if (!window.AMap) {
    document.getElementById('gdMap').innerHTML = `<div class="gm-empty">${EMPTY('地圖加載失敗，請檢查網絡連接')}</div>`;
    return;
  }
  gdMap = new AMap.Map('gdMap', {
    center: HK_CENTER,
    zoom: 11.2,
    zooms: [10, 17],
    mapStyle: MAP_STYLE[THEME] || MAP_STYLE.dark,
    viewMode: '2D',
    features: ['bg', 'road'],
    jogEnableZoom: true
  });
  window.__mapSetStyle = t => { if (gdMap) gdMap.setMapStyle(MAP_STYLE[t] || MAP_STYLE.dark); };

  DB.P.forEach(p => {
    const marker = new AMap.Marker({
      position: [p.lng, p.lat],
      content: markerHTML(p, false),
      anchor: 'center',
      zooms: [10, 20]
    });
    marker.on('mouseover', () => { pauseTour(); showHoverCard(p); });
    marker.on('mouseout', () => { if (!tourState.on) hoverCard.style.display = 'none'; });
    marker.on('click', () => goProperty(p.id));
    gdMap.add(marker);
    gdMarkers[p.id] = marker;
  });
  applyMapFilter(false);
}
initMap();

/* ---------- 懸浮信息卡 ---------- */
function showHoverCard(p) {
  const st = propStatus(p);
  const col = stColor(st);
  hoverCard.innerHTML = `
    <h5><span class="lg-dot" style="background:${col}"></span>${T(p.name)}</h5>
    <div class="mrow"><span>${T(REGION_NAME[p.region])} · ${T(p.district)}</span><b style="color:${scoreColor(p.score)}">${Math.round(p.score)} ${T('分')}</b></div>
    <div class="mrow"><span>${T('設備')} ${fmtNum(p.total)} · ${T('樓宇')} ${p.buildings.length}</span><b>${p.onlineRate}%</b></div>
    <div class="mrow"><span>${T('狀態')}：${T(ST_LABEL[st])}</span><b style="color:${p.alarmCount ? C.crit : C.ok}">${p.alarmCount} ${T('告警')}</b></div>
    <div class="go">${T('點擊進入物業視圖 →')}</div>`;
  let x = panelW() / 2, y = panelH() / 2;
  if (gdMap) {
    const px = gdMap.lngLatToContainer([p.lng, p.lat]);
    x = px.getX ? px.getX() : px.x;
    y = px.getY ? px.getY() : px.y;
  }
  hoverCard.style.display = 'block';
  hoverCard.style.left = Math.max(10, Math.min(x + 18, panelW() - 244)) + 'px';
  hoverCard.style.top = Math.max(10, Math.min(y - 14, panelH() - 172)) + 'px';
}

/* ---------- 地圖篩選（項目 + 區域 + 狀態 + 搜索） ---------- */
function matchFilter(p) {
  if (projScope && !curProject().props.includes(p)) return false;
  let ok = regionFilter === 'ALL' || p.region === regionFilter;
  if (ok && searchQ) ok = p.name.includes(searchQ) || p.district.includes(searchQ) || (p.en || '').toLowerCase().includes(searchQ.toLowerCase());
  if (ok && statusFilter) {
    if (statusFilter === 'crit') ok = p.crit > 0 || p.critAlarms > 0;
    if (statusFilter === 'maint') ok = p.maint > 0;
    if (statusFilter === 'offline') ok = p.offline > 2;
    if (statusFilter === 'online') ok = p.alarmCount === 0 && p.crit === 0;
  }
  return ok;
}
function applyMapFilter(fit = true) {
  const visible = [];
  DB.P.forEach(p => {
    const mk = gdMarkers[p.id];
    if (!mk) return;
    if (matchFilter(p)) { mk.show(); visible.push(mk); } else mk.hide();
  });
  if (gdMap && fit) {
    if (!projScope && regionFilter === 'ALL' && !searchQ && !statusFilter) gdMap.setZoomAndCenter(11.2, HK_CENTER);
    else if (visible.length) gdMap.setFitView(visible, false, [70, 70, 230, 80]);
    else gdMap.setZoomAndCenter(11.2, HK_CENTER);
  }
}
document.querySelectorAll('#regionChips .chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('#regionChips .chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  regionFilter = c.dataset.r;
  applyMapFilter();
  saveL1();
});
document.querySelectorAll('#regionChips .chip').forEach(c => c.classList.toggle('on', c.dataset.r === regionFilter));

/* 搜索物業 */
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
  searchQ = searchInput.value.trim();
  applyMapFilter();
});
searchInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const q = searchInput.value.trim();
  const hit = scopeProps().find(p => p.name.includes(q) || p.district.includes(q));
  if (hit) goProperty(hit.id);
});

/* ---------- 自動巡檢輪播（30s，交互暫停） ---------- */
const tourTag = document.getElementById('tourTag');
const tourState = { on: false, i: 0, timer: null, resumeTimer: null, curId: null };
let tourList = [];
function setTourFocus(id) {
  if (tourState.curId && gdMarkers[tourState.curId]) gdMarkers[tourState.curId].setContent(markerHTML(propById(tourState.curId), false));
  tourState.curId = id;
  if (id && gdMarkers[id]) gdMarkers[id].setContent(markerHTML(propById(id), true));
}
function tourStep() {
  if (!tourList.length) return;
  const p = tourList[tourState.i % tourList.length];
  tourState.i++;
  setTourFocus(p.id);
  showHoverCard(p);
  if (tourTag) tourTag.style.display = 'flex';
}
function startTour() {
  stopTour();
  tourState.timer = setInterval(tourStep, 30000);
  tourState.on = true;
  setTimeout(tourStep, 6000);
}
function stopTour() { clearInterval(tourState.timer); tourState.on = false; }
function pauseTour() {
  if (!tourState.on) return;
  stopTour();
  clearTimeout(tourState.resumeTimer);
  tourState.resumeTimer = setTimeout(startTour, 60000); /* 交互後 60s 恢復 */
}
document.getElementById('screen').addEventListener('mouseleave', () => { hoverCard.style.display = 'none'; });

/* ---------- 趨勢 / 告警篩選綁定 ---------- */
document.querySelectorAll('#trendChips .chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('#trendChips .chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  trendRange = c.dataset.t;
  renderTrend();
  saveL1();
});
document.querySelectorAll('#trendChips .chip').forEach(c => c.classList.toggle('on', c.dataset.t === trendRange));

document.querySelectorAll('#alarmChips .chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('#alarmChips .chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  alarmLevel = +c.dataset.l;
  renderAlarms();
  saveL1();
});
document.querySelectorAll('#alarmChips .chip').forEach(c => c.classList.toggle('on', +c.dataset.l === alarmLevel));

/* ---------- 模擬 WebSocket 告警推送（尊重項目範圍） ---------- */
const pushRng = mulberry32(991);
setInterval(() => {
  const p = DB.P[Math.floor(pushRng() * DB.P.length)];
  const t = ALARM_TYPES[Math.floor(pushRng() * ALARM_TYPES.length)];
  const level = pushRng() < .22 ? 1 : pushRng() < .6 ? 2 : 3;
  const a = {
    id: 'AL-' + String(2026100 + Math.floor(pushRng() * 8999)),
    level, levelName: LEVEL_NAME[level], type: t.label, kind: t.kind,
    propertyId: p.id, propertyName: p.name,
    building: p.buildings[Math.floor(pushRng() * p.buildings.length)].n,
    floor: (1 + Math.floor(pushRng() * 30)) + 'F',
    time: Date.now(), status: '未處理'
  };
  liveAlarms.unshift(a);
  liveAlarms = liveAlarms.slice(0, 100);
  /* 更新 KPI 告警數（按當前範圍） */
  const kpiNum = document.querySelectorAll('.kpi .num')[4];
  if (kpiNum) kpiNum.textContent = scopeAlarmList().length;
  const inCurScope = !projScope || inScope(curProject(), a.propertyId);
  if (inCurScope && (!alarmLevel || alarmLevel === a.level)) {
    const scroll = document.getElementById('alarmScroll');
    if (scroll) {
      scroll.insertAdjacentHTML('afterbegin', alarmRowHTML(a, 'new'));
      if (scroll.children.length > 100) scroll.lastElementChild.remove();
      const row = scroll.firstElementChild;
      row.onclick = () => openAlarmModal(a);
    }
  }
}, 15000);

/* ---------- 統一渲染入口 ---------- */
function renderAll() {
  updateHeader();
  renderKPIs();
  renderDonut();
  renderSensors();
  renderTrend();
  renderMaint();
  renderAlarms();
  renderProjects();
  applyMapFilter();
  tourList = [...scopeProps()].sort((a, b) => b.risk - a.risk).slice(0, 8);
}
renderAll();
startTour();
