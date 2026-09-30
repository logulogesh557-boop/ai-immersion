import React, { useState, useEffect, useRef } from 'react';
import { TrafficRecord, WeatherCondition, DayOfWeek } from '../types/traffic';
import { WEATHER_CODES } from '../data/initialTrafficData';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Save, 
  MapPin, 
  CloudSun, 
  ShieldCheck, 
  Bike, 
  Car, 
  Bus, 
  Truck, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface FieldVisitCounterProps {
  onAddRecord: (record: TrafficRecord) => void;
  lastRecord?: TrafficRecord;
}

export const FieldVisitCounter: React.FC<FieldVisitCounterProps> = ({ onAddRecord, lastRecord }) => {
  // Survey metadata
  const [location, setLocation] = useState('College North Gate Junction');
  const [city, setCity] = useState('Chennai');
  const [intervalDuration, setIntervalDuration] = useState<15 | 30 | 60>(15);
  const [weather, setWeather] = useState<WeatherCondition>('Clear');
  const [notes, setNotes] = useState('');
  const [observerName, setObserverName] = useState('Student Field Observer');

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Vehicle counts
  const [counts, setCounts] = useState({
    twoWheeler: 0,
    car: 0,
    bus: 0,
    truck: 0,
    auto: 0,
    other: 0,
  });

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Interval duration change handler
  const handleDurationChange = (duration: 15 | 30 | 60) => {
    setIntervalDuration(duration);
    setIsTimerRunning(false);
    setSecondsRemaining(duration * 60);
  };

  // Timer tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Keyboard shortcut support (1 = 2-Wheeler, 2 = Car, 3 = Bus, 4 = Truck, 5 = Auto, 6 = Other)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') updateCount('twoWheeler', 1);
      else if (e.key === '2') updateCount('car', 1);
      else if (e.key === '3') updateCount('bus', 1);
      else if (e.key === '4') updateCount('truck', 1);
      else if (e.key === '5') updateCount('auto', 1);
      else if (e.key === '6') updateCount('other', 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateCount = (vehicle: keyof typeof counts, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [vehicle]: Math.max(0, prev[vehicle] + delta),
    }));
  };

  const resetCounts = () => {
    setCounts({
      twoWheeler: 0,
      car: 0,
      bus: 0,
      truck: 0,
      auto: 0,
      other: 0,
    });
  };

  const totalCurrent = counts.twoWheeler + counts.car + counts.bus + counts.truck + counts.auto + counts.other;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveObservation = () => {
    const now = new Date();
    const hr = now.getHours();
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const dayNumber = (now.getDay() + 6) % 7;
    const isPeak = (hr >= 8 && hr <= 10) || (hr >= 17 && hr <= 20);

    const newRecord: TrafficRecord = {
      id: `FIELD-${Date.now().toString().slice(-4)}`,
      date: now.toISOString().split('T')[0],
      time: `${hr.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      hour: hr,
      minute: now.getMinutes(),
      day: dayName,
      dayNumber,
      location: location || 'Field Survey Point',
      intervalMinutes: intervalDuration,
      twoWheeler: counts.twoWheeler,
      car: counts.car,
      bus: counts.bus,
      truck: counts.truck,
      auto: counts.auto,
      other: counts.other,
      totalVehicles: totalCurrent,
      weather,
      weatherCode: WEATHER_CODES[weather],
      isPeakHour: isPeak,
      prevHourVolume: lastRecord?.totalVehicles || 180,
      notes: notes || `Field survey count over ${intervalDuration} min interval`,
      observerName: observerName || 'Field Researcher',
    };

    onAddRecord(newRecord);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3500);

    // Reset counts for next observation interval
    resetCounts();
    setSecondsRemaining(intervalDuration * 60);
    setIsTimerRunning(false);
  };

  const vehicleButtons = [
    { key: 'twoWheeler', label: 'Two-Wheeler', sub: 'Scooter / Motorcycle', shortcut: '1', count: counts.twoWheeler, icon: Bike, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' },
    { key: 'car', label: 'Car / SUV', sub: 'Personal Automobiles', shortcut: '2', count: counts.car, icon: Car, color: 'border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10' },
    { key: 'auto', label: 'Auto-Rickshaw', sub: '3-Wheeled Transit', shortcut: '5', count: counts.auto, icon: Sparkles, color: 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10' },
    { key: 'bus', label: 'Bus', sub: 'Public / College Fleet', shortcut: '3', count: counts.bus, icon: Bus, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10' },
    { key: 'truck', label: 'Truck / Lorry', sub: 'Commercial Freight', shortcut: '4', count: counts.truck, icon: Truck, color: 'border-purple-500/30 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10' },
    { key: 'other', label: 'Other', sub: 'Bicycles / Light EV', shortcut: '6', count: counts.other, icon: Bike, color: 'border-slate-500/30 text-slate-300 bg-slate-800/40 hover:bg-slate-800/60' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Privacy notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Field Observation Privacy Compliant</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">Only aggregate numeric vehicle tallies recorded. Zero license plates or personal data.</span>
        </div>
        <div className="text-slate-400">
          Tip: Press keys <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-400 font-mono text-[11px]">1</kbd> to <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-400 font-mono text-[11px]">6</kbd> for instant tallying
        </div>
      </div>

      {/* Main Counter Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Setup & Observation Timer (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Survey Location Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Survey Location</span>
              </div>
              <span className="text-xs text-slate-500">Field Site</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Junction / Crossroad</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. College North Gate Junction"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">City / Town</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Weather</label>
                <select
                  value={weather}
                  onChange={e => setWeather(e.target.value as WeatherCondition)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="Clear">Clear</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Foggy">Foggy</option>
                  <option value="Hazy">Hazy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observer Name / ID</label>
              <input
                type="text"
                value={observerName}
                onChange={e => setObserverName(e.target.value)}
                placeholder="e.g. Roll No. 22BCE1045"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Stopwatch / Interval Timer */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Timer className="w-4 h-4 text-sky-400" />
                <span>Observation Window</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {([15, 30, 60] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDurationChange(d)}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      intervalDuration === d ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Big Countdown Display */}
            <div className="text-center py-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-4xl font-mono font-bold tracking-wider text-slate-100 tabular-nums">
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {secondsRemaining === 0 ? 'Interval Completed!' : isTimerRunning ? 'Survey in progress...' : 'Timer paused'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs transition-colors ${
                  isTimerRunning 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                    : 'bg-sky-600 text-white hover:bg-sky-500'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Interval</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setSecondsRemaining(intervalDuration * 60);
                }}
                title="Reset timer"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tactile Vehicle Tally Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Summary Bar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Total Counted (This Interval)</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-mono font-bold text-amber-400 tabular-nums">
                  {totalCurrent}
                </span>
                <span className="text-xs text-slate-400 font-mono uppercase">vehicles</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetCounts}
                className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                Clear Tally
              </button>

              <button
                type="button"
                onClick={handleSaveObservation}
                disabled={totalCurrent === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save to Project Dataset</span>
              </button>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-3 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Observation successfully recorded! <strong>{totalCurrent} vehicles</strong> added to the ML training dataset. Ready for the next interval.
              </span>
            </div>
          )}

          {/* Vehicle Category Tally Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {vehicleButtons.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{item.sub}</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
                      [{item.shortcut}]
                    </kbd>
                  </div>

                  <div className="my-4 text-center">
                    <span className="text-3xl font-mono font-bold text-slate-100 tabular-nums">
                      {item.count}
                    </span>
                  </div>

                  {/* Plus / Minus click buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCount(item.key as any, -1)}
                      disabled={item.count <= 0}
                      className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg transition-colors"
                      title="Decrement"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateCount(item.key as any, 1)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-semibold text-xs transition-colors ${item.color}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tap +1</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notes box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <label className="block text-xs text-slate-400 mb-1.5">Field Observation Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Signal failure at 08:45 AM caused 100m tailback; light drizzle started."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
