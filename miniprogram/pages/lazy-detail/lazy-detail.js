// pages/lazy-detail/lazy-detail.js
const DATA      = require('../../utils/lazy-data');
const PORTFOLIOS = DATA;
const ETF_LABELS = DATA.ETF_LABELS;
const YEARS      = DATA.YEARS;
const PIE_COLORS = DATA.PIE_COLORS;

Page({
  data: {
    p:             null,
    allocsLabeled: [],
    yearReturns:   [],
    pieReady:      false,
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const p  = PORTFOLIOS.find(function(item) { return item.id === id; });
    if (!p) { wx.navigateBack(); return; }

    wx.setNavigationBarTitle({ title: p.name });

    const allocsLabeled = p.allocs.map(function(pair, i) {
      const fullLabel = ETF_LABELS[pair[0]] || pair[0];
      // ETF_LABELS 格式: "美国股票(VTI)" → 取括号前的中文
      const labelShort = fullLabel.replace(/\(.*\)/, '').trim();
      return {
        ticker:     pair[0],
        label:      fullLabel,
        labelShort: labelShort,
        pct:        pair[1],
        color:      PIE_COLORS[i % PIE_COLORS.length],
      };
    });

    const maxRet = Math.max.apply(null, p.returns.map(function(r) { return Math.abs(r); }));
    const yearReturns = YEARS.map(function(yr, i) {
      return {
        year:     yr,
        ret:      p.returns[i],
        display:  (p.returns[i] >= 0 ? '+' : '') + p.returns[i].toFixed(2) + '%',
        positive: p.returns[i] >= 0,
        barW:     Math.round(Math.abs(p.returns[i]) / maxRet * 220),
      };
    });

    const self = this;
    this.setData({ p: p, allocsLabeled: allocsLabeled, yearReturns: yearReturns }, function() {
      // setData 渲染完成后再画饼图，确保 canvas 节点已在 DOM 中
      wx.nextTick(function() { self._drawPie(); });
    });
  },

  onReady() {},

  _drawPie() {
    const p = this.data.p;
    if (!p) return;

    const self = this;
    const query = wx.createSelectorQuery();
    query.select('#allocPie').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) return;

      const canvas = res[0].node;
      const ctx    = canvas.getContext('2d');
      const dpr    = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2;
      const w      = res[0].width  || 130;
      const h      = res[0].height || 130;

      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) * 0.40;
      const innerR = outerR * 0.52;
      const gap    = 0.025;

      const total = p.allocs.reduce(function(s, a) { return s + a[1]; }, 0);
      let startAngle = -Math.PI / 2;

      p.allocs.forEach(function(pair, i) {
        const pct   = pair[1];
        const angle = (pct / total) * 2 * Math.PI;
        const color = PIE_COLORS[i % PIE_COLORS.length];

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle + gap, startAngle + angle - gap);
        ctx.arc(cx, cy, innerR, startAngle + angle - gap, startAngle + gap, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += angle;
      });

      // 中心文字
      ctx.fillStyle = '#1d1d1f';
      ctx.font = 'bold ' + Math.round(w * 0.07) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.allocs.length + '类资产', cx, cy);

      // 画完再显示 canvas，避免饼图先于页面其他内容出现
      self.setData({ pieReady: true });
    });
  },
});
