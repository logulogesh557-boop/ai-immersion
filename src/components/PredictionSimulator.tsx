import React, { useState, useMemo } from 'react';
import { TrafficRecord, ModelType, DayOfWeek, WeatherCondition } from '../types/traffic';
import { predictTrafficVolume } from '../utils/mlEngine';
import { 
  Zap, 
  Clock, 
  Calendar, 
  CloudSun, 
  MapPin, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  Sliders, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PredictionSimulatorProps {
  predictors: Record<ModelType, (row: number[]) => number>;
  selectedModel: ModelType;
  onSelectModel: (m: ModelType) => void;
  locations: string[];
}

export const PredictionSimulator: React.FC<PredictionSimulatorProps> = ({
  predictors,
  selectedModel,
  onSelectModel,
  locations,
}) => {
  const [hour, setHour] = useState(18); // 6:00 PM default as in prompt example!
  const [day, setDay] = useState<DayOfWeek>('Friday');
  const [weather, setWeather] = useState<WeatherCondition>('Clear');
  const [location, setLocation] = useState(locations[0] || 'College North Gate Junction');
  const [prevHourVolume, setPrevHourVolume] = useState(280);

  // Compute live prediction
  const currentPredictor = predictors[selectedModel] || predictors.random_forest;

  const result = useMemo(() => {
    return predictTrafficVolume(
      {
        hour,
        day,
        weather,
        location,
        prevHourVolume,
        modelType: selectedModel,
      },
      currentPredictor
    );
  }, [hour, day, weather, location, prevHourVolume, selectedModel, currentPredictor]);

  // Presets from problem statement & real-world scenarios
  const applyPreset = (presetHour: number, presetDay: DayOfWeek, presetWeather: WeatherCondition, prev: number) => {
    setHour(presetHour);
    setDay(presetDay);
    setWeather(presetWeather);
    setPrevHourVolume(prev);
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Scenario Preset Strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 font-medium">Quick Scenario Benchmarks:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(18, 'Friday', 'Clear', 310)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Friday 6:00 PM (Prompt Case)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(8, 'Tuesday', 'Clear', 210)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Tuesday 8:00 AM (Morning Rush)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(19, 'Thursday', 'Rainy', 290)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Thursday 7:00 PM Rainy Bottleneck
          </button>
          <button
            type="button"
            onClick={() => applyPreset(14, 'Sunday', 'Clear', 110)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Sunday 2:00 PM Off-Peak
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Feature Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Input Parameters</span>
            </div>
            {/* Algorithm Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onSelectModel('random_forest')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedModel === 'random_forest'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Random Forest
              </button>
              <button
                type="button"
                onClick={() => onSelectModel('linear_regression')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedModel === 'linear_regression'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Linear
              </button>
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Time of Day (Observation Hour)</span>
              </label>
              <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {formatHour(hour)} ({hour}:00)
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={23}
              step={1}
              value={hour}
              onChange={e => setHour(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>06:00 AM (Dawn)</span>
              <span>12:00 PM (Noon)</span>
              <span>18:00 (Evening Rush)</span>
              <span>23:00 (Night)</span>
            </div>
          </div>

          {/* Day of Week */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Day of the Week</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DayOfWeek[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`py-1.5 text-xs font-mono rounded transition-colors ${
                    day === d
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span>Weather Conditions</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Clear', 'Cloudy', 'Rainy', 'Foggy', 'Hazy'] as WeatherCondition[]).map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeather(w)}
                  className={`py-1.5 px-2 text-xs rounded transition-colors text-center ${
                    weather === w
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Prev Volume */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Junction</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">Previous Hour Traffic (veh/hr):</span>
                <span className="font-mono text-slate-200 font-semibold">{prevHourVolume}</span>
              </div>
              <input
                type="range"
                min={40}
                max={420}
                step={10}
                value={prevHourVolume}
                onChange={e => setPrevHourVolume(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Model Output & Congestion Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Prediction Display Card */}
          <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Model Output: {selectedModel === 'random_forest' ? 'Random Forest Estimator' : 'Linear Regression'}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold uppercase ${result.congestionColor}`}>
                {result.congestionLevel} Congestion
              </span>
            </div>

            {/* Huge Number */}
            <div className="my-5 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-baseline justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Estimated Total Traffic Volume</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-mono font-extrabold text-amber-400 tabular-nums">
                    {result.predictedTotal}
                  </span>
                  <span className="text-sm font-mono text-slate-400 uppercase">vehicles / hour</span>
                </div>
              </div>

              {/* Confidence Band */}
              <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-lg text-xs space-y-0.5 text-center sm:text-right">
                <span className="text-slate-400 block text-[11px]">90% Confidence Interval:</span>
                <span className="font-mono text-slate-200 font-semibold tabular-nums">
                  [{result.lowerBound} – {result.upperBound}] veh/hr
                </span>
              </div>
            </div>

            {/* Context bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {formatHour(hour)}
              </span>
              <span>·</span>
              <span>{day}</span>
              <span>·</span>
              <span>Weather: {weather}</span>
              <span>·</span>
              <span className={result.isPeak ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                {result.isPeak ? 'Peak Traffic Window' : 'Normal Off-Peak Flow'}
              </span>
            </div>
          </div>

          {/* Predicted Modal Vehicle Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200">Predicted Vehicle Modal Split</span>
              <span className="text-xs text-slate-500 font-mono">Category Volume Forecast</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Bike className="w-3.5 h-3.5" /> 2-Wheeler
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.twoWheeler}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  ~{Math.round((result.breakdown.twoWheeler / result.predictedTotal) * 100)}% of total traffic
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-sky-400">
                    <Car className="w-3.5 h-3.5" /> Car / SUV
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.car}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  ~{Math.round((result.breakdown.car / result.predictedTotal) * 100)}% of total traffic
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Rickshaw
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.auto}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  ~{Math.round((result.breakdown.auto / result.predictedTotal) * 100)}% of total traffic
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Bus className="w-3.5 h-3.5" /> Transit Bus
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.bus}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">High passenger throughput</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-purple-400">
                    <Truck className="w-3.5 h-3.5" /> Heavy Trucks
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.truck}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Freight / Logistics impact</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Bike className="w-3.5 h-3.5" /> Light / Other
                  </span>
                  <span className="font-mono font-bold text-slate-200">{result.breakdown.other}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Bicycles and misc. transit</span>
              </div>
            </div>
          </div>

          {/* Actionable Traffic Management Recommendation */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-200 block">Traffic Engineering Recommendation:</span>
              <p className="text-slate-400 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
