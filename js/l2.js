/* ============================================================
 * L2 物業級消防設備大屏
 * ============================================================ */

fitScreen();
initTopbar('overview');
const P = propById(qs('p')) || DB.P[0];
const pid = P.id;

/* ---------- 头部 ---------- */
document.getElementById('backBtn').innerHTML = `${icon('back', 15)} ${T('返回總覽')}`;
const r1 = qs('r') || '';
document.getElementById('backBtn').onclick = () =>
  location.href = 'index.html' + (r1 ? '#s=' + r1 : '');
document.getElementById('brandIcon').innerHTML = icon('build', 19);
document.getElementById('pName').textContent = `${T(P.name)} · ${T('消防設備大屏')}`;
document.getElementById('pMeta').textContent = `${P.en || ''} FIRE SAFETY DASHBOARD`.trim();
document.getElementById('crumbNow').textContent = T(P.name);
document.getElementById('pContact').innerHTML =
  `${icon('pin', 14)} ${T(P.district)} ${P.addr} &nbsp;${icon('user', 14)} ${P.manager} &nbsp;${icon('phone', 13)} ${P.phone}`;
document.getElementById('hdScore').innerHTML = CHART.gauge(P.score, { size: 44, width: 5 });

/* ---------- KPI ---------- */
const kpis = [
  { label: '樓宇數量', icon: 'build', num: P.buildings.length, unit: '棟', sub: `${T('共')} <b>${P.buildings.reduce((s, b) => s + b.f, 0)}</b> ${T('層')}` },
  { label: '設備總數', icon: 'layers', num: P.total, unit: '個', sub: `${T('感測器')} <b>${fmtNum(P.sensors.reduce((s, x) => s + x.total, 0))}</b> ${T('個')}` },
  { label: '設備在線率', icon: 'arrowUp', num: P.onlineRate, unit: '%', numColor: scoreColor(P.onlineRate), dec: 1, sub: `${T('離線')} <b class="down">${P.offline}</b> · ${T('維護')} <b class="down">${P.maint}</b>` },
  { label: '當前告警', icon: 'warn', num: P.alarmCount, unit: '條', color: 'var(--crit)', sub: `${T('嚴重')} <b class="down">${P.critAlarms}</b> ${T('條')}`, clickable: true, id: 'kpiAlarm' },
  { label: '維護中設備', icon: 'tool', num: P.maint, unit: '個', color: 'var(--warn)', sub: `${T('今日計劃')} <b>${DB.maintenance.filter(m => m.propertyId === pid && m.dayOffset === 0).length}</b> ${T('項')}` },
  { label: '感測器正常率', icon: 'shield', num: P.sensorRate, unit: '%', dec: 2, numColor: scoreColor(P.sensorRate), sub: `${T('異常')} <b class="down">${P.sensorAbn}</b> ${T('個')}` }
];
document.getElementById('kpis').innerHTML = kpis.map(k => `
  <div class="kpi ${k.clickable ? 'clickable' : ''}" ${k.id ? `id="${k.id}"` : ''}>
    <span class="k-label">${icon(k.icon, 14)}${T(k.label)}</span>
    <span class="k-val"><span class="num count" data-to="${k.num}" data-dec="${k.dec || 0}"
      style="${k.numColor ? 'color:' + k.numColor : (k.color ? 'color:' + k.color : '')}">0</span><span class="unit">${T(k.unit)}</span></span>
    <span class="k-sub">${k.sub}</span>
  </div>`).join('');
document.querySelectorAll('.kpi .count').forEach(el => countUp(el, +el.dataset.to, { dec: +el.dataset.dec }));

/* ---------- 左：设备状态环形 + 感测器 ---------- */
const donutData = [
  { label: '在線', value: P.online, color: C.ok },
  { label: '高級', value: P.crit, color: C.crit },
  { label: '維護', value: P.maint, color: C.warn },
  { label: '離線', value: P.offline, color: C.idle }
];
document.getElementById('devDonut').innerHTML = `
  ${CHART.donut(donutData, { size: 168, width: 13, center: fmtNum(P.total), sub: T('設備總數') })}
  <div class="legend">${donutData.map(d => `
    <div class="lg-item"><span class="lg-dot" style="background:${d.color}"></span>
      <span class="lg-name">${T(d.label)}</span><span class="lg-val">${fmtNum(d.value)}</span>
      <span class="lg-pct">${(d.value / P.total * 100).toFixed(1)}%</span></div>`).join('')}
  </div>`;
document.getElementById('sensorSub').textContent = `${T('正常率')} ${P.sensorRate}%`;
document.getElementById('sensorPanel').innerHTML = CHART.stackedBars(
  P.sensors.map(s => ({ label: `${icon(({ fire: 'flame', water: 'droplet', hvac: 'fan', pump: 'pump', comm: 'comm' })[s.key], 14)} ${T(s.full)}`, total: s.total, normal: s.normal, abnormal: s.abnormal })));

