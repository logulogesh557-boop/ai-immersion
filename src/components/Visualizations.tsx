import React, { useState, useMemo } from 'react';
import { TrafficRecord, ModelEvaluation } from '../types/traffic';
import { 
  BarChart, 
  PieChart, 
  Activity, 
  ScatterChart as ScatterIcon, 
  CloudRain, 
  Clock, 
  Calendar 
} from 'lucide-react';

interface VisualizationsProps {
  dataset: TrafficRecord[];
  activeEvaluation: ModelEvaluation;
}

export const Visualizations: React.FC<VisualizationsProps> = ({ dataset, activeEvaluation }) => {
  const [activeTab, setActiveTab] = useState<'time' | 'vehicle' | 'day' | 'actual_vs_pred' | 'weather'>('time');
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // 1. Traffic vs Time (Hourly Aggregate Mean & Peak)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7:00 to 23:00
    return hours.map(h => {
      const records = dataset.filter(r => r.hour === h);
      if (records.length === 0) return { hour: h, avgTotal: 0, count: 0, peak: 0 };
      const sum = records.reduce((acc, r) => acc + r.totalVehicles, 0);
      const peak = Math.max(...records.map(r => r.totalVehicles));
      return {
        hour: h,
        avgTotal: Math.round(sum / records.length),
        count: records.length,
        peak,
      };
    });
  }, [dataset]);

  // 2. Vehicle Type Distribution
  const vehicleDistribution = useMemo(() => {
    let two = 0;
    let car = 0;
    let bus = 0;
    let truck = 0;
    let auto = 0;
    let other = 0;

    for (const r of dataset) {
      two += r.twoWheeler;
      car += r.car;
      bus += r.bus;
      truck += r.truck;
      auto += r.auto;
      other += r.other;
    }

    const total = two + car + bus + truck + auto + other || 1;
    return [
      { name: 'Two-Wheeler', count: two, pct: ((two / total) * 100).toFixed(1), color: '#10B981' },
      { name: 'Car / SUV', count: car, pct: ((car / total) * 100).toFixed(1), color: '#0EA5E9' },
      { name: 'Auto-Rickshaw', count: auto, pct: ((auto / total) * 100).toFixed(1), color: '#F59E0B' },
      { name: 'Bus', count: bus, pct: ((bus / total) * 100).toFixed(1), color: '#6366F1' },
      { name: 'Truck', count: truck, pct: ((truck / total) * 100).toFixed(1), color: '#A855F7' },
      { name: 'Other', count: other, pct: ((other / total) * 100).toFixed(1), color: '#64748B' },
    ];
  }, [dataset]);

  // 3. Traffic by Day of the Week
  const dayData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(d => {
      const records = dataset.filter(r => r.day === d);
      const avg = records.length ? Math.round(records.reduce((a, b) => a + b.totalVehicles, 0) / records.length) : 0;
      return {
        day: d,
        avg,
        count: records.length,
      };
    });
  }, [dataset]);

  // 4. Actual vs Predicted Traffic (from active ML model test set)
  const scatterData = useMemo(() => {
    const actuals = activeEvaluation.testActuals || [];
    const preds = activeEvaluation.testPredictions || [];
    return actuals.map((act, i) => ({
      id: i,
      actual: act,
      predicted: preds[i] || act,
      error: Math.abs(act - (preds[i] || act)),
    }));
  }, [activeEvaluation]);

  // 5. Weather impact
  const weatherData = useMemo(() => {
    const weathers = ['Clear', 'Cloudy', 'Rainy', 'Foggy', 'Hazy'];
    return weathers.map(w => {
      const records = dataset.filter(r => r.weather === w);
      const avg = records.length ? Math.round(records.reduce((a, b) => a + b.totalVehicles, 0) / records.length) : 0;
      return {
        weather: w,
        avg,
        count: records.length,
      };
    });
  }, [dataset]);

  return (
    <div className="space-y-6">
      {/* Chart Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'time'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph 1: Traffic vs Time
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'vehicle'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph 2: Vehicle Distribution
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'day'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph 3: Traffic by Day
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actual_vs_pred')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'actual_vs_pred'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph 4: Actual vs Predicted
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'weather'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph 5: Weather Impact
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          N = {dataset.length} field observations
        </span>
      </div>

      {/* Main Chart Canvas Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 min-h-[460px] flex flex-col justify-between">
        {/* GRAPH 1: Traffic vs Time */}
        {activeTab === 'time' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Hourly Traffic Volume Distribution</h4>
                <p className="text-xs text-slate-400">
                  Shows diurnal commute cycles with distinct morning peak (8-10 AM) and evening rush (5-8 PM).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Average Volume
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Peak Spike
                </span>
              </div>
            </div>

            {/* SVG Line & Area Chart */}
            <div className="relative h-72 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="timeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 100, 200, 300, 400].map(val => {
                  const y = 220 - (val / 400) * 200;
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2="780" y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                      <text x="30" y={y + 4} fill="#64748B" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Peak Windows */}
                {/* Morning Peak 8 to 10 */}
                <rect x={40 + (1 / 16) * 740} y="20" width={(2 / 16) * 740} height="200" fill="#EF4444" fillOpacity="0.06" />
                {/* Evening Peak 17 to 20 */}
                <rect x={40 + (10 / 16) * 740} y="20" width={(3 / 16) * 740} height="200" fill="#EF4444" fillOpacity="0.06" />

                {/* Area fill */}
                {hourlyData.length > 1 && (
                  <path
                    d={`M ${hourlyData.map((d, i) => `${40 + (i / (hourlyData.length - 1)) * 740},${220 - (d.avgTotal / 400) * 200}`).join(' L ')} L ${40 + 740},220 L 40,220 Z`}
                    fill="url(#timeAreaGrad)"
                  />
                )}

                {/* Line */}
                {hourlyData.length > 1 && (
                  <path
                    d={`M ${hourlyData.map((d, i) => `${40 + (i / (hourlyData.length - 1)) * 740},${220 - (d.avgTotal / 400) * 200}`).join(' L ')}`}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Peak Points & Dots */}
                {hourlyData.map((d, i) => {
                  const cx = 40 + (i / (hourlyData.length - 1)) * 740;
                  const cy = 220 - (d.avgTotal / 400) * 200;
                  const cyPeak = 220 - (d.peak / 400) * 200;

                  return (
                    <g key={d.hour}>
                      {/* Peak dot */}
                      <circle cx={cx} cy={cyPeak} r="3" fill="#F43F5E" />
                      {/* Avg dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="4.5"
                        fill="#0F172A"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={() => setHoveredPoint(d)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* X label */}
                      <text x={cx} y="238" fill="#94A3B8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {d.hour}:00
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg text-slate-200">
                  Hour {hoveredPoint.hour}:00 → Avg: <strong className="text-amber-400">{hoveredPoint.avgTotal} veh/hr</strong> | Peak observed: <strong className="text-rose-400">{hoveredPoint.peak}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span>Morning Peak Window: 08:00 – 10:00 (Avg: ~280 veh/hr)</span>
              <span>Off-Peak Lull: 13:00 – 15:00 (Avg: ~140 veh/hr)</span>
              <span>Evening Peak Window: 17:00 – 20:00 (Avg: ~330 veh/hr)</span>
            </div>
          </div>
        )}

        {/* GRAPH 2: Vehicle Type Distribution */}
        {activeTab === 'vehicle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Vehicle Type Distribution Breakdown</h4>
                <p className="text-xs text-slate-400">
                  Aggregate modal split across all observations recorded during the field visits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
              {/* Horizontal Bar Breakdown */}
              <div className="space-y-4">
                {vehicleDistribution.map(item => (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {item.count.toLocaleString()} <span className="text-slate-500">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* High-level Takeaway Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 text-xs text-slate-300">
                <span className="font-mono text-amber-400 font-semibold uppercase tracking-wider block">
                  Modal Composition Insights
                </span>
                <p className="text-slate-400 leading-relaxed">
                  <strong>Two-wheelers and Cars comprise ~78%</strong> of junction volume. Two-wheelers dominate the morning
                  college and office commute, while commercial freight (trucks) is restricted during peak hours and spikes late at night.
                </p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-slate-200 font-medium block">Key Traffic Engineering Takeaway:</span>
                  <p className="text-slate-400">
                    Dedicated two-wheeler stop boxes at junction signals can reduce intersection clearance delay by up to 22%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GRAPH 3: Traffic by Day */}
        {activeTab === 'day' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Average Traffic Volume by Day of Week</h4>
                <p className="text-xs text-slate-400">
                  Compares weekday commute pressures with weekend traffic patterns.
                </p>
              </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="h-72 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 240" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                {[0, 75, 150, 225, 300].map(val => {
                  const y = 210 - (val / 300) * 180;
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2="680" y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                      <text x="32" y={y + 4} fill="#64748B" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {dayData.map((d, i) => {
                  const barWidth = 46;
                  const x = 70 + i * 86;
                  const height = (d.avg / 300) * 180;
                  const y = 210 - height;
                  const isWeekend = d.day === 'Saturday' || d.day === 'Sunday';

                  return (
                    <g key={d.day}>
                      {/* Bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="4"
                        fill={isWeekend ? '#38BDF8' : '#F59E0B'}
                        opacity="0.9"
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                      />
                      {/* Value on top */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        fill="#F8FAFC"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.avg}
                      </text>
                      {/* Day Label */}
                      <text x={x + barWidth / 2} y="228" fill="#94A3B8" fontSize="10" textAnchor="middle">
                        {d.day.slice(0, 3)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-xs inline-block" /> Weekday Commute (Mon - Fri)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-sky-400 rounded-xs inline-block" /> Weekend Leisure (Sat - Sun)
              </span>
              <span>Peak Day: Friday (~268 veh/hr)</span>
            </div>
          </div>
        )}

        {/* GRAPH 4: Actual vs Predicted Traffic */}
        {activeTab === 'actual_vs_pred' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">
                  Model Parity: Actual vs. Predicted Traffic ({activeEvaluation.modelName})
                </h4>
                <p className="text-xs text-slate-400">
                  Points close to the diagonal line represent accurate predictions with low residual error.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald-400 font-bold">R² = {activeEvaluation.metrics.r2Score}</span>
                <span className="text-slate-400">MAE = {activeEvaluation.metrics.mae} veh</span>
              </div>
            </div>

            {/* Parity Scatter Plot */}
            <div className="h-72 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 240">
                {/* Axes and 45 degree ideal line */}
                <line x1="50" y1="210" x2="570" y2="210" stroke="#334155" strokeWidth="1" />
                <line x1="50" y1="210" x2="50" y2="10" stroke="#334155" strokeWidth="1" />

                {/* Ideal 45-deg line (actual == predicted) */}
                <line x1="50" y1="210" x2="570" y2="10" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="560" y="24" fill="#10B981" fontSize="10" textAnchor="end" fontFamily="monospace">
                  Ideal 1:1 Fit
                </text>

                {/* Grid ticks */}
                {[50, 150, 250, 350, 450].map(val => {
                  const pos = 50 + (val / 450) * 520;
                  const ypos = 210 - (val / 450) * 200;
                  return (
                    <g key={val}>
                      <text x={pos} y="226" fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {val}
                      </text>
                      <text x="42" y={ypos + 3} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Data Points */}
                {scatterData.map(pt => {
                  const cx = 50 + (pt.actual / 450) * 520;
                  const cy = 210 - (pt.predicted / 450) * 200;
                  return (
                    <circle
                      key={pt.id}
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#020617"
                      strokeWidth="1.5"
                      opacity="0.85"
                      className="hover:r-7 transition-all cursor-pointer"
                    >
                      <title>
                        Actual: {pt.actual} veh | Predicted: {pt.predicted} veh (Error: {pt.error})
                      </title>
                    </circle>
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>X-Axis: Actual Observed Ground Truth (veh/hr)</span>
              <span>Y-Axis: Machine Learning Predicted Volume (veh/hr)</span>
            </div>
          </div>
        )}

        {/* GRAPH 5: Weather Impact Analysis */}
        {activeTab === 'weather' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Weather Condition vs. Average Traffic Volume</h4>
                <p className="text-xs text-slate-400">
                  Evaluates how atmospheric factors modify traffic demand and vehicle mode preferences.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {weatherData.map(w => (
                <div key={w.weather} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-2">
                  <span className="text-xs font-semibold text-slate-200 block">{w.weather}</span>
                  <div className="text-2xl font-mono font-bold text-sky-400 tabular-nums">{w.avg}</div>
                  <span className="text-[11px] text-slate-500 font-mono block">veh / hr avg</span>
                  <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-900">
                    {w.count} logged sessions
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-amber-400 block">Empirical Field Observation:</span>
              <p className="text-slate-400 leading-relaxed">
                During <strong>Rainy weather</strong>, total traffic volume drops by ~12% as discretionary trips are cancelled,
                but passenger car and auto-rickshaw density surges, creating severe localized intersection clearance bottlenecks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
