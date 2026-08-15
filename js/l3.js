/* ============================================================
 * L3 楼宇/楼层级消防设备大屏
 * ============================================================ */

fitScreen();
initTopbar('overview');
const bi = Math.max(0, +('' + (qs('b') ?? 0)) || 0);
const P = propById(qs('p')) || DB.P[0];
const pid = P.id;
const B = P.buildings[bi] || P.buildings[0];
const bStat = P.bStats[bi] || P.bStats[0];
const FLOORS = floorsOf(B);
const AGG = floorAgg(pid, bi);
const bAlarms = DB.alarms.filter(a => a.propertyId === pid && a.building === B.n);
const bScore = Math.max(40, 100 - bAlarms.filter(a => a.level === 1).length * 5 - bStat.offline * 3 - bStat.maint - bAlarms.length * .5);

let curFloor = FLOORS.includes(qs('f')) ? qs('f') : (AGG.find(a => a.abnormal > 0)?.floor || FLOORS[FLOORS.length - 1]);
/* 返回时保留上次查看楼层 */
const l3key = 'l3f.' + pid + ':' + bi;
if (!qs('f')) {
  const sf = sessionStorage.getItem(l3key);
  if (sf && FLOORS.includes(sf)) curFloor = sf;
}
const deviceCache = {};
const devicesOf = f => deviceCache[f] || (deviceCache[f] = floorDevices(pid, bi, f));

/* ---------- 头部 ---------- */
document.getElementById('backBtn').innerHTML = `${icon('back', 15)} ${T('返回物業')}`;
const r1 = qs('r') || '', s2 = qs('s') || '';
document.getElementById('backBtn').onclick = () =>
  location.href = `property.html?p=${pid}` + (r1 ? `&r=${r1}` : '') + (s2 ? '#s=' + s2 : '');
document.getElementById('brandIcon').innerHTML = icon('layers', 19);
document.getElementById('bName').textContent = `${T(B.n)} · ${T('樓層消防點位')}`;
document.getElementById('bMeta').textContent = `${T(P.name)} · ${T('樓宇視圖')}`;
document.getElementById('crumbP').textContent = `/ ${T(P.name)}`;
document.getElementById('crumbNow').textContent = T(B.n);
const TENANTS = ['香港恒益集團', '中原金融控股', '亞太通商律師行', '南華物流集團', '啟德科技有限公司', '寶華保險', '維信會計師事務所'];
document.getElementById('tenant').innerHTML = `${icon('user', 14)} ${curFloor}：${T(TENANTS[Math.abs(curFloor.length * 7 + curFloor.charCodeAt(0)) % TENANTS.length])}`;
document.getElementById('hdScore').innerHTML = CHART.gauge(bScore, { size: 44, width: 5 });
document.getElementById('lgTypes').innerHTML = SENSOR_TYPES.map(s =>
  `<span class="lg2">${icon(({ fire: 'flame', water: 'droplet', hvac: 'fan', pump: 'pump', comm: 'comm' })[s.key], 13)} ${T(s.full)}</span>`).join('');