/* ---------- 中央楼宇卡片 ---------- */
const bAlarms = bi => DB.alarms.filter(a => a.propertyId === pid && a.building === P.buildings[bi].n);
const cardData = P.bStats.map((st, bi) => {
  const alarms = bAlarms(bi);
  const rate = +(st.online / st.total * 100).toFixed(1);
  const status = alarms.some(a => a.level === 1) || st.crit > 0 ? 'crit' : alarms.length ? 'warn' : st.offline > st.total * .02 ? 'idle' : 'ok';
  return { bi, st, alarms, rate, status, score: Math.max(40, 100 - alarms.filter(a => a.level === 1).length * 6 - st.offline * 2 - st.maint - alarms.length) };
}).sort((a, b) => (a.score - b.score) || (b.alarms.length - a.alarms.length)); /* 风险优先 */

const stCol = { crit: C.crit, warn: C.warn, idle: C.idle, ok: C.ok };
const stName = { crit: '嚴重告警', warn: '有告警', idle: '部分離線', ok: '運行正常' };
/* 恢复上次筛选（hash 优先，storage 兜底；PRD：返回上级保留筛选条件） */
const l2key = 'l2f.' + pid;
const hashState2 = (location.hash.match(/s=([^&]+)/) || [])[1];
const savedL2 = hashState2 ? JSON.parse(decodeURIComponent(hashState2)) : JSON.parse(sessionStorage.getItem(l2key) || '{}');
const saveL2 = () => sessionStorage.setItem(l2key, JSON.stringify({ bFilter, alarmBuilding }));
/* 统一下钻入口：携带 L1/L2 筛选状态 */
const goBuilding = bi => {
  const s2 = encodeURIComponent(JSON.stringify({ bFilter, alarmBuilding }));
  location.href = `building.html?p=${pid}&b=${bi}&r=${r1}&s=${s2}`;
};
let bFilter = savedL2.bFilter || 'all';
function renderCards() {
  const q = (document.getElementById('searchInput').value || '').trim();
  const list = cardData.filter(c => {
    if (q && !P.buildings[c.bi].n.includes(q) && !T(P.buildings[c.bi].n).toLowerCase().includes(q.toLowerCase())) return false;
    if (bFilter === 'all') return true;
    if (bFilter === 'alarm') return c.alarms.length > 0 || c.st.crit > 0;
    if (bFilter === 'maint') return c.st.maint > 0;
    if (bFilter === 'offline') return c.st.offline > 0;
    if (bFilter === 'ok') return c.alarms.length === 0 && c.st.crit === 0;
  });
  document.getElementById('bCount').textContent = `${T('顯示')} ${list.length} / ${P.buildings.length} ${T('棟')} · ${T('按風險排序')}`;
  document.getElementById('bGrid').innerHTML = list.map(c => `
    <div class="b-card" role="button" tabindex="0" data-bi="${c.bi}">
      <div class="b-top">
        <span class="b-st ${c.status === 'crit' ? 'crit' : ''}" style="background:${stCol[c.status]}" title="${T(stName[c.status])}"></span>
        <span class="b-name">${T(P.buildings[c.bi].n)}</span>
        ${c.alarms.length ? `<span class="b-alarms">${c.alarms.length} ${T('告警')}</span>` : `<span class="b-alarms zero">${T('無告警')}</span>`}
        <span class="b-chev">${icon('chev', 14)}</span>
      </div>
      <div class="b-rate">
        <span class="num" style="color:${scoreColor(c.rate)}">${c.rate}%</span>
        <span class="bar"><i style="width:${c.rate}%;background:${scoreColor(c.rate)}"></i></span>
      </div>
      <div class="b-meta">
        <span>${T('設備')} <b>${fmtNum(c.st.total)}</b></span>
        <span>${T('樓層')} <b>${P.buildings[c.bi].f}F</b></span>
        <span>${T('維護')} <b>${c.st.maint}</b></span>
        <span>${T('評分')} <b style="color:${scoreColor(c.score)}">${c.score}</b></span>
      </div>
    </div>`).join('') || EMPTY('沒有符合條件的樓宇');
  document.querySelectorAll('.b-card').forEach(card => {
    card.onclick = () => goBuilding(card.dataset.bi);
    card.onkeydown = e => { if (e.key === 'Enter') goBuilding(card.dataset.bi); };
  });
}
document.getElementById('searchIcon').innerHTML = icon('search', 14);
document.getElementById('searchInput').addEventListener('input', renderCards);
document.querySelectorAll('#bChips .chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('#bChips .chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on'); bFilter = c.dataset.f; renderCards(); saveL2();
});
document.querySelectorAll('#bChips .chip').forEach(c => c.classList.toggle('on', c.dataset.f === bFilter));
renderCards();

