/* ============================================================
 * 极简 SVG 图表库（环形 / 横条 / 折线 / 柱状 / 仪表 / 迷你环）
 * 所有图表返回 SVG 字符串，由调用方插入容器
 * ============================================================ */

const CHART = (() => {

  function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function arcPath(cx, cy, r, w, a0, a1) {
    const r0 = r - w / 2, r1 = r + w / 2, large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = polar(cx, cy, r1, a0), [x1, y1] = polar(cx, cy, r1, a1);
    const [x2, y2] = polar(cx, cy, r0, a1), [x3, y3] = polar(cx, cy, r0, a0);
    return `M${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`;
  }
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x},${c1y},${c2x},${c2y},${p2[0]},${p2[1]}`;
    }
    return d;
  }

  /* 实心饼图：data=[{value,color}]，扇区带占比标签 */
  function pie(data, opts = {}) {
    const size = opts.size || 190, cx = size / 2, cy = size / 2, r = size * .42;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let a = 0, segs = '';
    data.forEach(d => {
      if (d.value <= 0) return;
      const sweep = d.value / total * 360;
      const [x0, y0] = polar(cx, cy, r, a), [x1, y1] = polar(cx, cy, r, a + sweep);
      const large = sweep > 180 ? 1 : 0;
      segs += `<path d="M${cx},${cy}L${x0},${y0}A${r},${r} 0 ${large} 1 ${x1},${y1}Z" fill="${d.color}" opacity=".92"/>`;
      if (sweep >= 14) {
        const [lx, ly] = polar(cx, cy, r * .58, a + sweep / 2);
        segs += `<text x="${lx}" y="${ly + 3.5}" class="c-pct" text-anchor="middle">${(d.value / total * 100).toFixed(1)}%</text>`;
      }
      a += sweep;
    });
    return `<svg viewBox="0 0 ${size} ${size}" class="ch-donut">${segs}</svg>`;
  }

  /* 环形图：data=[{value,color,label}]，中心文本 */
  function donut(data, opts = {}) {
    const size = opts.size || 190, cx = size / 2, cy = size / 2, r = size * .4, w = opts.width || 14;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const gap = data.filter(d => d.value > 0).length > 1 ? 2.2 : 0;
    let a = 0, segs = '';
    data.forEach(d => {
      if (d.value <= 0) return;
      const sweep = d.value / total * 360;
      segs += `<path d="${arcPath(cx, cy, r, w, a + gap / 2, a + sweep - gap / 2)}" fill="${d.color}" opacity=".92"/>`;
      a += sweep;
    });
    const sub = opts.sub ? `<text x="${cx}" y="${cy + 16}" class="c-sub">${opts.sub}</text>` : '';
    return `<svg viewBox="0 0 ${size} ${size}" class="ch-donut">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(96,137,205,.12)" stroke-width="${w}"/>
      ${segs}
      <text x="${cx}" y="${cy + 2}" class="c-num" style="fill:${opts.numColor || '#E8EFFA'}">${opts.center ?? fmtNum(total)}</text>
      ${sub}</svg>`;
  }

  /* 横向条形列表：items=[{label,value,color,valueText,extra}] */
  function hbars(items, opts = {}) {
    const max = Math.max(...items.map(i => i.value), 1);
    const rows = items.map((it, idx) => {
      const tag = opts.clickable ? 'button' : 'div';
      return `<${tag} class="hb-row${it.active ? ' active' : ''}${opts.clickable ? ' hb-btn' : ''}" data-idx="${idx}" type="${opts.clickable ? 'button' : ''}">
        <span class="hb-label">${it.label}</span>
        <span class="hb-track"><span class="hb-fill" style="width:${(it.value / max * 100).toFixed(1)}%;background:${it.color}"></span></span>
        <span class="hb-val" style="${it.valColor ? 'color:' + it.valColor : ''}">${it.valueText ?? fmtNum(it.value)}</span>
      </${tag}>`;
    }).join('');
    return `<div class="hb-list" data-type="${opts.type || ''}">${rows}</div>`;
  }

  /* 堆叠双段横条（正常/异常） */
  function stackedBars(items, opts = {}) {
    const max = Math.max(...items.map(i => i.total), 1);
    const rows = items.map((it, idx) => `
      <div class="hb-row${opts.clickable ? ' hb-click' : ''}" data-idx="${idx}">
        <span class="sb-label">${it.label}</span>
        <span class="hb-track">
          <span class="hb-fill" style="width:${(it.normal / max * 100).toFixed(1)}%;background:${C.ok}"></span>
          <span class="hb-fill" style="width:${(it.abnormal / max * 100).toFixed(1)}%;background:${C.crit}"></span>
        </span>
        <span class="hb-val">${it.abnormal > 0 ? `<b style="color:${C.crit}">${it.abnormal}</b>` : '<b style="color:' + C.ok + '">0</b>'}<i>/${it.total}</i></span>
      </div>`).join('');
    return `<div class="hb-list">${rows}</div>`;
  }

  /* 折线面积图：pts=[{label,v}]，带 hover 十字线 */
  function line(pts, opts = {}) {
    const W = 1000, H = opts.h || 260, padL = 44, padR = 14, padT = 18, padB = 30;
    const vs = pts.map(p => p.v);
    let min = Math.min(...vs), max = Math.max(...vs);
    const span = Math.max(4, max - min); min -= span * .18; max += span * .18;
    const X = i => padL + i * (W - padL - padR) / (pts.length - 1);
    const Y = v => padT + (max - v) / (max - min) * (H - padT - padB);
    const coords = pts.map((p, i) => [X(i), Y(p.v)]);
    const area = smoothPath(coords) + `L${X(pts.length - 1)},${H - padB}L${padL},${H - padB}Z`;
    const ticks = 3, grid = [];
    for (let i = 0; i <= ticks; i++) {
      const v = min + (max - min) * i / ticks, y = Y(v);
      grid.push(`<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(96,137,205,.1)"/>
        <text x="${padL - 8}" y="${y + 4}" class="ch-tick" text-anchor="end">${v.toFixed(0)}</text>`);
    }
    const step = Math.ceil(pts.length / (opts.xn || 8));
    const xlabels = pts.map((p, i) => i % step === 0 ? `<text x="${X(i)}" y="${H - 8}" class="ch-tick" text-anchor="middle">${p.label}</text>` : '').join('');
    const uid = 'lg' + Math.floor(Math.random() * 1e5);
    const dots = coords.map((c, i) => `<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="transparent" data-i="${i}" class="ln-hit"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="ch-line" preserveAspectRatio="none" style="height:100%">
      <defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${opts.color || C.accent}" stop-opacity=".28"/>
        <stop offset="1" stop-color="${opts.color || C.accent}" stop-opacity="0"/></linearGradient></defs>
      ${grid.join('')}
      <path d="${area}" fill="url(#${uid})"/>
      <path d="${smoothPath(coords)}" fill="none" stroke="${opts.color || C.accent}" stroke-width="2.2" stroke-linecap="round"/>
      <g class="ln-cursor" style="display:none">
        <line y1="${padT}" y2="${H - padB}" stroke="rgba(139,167,205,.45)" stroke-dasharray="3 4"/>
        <circle r="4" fill="${opts.color || C.accent}" stroke="#060B16" stroke-width="2"/>
      </g>
      ${dots}${xlabels}</svg>`;
  }

  /* 竖向柱状图：items=[{label,value,color,text}] */
  function vbars(items, opts = {}) {
    const W = 1000, H = opts.h || 220, padL = 40, padR = 10, padT = 16, padB = 34;
    const max = Math.max(...items.map(i => i.value), 1);
    const n = items.length || 1;
    const bw = Math.min(34, (W - padL - padR) / n * .55);
    const X = i => padL + (i + .5) * (W - padL - padR) / n;
    const Y = v => padT + (1 - v / max) * (H - padT - padB);
    let bars = '';
    items.forEach((it, i) => {
      const x = X(i) - bw / 2, y = Y(it.value), h = H - padB - y;
      bars += `<g class="vb-bar" data-i="${i}">
        <rect x="${x}" y="${padT}" width="${bw}" height="${H - padT - padB}" fill="rgba(96,137,205,.07)" rx="3"/>
        <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 2)}" fill="${it.color}" rx="3" opacity=".9"/>
        <text x="${X(i)}" y="${y - 6}" class="ch-barval" text-anchor="middle">${it.text ?? it.value}</text></g>`;
    });
    const grid = [0, .5, 1].map(t => {
      const v = max * (1 - t), y = padT + t * (H - padT - padB);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(96,137,205,.1)"/>
        <text x="${padL - 6}" y="${y + 4}" class="ch-tick" text-anchor="end">${opts.int ? v.toFixed(0) : v.toFixed(1)}</text>`;
    }).join('');
    const step = Math.max(1, Math.ceil(n / (opts.xn || 24)));
    const xlabels = items.map((it, i) => i % step === 0 ? `<text x="${X(i)}" y="${H - 10}" class="ch-tick" text-anchor="middle">${it.label}</text>` : '').join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="ch-vbars" preserveAspectRatio="none" style="height:100%">${grid}${bars}${xlabels}</svg>`;
  }

  /* 仪表盘（240° 弧） */
  function gauge(value, opts = {}) {
    const size = opts.size || 96, cx = size / 2, cy = size / 2, r = size * .42, w = opts.width || 7;
    const a0 = -120, a1 = 120, av = a0 + Math.max(0, Math.min(100, value)) / 100 * (a1 - a0);
    const color = opts.color || scoreColor(value);
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      const ang = a0 + i * 24;
      const [x0, y0] = polar(cx, cy, r + w / 2 + 2, ang), [x1, y1] = polar(cx, cy, r + w / 2 + 5, ang);
      ticks.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="rgba(139,167,205,.35)" stroke-width="1.2"/>`);
    }
    return ``;
  }

  /* KPI 迷你进度环 */
  function ring(pct, color, size = 40) {
    const r = size / 2 - 3, c = 2 * Math.PI * r, off = c * (1 - Math.min(pct, 100) / 100);
    return `<svg viewBox="0 0 ${size} ${size}" class="ch-ring">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(96,137,205,.16)" stroke-width="3.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"
        style="transition:stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)"/></svg>`;
  }

  return { donut, pie, hbars, stackedBars, line, vbars, gauge, ring };
})();