/* ---------- KPI ---------- */
const kpis = [
  { label: '樓層總數', icon: 'layers', num: FLOORS.length, unit: '層', sub: `B2 ${T('至')} ${B.f}F` },
  { label: '設備總數', icon: 'grid', num: bStat.total, unit: '個', sub: `${T('感測器')} <b>${fmtNum(Math.round(bStat.total * 1.6))}</b> ${T('個')}` },
  { label: '在線設備', icon: 'arrowUp', num: bStat.online, unit: '個', numColor: C.ok, sub: `${T('在線率')} <b class="up">${(bStat.online / bStat.total * 100).toFixed(1)}%</b>` },
  { label: '當前告警', icon: 'warn', num: bAlarms.length, unit: '條', color: 'var(--crit)', sub: `${T('嚴重')} <b class="down">${bAlarms.filter(a => a.level === 1).length}</b> ${T('條')}` },
  { label: '維護中設備', icon: 'tool', num: bStat.maint, unit: '個', color: 'var(--warn)', sub: `${T('高級')} <b class="down">${bStat.crit}</b> · ${T('離線')} <b class="down">${bStat.offline}</b>` },
  { label: '今日維護', icon: 'cal', num: DB.maintenance.filter(m => m.propertyId === pid && m.dayOffset === 0).length, unit: '項', sub: `${T('未來 7 天')} <b>${DB.maintenance.filter(m => m.propertyId === pid).length}</b> ${T('項')}` }
];
document.getElementById('kpis').innerHTML = kpis.map(k => `
  <div class="kpi">
    <span class="k-label">${icon(k.icon, 14)}${T(k.label)}</span>
    <span class="k-val"><span class="num count" data-to="${k.num}"
      style="${k.numColor ? 'color:' + k.numColor : (k.color ? 'color:' + k.color : '')}">0</span><span class="unit">${T(k.unit)}</span></span>
    <span class="k-sub">${k.sub}</span>
  </div>`).join('');
document.querySelectorAll('.kpi .count').forEach(el => countUp(el, +el.dataset.to));

