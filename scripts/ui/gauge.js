/**
 * Рендеринг SVG манометра со стрелкой и настраиваемыми зонами
 * @param {Object} param0
 * @param {number} param0.value - текущее значение
 * @param {number} param0.max - максимальное значение шкалы
 * @param {string} [param0.label] - подпись манометра
 * @param {Array<{at: number, label: string}>} [param0.marks=[]] - риски на шкале
 * @param {Array<{from: number, to: number, kind?: string}>} [param0.zones=[]] - цветные зоны (danger и т.д.)
 * @returns {string} SVG строка манометра
 */
export function renderGauge({ value, max = 100, label = "", marks = [], zones = [] }) {
  const safeMax = max <= 0 ? 100 : max;
  const clampedVal = typeof value === "number" ? value : 0;
  
  // Ratio capped between 0 and 1 for needle angle, handling out of bounds gracefully
  const ratio = Math.max(0, Math.min(1, clampedVal / safeMax));
  const angle = -135 + ratio * 270;

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    return [`M`, start.x, start.y, `A`, radius, radius, 0, arcSweep, 0, end.x, end.y].join(" ");
  }

  const arcPath = describeArc(60, 60, 42, -135, 135);

  // Default red zone if zones not provided: 80% to 100% (top of scale)
  const effectiveZones = zones.length > 0 ? zones : [{ from: safeMax * 0.8, to: safeMax, kind: "danger" }];

  const zonesSvg = effectiveZones.map((zone) => {
    const fRatio = Math.max(0, Math.min(1, zone.from / safeMax));
    const tRatio = Math.max(0, Math.min(1, zone.to / safeMax));
    const fAngle = -135 + fRatio * 270;
    const tAngle = -135 + tRatio * 270;
    const path = describeArc(60, 60, 42, fAngle, tAngle);
    const strokeColor = zone.kind === "danger" ? "var(--ea-danger, #a63a2a)" : "var(--ea-brass, #b08d57)";
    return `<path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" opacity="0.85" />`;
  }).join("");

  const marksSvg = marks.map((m) => {
    const mRatio = Math.max(0, Math.min(1, m.at / safeMax));
    const mAngle = -135 + mRatio * 270;
    const p1 = polarToCartesian(60, 60, 42, mAngle);
    const p2 = polarToCartesian(60, 60, 36, mAngle);
    const tp = polarToCartesian(60, 60, 27, mAngle);
    return `
      <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="var(--ea-ivory, #e8dcc0)" stroke-width="1.5" />
      <text x="${tp.x}" y="${tp.y}" fill="var(--ea-ivory-muted, #b3a890)" font-size="7.5" font-family="var(--ea-font-mono, monospace)" text-anchor="middle" dominant-baseline="central">${m.label}</text>
    `;
  }).join("");

  return `
    <svg class="ea-gauge" viewBox="0 0 120 144" width="120" height="144" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gaugeBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--ea-bg-elevated, #2a221b)" />
          <stop offset="100%" stop-color="var(--ea-bg-graphite, #1b1612)" />
        </radialGradient>
        <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      
      <!-- Outer Brass Bezel -->
      <circle cx="60" cy="60" r="56" fill="url(#gaugeBg)" stroke="var(--ea-brass, #b08d57)" stroke-width="4" filter="url(#gaugeShadow)" />
      <circle cx="60" cy="60" r="52" fill="var(--ea-bg-inset, #14110e)" stroke="var(--ea-border, #3d3228)" stroke-width="1" />

      <!-- Scale Arc Background -->
      <path d="${arcPath}" fill="none" stroke="var(--ea-ivory-dim, #827964)" stroke-width="3" stroke-linecap="round" opacity="0.4" />
      
      <!-- Zones (e.g. Danger Zones) -->
      ${zonesSvg}

      <!-- Tick Marks -->
      ${marksSvg}

      <!-- Needle Pivot and Rotation Group -->
      <g transform="rotate(${angle} 60 60)">
        <polygon points="60,22 57,64 63,64" fill="var(--ea-copper, #b87333)" />
        <polygon points="60,60 58,68 62,68" fill="var(--ea-brass, #b08d57)" />
      </g>

      <!-- Center Rivet Cap -->
      <circle cx="60" cy="60" r="6" fill="var(--ea-brass, #b08d57)" stroke="var(--ea-bg-graphite, #1b1612)" stroke-width="1.5" />
      <circle cx="60" cy="60" r="2" fill="var(--ea-copper, #b87333)" />

      <!-- Label & Value placed safely below dial (y > 116) -->
      ${label ? `<text x="60" y="124" fill="var(--ea-ivory, #e8dcc0)" font-size="9" font-family="var(--ea-font-heading, sans-serif)" font-weight="700" text-anchor="middle">${label}</text>` : ''}
      <text x="60" y="136" fill="var(--ea-ivory-muted, #b3a890)" font-size="9" font-family="var(--ea-font-mono, monospace)" text-anchor="middle">${clampedVal} / ${safeMax}</text>
    </svg>
  `;
}
