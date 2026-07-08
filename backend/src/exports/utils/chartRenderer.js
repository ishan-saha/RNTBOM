function renderGauge(doc, x, y, radius, percentage, color) {
  const cx = x + radius;
  const cy = y + radius;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const sweep = (percentage / 100) * (endAngle - startAngle);

  doc.save();
  doc.circle(cx, cy, radius).fill('#1e1e2e');

  doc.lineWidth(12);
  for (let i = 0; i <= 100; i += 2) {
    const angle = startAngle + (i / 100) * (endAngle - startAngle);
    const x1 = cx + (radius - 6) * Math.cos(angle);
    const y1 = cy + (radius - 6) * Math.sin(angle);
    const x2 = cx + (radius + 6) * Math.cos(angle);
    const y2 = cy + (radius + 6) * Math.sin(angle);
    if (i <= percentage) {
      doc.moveTo(x1, y1).lineTo(x2, y2).stroke(color || '#22c55e');
    } else {
      doc.moveTo(x1, y1).lineTo(x2, y2).stroke('#2d2d3d');
    }
  }

  doc.fontSize(radius * 0.5).font('Helvetica-Bold');
  doc.fillColor(color || '#22c55e').text(`${percentage}%`, cx - 20, cy - 12);
  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Compliance', cx - 22, cy + 12);
  doc.restore();
}

function renderBarChart(doc, x, y, width, height, data) {
  const barCount = data.length;
  const barWidth = Math.min((width - 40) / barCount, 40);
  const gap = Math.min((width - barCount * barWidth) / (barCount + 1), 20);
  const maxVal = Math.max(...data.map(d => Math.max(d.passed + d.failed, 1)));
  const chartHeight = height - 40;

  doc.save();
  doc.fontSize(8).fillColor('#666');
  for (let i = 0; i <= 4; i++) {
    const yPos = y + chartHeight - (i / 4) * chartHeight;
    doc.moveTo(x, yPos).lineTo(x + width, yPos).stroke('#1e1e2e');
    doc.text(`${Math.round((i / 4) * maxVal)}`, x - 25, yPos - 4, { width: 20, align: 'right' });
  }

  data.forEach((d, i) => {
    const bx = x + gap + i * (barWidth + gap);
    const totalH = ((d.passed + d.failed) / maxVal) * chartHeight;
    const passH = (d.passed / maxVal) * chartHeight;
    const failH = (d.failed / maxVal) * chartHeight;
    const by = y + chartHeight - totalH;

    if (d.passed > 0) {
      doc.rect(bx, by, barWidth, passH).fill('#22c55e');
    }
    if (d.failed > 0) {
      doc.rect(bx, by + passH, barWidth, failH).fill('#ef4444');
    }

    doc.fontSize(7).fillColor('#94a3b8').text(
      d.label?.length > 8 ? d.label.slice(0, 8) : d.label || '',
      bx - 2, y + chartHeight + 5, { width: barWidth + 4, align: 'center' }
    );
  });
  doc.restore();
}

function renderPieChart(doc, x, y, radius, data) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = { L1: '#ef4444', L2: '#f59e0b', critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' };
  let startAngle = 0;

  doc.save();
  data.forEach((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const color = colors[d.name] || '#6366f1';
    const endAngle = startAngle + sweep;

    doc.path(`M ${x} ${y} L ${x + radius * Math.cos(startAngle)} ${y + radius * Math.sin(startAngle)}`);
    doc.path(`A ${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x + radius * Math.cos(endAngle)} ${y + radius * Math.sin(endAngle)}`);
    doc.path(`Z`).fill(color);

    startAngle = endAngle;
  });

  doc.circle(x, y, radius * 0.55).fill('#1a1a2e');
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0').text(`${total}`, x - 8, y - 6);
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Total', x - 10, y + 8);
  doc.restore();
}

function renderLineChart(doc, x, y, width, height, data) {
  if (!data || data.length < 2) return;
  const maxVal = Math.max(...data.map(d => d.score), 1);
  const minVal = Math.min(...data.map(d => d.score), 0);
  const range = maxVal - minVal || 1;
  const chartW = width - 40;
  const chartH = height - 40;
  const stepX = chartW / (data.length - 1);

  doc.save();
  for (let i = 0; i <= 4; i++) {
    const yPos = y + chartH - (i / 4) * chartH;
    doc.moveTo(x, yPos).lineTo(x + width, yPos).stroke('#1e1e2e');
    doc.fontSize(7).fillColor('#666').text(`${Math.round(minVal + (i / 4) * range)}`, x - 22, yPos - 3, { width: 18, align: 'right' });
  }

  const points = data.map((d, i) => ({
    px: x + 30 + i * stepX,
    py: y + chartH - ((d.score - minVal) / range) * chartH,
  }));

  doc.moveTo(points[0].px, points[0].py);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i].px, points[i].py);
  }
  doc.stroke('#6366f1', 3);

  points.forEach((p, i) => {
    doc.circle(p.px, p.py, 3).fill('#6366f1');
    doc.fontSize(6).fillColor('#94a3b8').text(
      `${data[i].score}%`, p.px - 10, p.py - 14, { width: 20, align: 'center' }
    );
  });

  data.forEach((d, i) => {
    const label = typeof d.date === 'string' ? d.date.slice(0, 5) : '';
    doc.fontSize(6).fillColor('#666').text(label, points[i].px - 10, y + chartH + 5, { width: 20, align: 'center' });
  });

  doc.restore();
}

module.exports = { renderGauge, renderBarChart, renderPieChart, renderLineChart };