/* ---------- 楼层切换器 ---------- */
const rail = document.getElementById('floorRail');
function renderRail() {
  rail.innerHTML = FLOORS.map(f => {
    const ag = AGG.find(x => x.floor === f);
    return `<button class="f-btn ${f === curFloor ? 'on' : ''}" data-f="${f}">${f}${ag && ag.abnormal ? '<span class="fd"></span>' : ''}</button>`;
  }).join('');
  rail.querySelectorAll('.f-btn').forEach(b => b.onclick = () => selectFloor(b.dataset.f));
  const on = rail.querySelector('.f-btn.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}
/* 滚轮 / 上下键切换楼层 */
rail.addEventListener('wheel', e => {
  e.preventDefault();
  const i = FLOORS.indexOf(curFloor) + (e.deltaY > 0 ? 1 : -1);
  if (i >= 0 && i < FLOORS.length) selectFloor(FLOORS[i]);
}, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const i = FLOORS.indexOf(curFloor) + (e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0);
  if (i > 0 && e.key.startsWith('Arrow')) { e.preventDefault(); selectFloor(FLOORS[i]); }
});

/* ---------- 平面图 ---------- */
const planSvg = document.getElementById('planSvg');
const stage = document.getElementById('planStage');
const W = 1000, H = 560;
let view = { k: 1, tx: 0, ty: 0 };
const ROOMS = [
  { x: 40, y: 40, w: 170, h: 90, t: '機房' }, { x: 230, y: 40, w: 240, h: 90, t: '辦公區 A' },
  { x: 490, y: 40, w: 200, h: 90, t: '辦公區 B' }, { x: 710, y: 40, w: 250, h: 90, t: '辦公區 C' },
  { x: 770, y: 150, w: 190, h: 100, t: '會議室 I' }, { x: 770, y: 270, w: 190, h: 100, t: '會議室 II' },
  { x: 770, y: 390, w: 190, h: 70, t: '茶水間' }, { x: 710, y: 470, w: 250, h: 50, t: '培訓室' },
  { x: 430, y: 470, w: 260, h: 50, t: '開放辦公區' }, { x: 40, y: 430, w: 140, h: 90, t: '樓梯間' },
  { x: 40, y: 150, w: 140, h: 100, t: '設備間' }
];
function devIconSvg(kindKey, col) {
  const d = (DEVICE_KINDS.find(k => k.key === kindKey) || {}).icon || 'flame';
  return `<g transform="translate(-7,-7) scale(.62)">${ICON_PATHS[d].replaceAll('<path', `<path fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`).replaceAll('<circle', `<circle fill="none" stroke="${col}" stroke-width="2.6"`)}</g>`;
}
function renderPlan() {
  const devs = devicesOf(curFloor);
  const dots = devs.map((d, i) => {
    const x = 30 + d.x / 100 * (W - 60), y = 30 + d.y / 100 * (H - 60);
    const col = statusColor(d.status);
    return `<g class="dev ${d.status}" data-i="${i}" transform="translate(${x},${y})" style="color:${col}">
      <circle class="hit" r="16"/>
      <circle class="halo" r="15" fill="none" stroke="${col}" stroke-width="1.3" stroke-dasharray="3 3" opacity="0"/>
      <circle r="10.5" fill="${col}" fill-opacity=".16" stroke="${col}" stroke-width="1.4"/>
      ${devIconSvg(d.kind.key, col)}
    </g>`;
  }).join('');
  planSvg.innerHTML = `
    <defs><clipPath id="planClip"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="10"/></clipPath></defs>
    <g id="vp">
      <g clip-path="url(#planClip)">
        <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="8" fill="rgba(15,25,48,.4)" stroke="rgba(99,140,210,.35)" stroke-width="1.6"/>
        <rect x="400" y="190" width="220" height="180" rx="8" class="core"/>
        <text x="510" y="272" class="room-label" text-anchor="middle">${T('核心筒')}</text>
        <text x="510" y="292" class="room-label" text-anchor="middle">${T('電梯廳 · 消防前室')}</text>
        ${ROOMS.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="7" class="room"/>
          <text x="${r.x + 12}" y="${r.y + 20}" class="room-label">${T(r.t)}</text>`).join('')}
        ${dots}
      </g>
    </g>`;
  const vp = planSvg.querySelector('#vp');
  applyView();
  planSvg.querySelectorAll('.dev').forEach(g => {
    const d = devs[+g.dataset.i];
    g.addEventListener('mouseenter', e => {
      const sc = screenXY(e);
      const fa = floorAlarms().find(a => a.kind === d.kind.key);
      Tip.show(`<b style="font-size:13px">${d.name}</b>
        <div class="t-row"><span>${T(d.kind.label)} · ${T(d.loc)}</span></div>
        <div class="t-row"><span>${T('狀態')}</span><b style="color:${statusColor(d.status)}">${T(STATUS_NAME[d.status])}</b></div>
        ${fa ? `<div class="t-row"><span>${T('最近告警')}</span><b style="color:${LEVEL_COLOR[fa.level]}">${ago(fa.time)}</b></div>` : ''}`, sc.x, sc.y);
    });
    g.addEventListener('mouseleave', () => Tip.hide());
    g.addEventListener('click', () => selectDevice(d));
  });
}
function applyView() {
  const vp = planSvg.querySelector('#vp');
  if (vp) vp.setAttribute('transform', `translate(${view.tx},${view.ty}) scale(${view.k})`);
}
/* 缩放/平移 */
function zoomAt(factor, cx = W / 2, cy = H / 2) {
  const k = Math.min(3, Math.max(.55, view.k * factor));
  const r = stage.getBoundingClientRect();
  const sx = (cx / r.width) * W, sy = (cy / r.height) * H;
  view.tx = sx - (sx - view.tx) * (k / view.k);
  view.ty = sy - (sy - view.ty) * (k / view.k);
  view.k = k; applyView();
}
stage.addEventListener('wheel', e => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  zoomAt(e.deltaY < 0 ? 1.12 : .9, e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
document.getElementById('zin').onclick = () => zoomAt(1.25);
document.getElementById('zout').onclick = () => zoomAt(.8);
document.getElementById('zreset').onclick = () => { view = { k: 1, tx: 0, ty: 0 }; applyView(); };
let drag = null;
planSvg.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty }; planSvg.classList.add('grabbing'); });
addEventListener('mousemove', e => {
  if (!drag) return;
  const r = planSvg.getBoundingClientRect();
  const s = r.width / W;
  view.tx = drag.tx + (e.clientX - drag.x) / s;
  view.ty = drag.ty + (e.clientY - drag.y) / s;
  applyView();
});
addEventListener('mouseup', () => { drag = null; planSvg.classList.remove('grabbing'); });

/* ---------- 左栏：当前楼层统计 ---------- */
function renderFloorStats() {
  const ag = AGG.find(x => x.floor === curFloor);
  const devs = devicesOf(curFloor);
  const cnt = { online: 0, crit: 0, maint: 0, offline: 0 };
  devs.forEach(d => cnt[d.status]++);
  document.getElementById('floorTag2').textContent = `${curFloor} ${T('層')}`;
  document.getElementById('devDonut').innerHTML = `
    ${CHART.donut([
      { label: '在線', value: cnt.online, color: C.ok }, { label: '高級', value: cnt.crit, color: C.crit },
      { label: '維護', value: cnt.maint, color: C.warn }, { label: '離線', value: cnt.offline, color: C.idle }
    ], { size: 168, width: 13, center: String(ag.total), sub: T('當前樓層') })}
    <div class="legend">${[['在線', cnt.online, C.ok], ['高級', cnt.crit, C.crit], ['維護', cnt.maint, C.warn], ['離線', cnt.offline, C.idle]].map(([n, v, c]) => `
      <div class="lg-item"><span class="lg-dot" style="background:${c}"></span>
        <span class="lg-name">${T(n)}</span><span class="lg-val">${v}</span>
        <span class="lg-pct">${(v / ag.total * 100).toFixed(0)}%</span></div>`).join('')}
    </div>`;
  /* 感測器類型統計 */
  const rows = SENSOR_TYPES.map(s => {
    const ds = devs.filter(d => d.sensors.includes(s.key));
    const abn = ds.filter(d => d.status !== 'online' && d.status !== 'maint').length;
    return { label: `${icon(({ fire: 'flame', water: 'droplet', hvac: 'fan', pump: 'pump', comm: 'comm' })[s.key], 14)} ${T(s.full)}`, total: ds.length, normal: ds.length - abn, abnormal: abn };
  }).filter(r => r.total > 0);
  document.getElementById('sensorPanel').innerHTML = rows.length
    ? CHART.stackedBars(rows) : EMPTY('當前樓層暫無感測器');
}

/* ---------- 右上：当前楼层告警 ---------- */
function floorAlarms() { return bAlarms.filter(a => a.floor === curFloor); }
function renderFloorAlarms() {
  const list = floorAlarms();
  document.getElementById('alarmPanel').innerHTML = list.length
    ? `<div class="list"><div class="list-scroll">${list.map(a => `
      <div class="alarm-row" data-kind="${a.kind}" data-id="${a.id}">
        <span class="a-dot l${a.level}" style="background:${LEVEL_COLOR[a.level]}"></span>
        <div class="a-main">
          <div class="a-type">${T(a.type)}<em>${T(a.levelName)}</em></div>
          <div class="a-loc">${curFloor} · ${T((DEVICE_KINDS.find(k => k.key === a.kind) || {}).label)} · ${ago(a.time)}</div>
        </div>
        <span class="a-time">${fmtHM(a.time)}</span>
        <span class="a-st ${a.status === '未處理' ? 'open' : 'doing'}">${T(a.status)}</span>
      </div>`).join('')}</div></div>`
    : EMPTY('當前樓層無未關閉告警');
  document.querySelectorAll('#alarmPanel .alarm-row').forEach(row => {
    row.onclick = () => openAlarmModal(DB.alarms.find(a => a.id === row.dataset.id));
    row.onmouseenter = () => {
      const dev = devicesOf(curFloor).find(d => d.kind.key === row.dataset.kind);
      if (dev) highlightDevice(dev, false);
    };
    row.onmouseleave = () => clearHighlight();
  });
}

/* ---------- 右下：设备详情 ---------- */
let selected = null;
function clearHighlight() {
  planSvg.querySelectorAll('.dev.hl').forEach(g => g.classList.remove('hl'));
}
function highlightDevice(d, center = true) {
  clearHighlight();
  const devs = devicesOf(curFloor);
  const i = devs.indexOf(d);
  const g = planSvg.querySelector(`.dev[data-i="${i}"]`);
  if (!g) return;
  g.classList.add('hl');
  if (center) {
    const x = 30 + d.x / 100 * (W - 60), y = 30 + d.y / 100 * (H - 60);
    view.k = 1.6;
    view.tx = W / 2 - x * view.k;
    view.ty = H / 2 - y * view.k;
    applyView();
  }
}
function selectDevice(d, center = true) {
  selected = d;
  highlightDevice(d, center);
  const col = statusColor(d.status);
  const fa = floorAlarms();
  const devAlarm = fa.find(a => a.kind === d.kind.key);
  const maint = DB.maintenance.filter(m => m.propertyId === pid).slice(0, 2);
  document.getElementById('devSub').textContent = T(d.loc);
  document.getElementById('devPanel').innerHTML = `
    <div class="dev-detail">
      <div class="dd-head">
        <span class="dd-icon" style="color:${col};border-color:${col}55">${icon(d.kind.icon, 20)}</span>
        <div><h4>${d.name}</h4><div class="dd-id">${d.id} · ${T('安裝於')} ${d.install}</div></div>
        <span class="dd-st" style="color:${col};background:${col}1f">${T(STATUS_NAME[d.status])}</span>
      </div>
      <div class="dd-sec">
        <h5>${T('基礎信息')}</h5>
        <dl class="dd-kv">
          <div><dt>${T('設備類型')}</dt><dd>${T(d.kind.label)}</dd></div>
          <div><dt>${T('安裝位置')}</dt><dd style="font-family:inherit">${curFloor} · ${T(d.loc)}</dd></div>
          <div><dt>${T('所屬感測器')}</dt><dd style="font-family:inherit">${d.sensors.map(s => T(SENSOR_TYPES.find(t => t.key === s).full)).join(' / ')}</dd></div>
          <div><dt>${T('供應商')}</dt><dd style="font-family:inherit">${T(d.supplier)}</dd></div>
          <div><dt>${T('最近巡檢')}</dt><dd>${d.lastCheck}</dd></div>
          <div><dt>${T('下次校準')}</dt><dd>2026-Q4</dd></div>
        </dl>
      </div>
      ${devAlarm ? `
      <div class="dd-sec dd-alarms">
        <h5>${T('最近告警')}</h5>
        <div class="alarm-row" style="cursor:default">
          <span class="a-dot l${devAlarm.level}" style="background:${LEVEL_COLOR[devAlarm.level]}"></span>
          <div class="a-main"><div class="a-type">${T(devAlarm.type)}<em>${T(devAlarm.levelName)}</em></div>
            <div class="a-loc">${fmtMD(devAlarm.time)} ${fmtHM(devAlarm.time)} · ${T(devAlarm.status)}</div></div>
        </div>
      </div>` : ''}
      <div class="dd-sec dd-maint">
        <h5>${T('維護計劃')}</h5>
        ${maint.map(m => `<div class="maint-row">
          <div class="m-date"><b>${m.dayOffset === 0 ? T('今日') : m.date}</b><span>${m.time}</span></div>
          <div class="m-main"><div class="t">${tDev(m.device)} · ${T(m.type)}</div><div class="s">${m.assignee}</div></div>
        </div>`).join('')}
      </div>
      <div class="dd-act">
        ${devAlarm ? `<button class="btn primary" id="btnHandle">${icon('doc', 14)} ${T('處理建議')}</button>` : ''}
        <button class="btn ghost" id="btnBackL2">${T('返回物業視圖')}</button>
      </div>
    </div>`;
  document.getElementById('btnBackL2').onclick = () =>
    location.href = `property.html?p=${pid}` + (r1 ? `&r=${r1}` : '') + (s2 ? '#s=' + s2 : '');
  const bh = document.getElementById('btnHandle');
  if (bh) bh.onclick = () => openAlarmModal(devAlarm);
}

/* ---------- 底部楼层对比 ---------- */
function renderFloorBars() {
  const dense = FLOORS.length > 40;
  const xn = dense ? 12 : 24;
  document.getElementById('barOnline').innerHTML = CHART.vbars(
    AGG.map(a => ({ label: a.floor, value: a.rate, color: a.rate < 90 ? C.crit : scoreColor(a.rate), text: dense ? '' : a.rate + '' })),
    { h: 180, xn });
  document.getElementById('barAlarm').innerHTML = CHART.vbars(
    AGG.map(a => ({ label: a.floor, value: a.abnormal, color: a.abnormal ? C.crit : 'rgba(158,158,158,.35)', text: dense || !a.abnormal ? '' : a.abnormal + '' })),
    { h: 180, xn, int: true });
  [['#barOnline', a => `${T('在線率')} ${a.rate}%（${a.online}/${a.total}）`],
   ['#barAlarm', a => `${T('告警')} ${a.abnormal} ${T('條')} · ${T('設備')} ${a.total} ${T('個')}`]].forEach(([sel, tip]) => {
    document.querySelectorAll(sel + ' .vb-bar').forEach(g => {
      const a = AGG[+g.dataset.i];
      g.addEventListener('click', () => selectFloor(a.floor));
      g.addEventListener('mousemove', e => {
        const sc = screenXY(e);
        Tip.show(`<b style="font-family:var(--num-font)">${a.floor}</b><div class="t-row"><span>${tip(a)}</span></div>`, sc.x, sc.y);
      });
      g.addEventListener('mouseleave', () => Tip.hide());
    });
  });
}

/* ---------- 楼层切换 ---------- */
function selectFloor(f) {
  curFloor = f;
  view = { k: 1, tx: 0, ty: 0 };
  sessionStorage.setItem(l3key, f);
  document.getElementById('floorTag').innerHTML = `<small>${T('當前樓層 FLOOR')}</small>${f}`;
  document.getElementById('tenant').innerHTML = `${icon('user', 14)} ${f}：${T(TENANTS[Math.abs(f.length * 7 + f.charCodeAt(0)) % TENANTS.length])}`;
  renderRail(); renderPlan(); renderFloorStats(); renderFloorAlarms();
  /* 自动选中首个告警/异常设备，避免详情面板留白 */
  const kinds = new Set(floorAlarms().map(a => a.kind));
  const devs = devicesOf(f);
  const pick = devs.find(d => kinds.has(d.kind.key) && d.status !== 'online')
            || devs.find(d => kinds.has(d.kind.key))
            || devs.find(d => d.status === 'crit' || d.status === 'offline')
            || devs[0];
  if (pick) selectDevice(pick, false);
  pauseTourL3();
}

/* ---------- L3 轮播：切换有告警的楼层 ---------- */
let l3Tour = null, l3Idx = 0, l3Resume = null;
const alarmFloors = AGG.filter(a => a.abnormal > 0).map(a => a.floor);
function startTourL3() {
  stopTourL3();
  if (alarmFloors.length < 2) return;
  l3Tour = setInterval(() => {
    if (document.querySelector('.plan-stage:hover')) return;
    selectFloor(alarmFloors[l3Idx++ % alarmFloors.length]);
  }, 30000);
}
function stopTourL3() { clearInterval(l3Tour); }
function pauseTourL3() {
  stopTourL3();
  clearTimeout(l3Resume);
  l3Resume = setTimeout(startTourL3, 60000);
}
selectFloor(curFloor);
startTourL3();