/* ---------- 右：告警清单（按楼宇筛选）+ 维护 ---------- */
const filterBox = document.getElementById('bFilter');
P.buildings.forEach((b, i) => {
  const btn = document.createElement('button');
  btn.className = 'chip'; btn.dataset.b = i; btn.textContent = T(b.n);
  filterBox.appendChild(btn);
});
let alarmBuilding = savedL2.alarmBuilding || '';
function renderAlarms() {
  const bName = alarmBuilding === '' ? '' : P.buildings[+alarmBuilding].n;
  const list = DB.alarms.filter(a => a.propertyId === pid && (!bName || a.building === bName)).slice(0, 60);
  document.getElementById('alarmPanel').innerHTML = list.length
    ? `<div class="list"><div class="list-scroll" id="alarmScroll">${list.map(a => `
      <div class="alarm-row" data-id="${a.id}">
        <span class="a-dot l${a.level}" style="background:${LEVEL_COLOR[a.level]}"></span>
        <div class="a-main">
          <div class="a-type">${T(a.type)}<em>${T(a.levelName)}</em></div>
          <div class="a-loc">${T(a.building)} · ${a.floor} · ${ago(a.time)}</div>
        </div>
        <span class="a-time">${fmtHM(a.time)}</span>
        <span class="a-st ${a.status === '未處理' ? 'open' : 'doing'}">${T(a.status)}</span>
      </div>`).join('')}</div></div>`
    : EMPTY('該樓宇暫無未關閉告警');
  document.querySelectorAll('#alarmPanel .alarm-row').forEach(row =>
    row.onclick = () => openAlarmModal(DB.alarms.find(a => a.id === row.dataset.id)));
  autoScroll(document.getElementById('alarmScroll'));
}
filterBox.addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  filterBox.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on'); alarmBuilding = c.dataset.b; renderAlarms(); saveL2();
});
filterBox.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.b === alarmBuilding));
renderAlarms();
/* KPI 告警卡片点击 → 筛选告警面板 */
document.getElementById('kpiAlarm')?.addEventListener('click', () => {
  document.querySelector('#alarmPanel').scrollIntoView?.();
  filterBox.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', !x.dataset.b));
  alarmBuilding = ''; renderAlarms();
});

const pMaint = DB.maintenance.filter(m => m.propertyId === pid);
document.getElementById('maintPanel').innerHTML = pMaint.length
  ? `<div class="list"><div class="list-scroll" id="maintScroll">${pMaint.map(m => `
    <div class="maint-row ${m.done ? 'done' : ''}">
      <div class="m-date"><b>${m.dayOffset === 0 ? T('今日') : m.dayOffset === 1 ? T('明日') : m.date}</b><span>${m.time}</span></div>
      <div class="m-main"><div class="t">${tDev(m.device)} · ${T(m.type)}</div><div class="s">${T(m.building)} · ${m.assignee}</div></div>
    </div>`).join('')}</div></div>`
  : EMPTY('未來 7 天暫無維護計劃');
autoScroll(document.getElementById('maintScroll'));

/* ---------- 底部楼宇对比 ---------- */
const names = P.buildings.map(b => T(b.n));
document.getElementById('barOnline').innerHTML = CHART.hbars(
  P.bStats.map((s, i) => {
    const rate = +(s.online / s.total * 100).toFixed(1);
    return { label: names[i], value: rate, color: rate < 90 ? C.crit : scoreColor(rate), valueText: rate + '%' };
  }), { clickable: true });
document.getElementById('barAlarm').innerHTML = CHART.hbars(
  P.bStats.map((s, i) => {
    const n = bAlarms(i).length;
    return { label: names[i], value: n, color: n > 3 ? C.crit : n ? C.warn : 'rgba(158,158,158,.5)', valueText: n + (LANG === 'en' ? '' : ' 條') };
  }), { clickable: true });
document.querySelectorAll('#barOnline .hb-row').forEach(r =>
  r.addEventListener('click', () => goBuilding(r.dataset.idx)));
document.querySelectorAll('#barAlarm .hb-row').forEach(r =>
  r.addEventListener('click', () => goBuilding(r.dataset.idx)));

/* ---------- L2 轮播：高亮风险楼宇 ---------- */
let tourIdx = 0;
setInterval(() => {
  const cards = document.querySelectorAll('.b-card');
  if (!cards.length || document.querySelector('.b-grid:hover')) return;
  cards.forEach(c => c.style.outline = '');
  const target = cards[tourIdx % cards.length];
  if (target) {
    target.style.outline = '1.5px solid rgba(25,211,255,.6)';
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  tourIdx++;
}, 30000);
