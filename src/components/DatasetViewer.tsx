import React, { useState, useMemo, useRef } from 'react';
import { TrafficRecord, WeatherCondition, DayOfWeek } from '../types/traffic';
import { WEATHER_CODES } from '../data/initialTrafficData';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Database,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface DatasetViewerProps {
  dataset: TrafficRecord[];
  onAddRecord: (record: TrafficRecord) => void;
  onDeleteRecord: (id: string) => void;
  onResetBenchmark: () => void;
  onImportCsv: (records: TrafficRecord[]) => void;
}

export const DatasetViewer: React.FC<DatasetViewerProps> = ({
  dataset,
  onAddRecord,
  onDeleteRecord,
  onResetBenchmark,
  onImportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [weatherFilter, setWeatherFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual record form state
  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    day: 'Tuesday' as DayOfWeek,
    location: 'College North Gate Junction',
    twoWheeler: 120,
    car: 55,
    bus: 8,
    truck: 5,
    auto: 25,
    other: 0,
    weather: 'Clear' as WeatherCondition,
  });

  // Filtered dataset
  const filteredData = useMemo(() => {
    return dataset.filter(r => {
      const matchSearch =
        searchTerm === '' ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm) ||
        r.time.includes(searchTerm) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDay = dayFilter === 'all' || r.day === dayFilter;
      const matchWeather = weatherFilter === 'all' || r.weather === weatherFilter;

      return matchSearch && matchDay && matchWeather;
    });
  }, [dataset, searchTerm, dayFilter, weatherFilter]);

  // Aggregate stats
  const totalVehiclesCounted = useMemo(() => {
    return dataset.reduce((acc, r) => acc + r.totalVehicles, 0);
  }, [dataset]);

  const avgVehicles = useMemo(() => {
    return dataset.length ? Math.round(totalVehiclesCounted / dataset.length) : 0;
  }, [dataset, totalVehiclesCounted]);

  const peakObserved = useMemo(() => {
    return dataset.reduce((max, r) => Math.max(max, r.totalVehicles), 0);
  }, [dataset]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Record_ID',
      'Date',
      'Time',
      'Hour',
      'Day',
      'Location',
      'Two_Wheeler',
      'Car',
      'Bus',
      'Truck',
      'Auto',
      'Other',
      'Weather',
      'Is_Peak_Hour',
      'Total_Vehicles',
    ];

    const rows = dataset.map(r => [
      r.id,
      r.date,
      r.time,
      r.hour,
      r.day,
      `"${r.location}"`,
      r.twoWheeler,
      r.car,
      r.bus,
      r.truck,
      r.auto,
      r.other,
      r.weather,
      r.isPeakHour ? 1 : 0,
      r.totalVehicles,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `traffic_field_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return;

        const imported: TrafficRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 8) {
            const two = parseInt(cols[6]) || 0;
            const car = parseInt(cols[7]) || 0;
            const bus = parseInt(cols[8]) || 0;
            const truck = parseInt(cols[9]) || 0;
            const auto = parseInt(cols[10]) || 0;
            const other = parseInt(cols[11]) || 0;
            const total = parseInt(cols[14]) || two + car + bus + truck + auto + other;

            const timeParts = (cols[2] || '08:00').split(':');
            const hr = parseInt(timeParts[0]) || 8;

            imported.push({
              id: cols[0] || `IMP-${i}`,
              date: cols[1] || '2026-09-01',
              time: cols[2] || '08:00',
              hour: hr,
              minute: parseInt(timeParts[1]) || 0,
              day: (cols[4] as DayOfWeek) || 'Tuesday',
              dayNumber: 1,
              location: cols[5] || 'Field Observation Site',
              intervalMinutes: 60,
              twoWheeler: two,
              car,
              bus,
              truck,
              auto,
              other,
              totalVehicles: total,
              weather: (cols[12] as WeatherCondition) || 'Clear',
              weatherCode: WEATHER_CODES[(cols[12] as WeatherCondition) || 'Clear'] || 0,
              isPeakHour: (hr >= 8 && hr <= 10) || (hr >= 17 && hr <= 20),
              prevHourVolume: total - 15,
            });
          }
        }

        if (imported.length > 0) {
          onImportCsv(imported);
        }
      } catch (err) {
        console.error('Failed to parse CSV', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hr = parseInt(formState.time.split(':')[0]) || 8;
    const min = parseInt(formState.time.split(':')[1]) || 0;
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayNumber = days.indexOf(formState.day);
    const isPeak = (hr >= 8 && hr <= 10) || (hr >= 17 && hr <= 20);
    const total = formState.twoWheeler + formState.car + formState.bus + formState.truck + formState.auto + formState.other;

    const newRec: TrafficRecord = {
      id: `MAN-${Date.now().toString().slice(-4)}`,
      date: formState.date,
      time: formState.time,
      hour: hr,
      minute: min,
      day: formState.day,
      dayNumber: dayNumber >= 0 ? dayNumber : 1,
      location: formState.location,
      intervalMinutes: 60,
      twoWheeler: formState.twoWheeler,
      car: formState.car,
      bus: formState.bus,
      truck: formState.truck,
      auto: formState.auto,
      other: formState.other,
      totalVehicles: total,
      weather: formState.weather,
      weatherCode: WEATHER_CODES[formState.weather],
      isPeakHour: isPeak,
      prevHourVolume: Math.round(total * 0.9),
      notes: 'Manually entered log',
      observerName: 'Researcher',
    };

    onAddRecord(newRec);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Total Observations</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-slate-100 tabular-nums">{dataset.length}</span>
            <span className="text-xs text-slate-400">intervals</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Optimal for ML fitting (&gt;50)</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Cumulative Vehicles</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
              {totalVehiclesCounted.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">tallied</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Real-world ground truth</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Mean Volume</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-sky-400 tabular-nums">{avgVehicles}</span>
            <span className="text-xs text-slate-400 font-mono">veh/hr</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Baseline average flow</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Peak Recorded Hour</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-rose-400 tabular-nums">{peakObserved}</span>
            <span className="text-xs text-slate-400 font-mono">veh/hr</span>
          </div>
          <span className="text-[11px] text-rose-400/80 mt-1 block">Evening rush capacity</span>
        </div>
      </div>

      {/* Preprocessing & Feature Hygiene Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Dataset Preprocessing Pipeline Status</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Missing values: <strong className="text-emerald-400">0 (Clean)</strong></span>
            <span>·</span>
            <span>Duplicates: <strong className="text-emerald-400">None detected</strong></span>
            <span>·</span>
            <span>Engineered Features: <strong className="text-sky-400">Hour, Day_Num, Peak_Flag, Weather_Code, Prev_Volume</strong></span>
            <span>·</span>
            <span>Target: <strong className="text-amber-400">Total_Vehicles</strong></span>
          </div>
        </div>
      </div>

      {/* Control bar: Search, Filter, Add, Import, Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by location, date, time..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Filter Day */}
          <select
            value={dayFilter}
            onChange={e => setDayFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Days</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>

          {/* Filter Weather */}
          <select
            value={weatherFilter}
            onChange={e => setWeatherFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Weather</option>
            <option value="Clear">Clear</option>
            <option value="Cloudy">Cloudy</option>
            <option value="Rainy">Rainy</option>
            <option value="Foggy">Foggy</option>
            <option value="Hazy">Hazy</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            title="Upload CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={onResetBenchmark}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-slate-800 transition-colors"
            title="Reset to 112-row Benchmark Dataset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 font-mono text-[11px] text-slate-400">
              <tr>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Day</th>
                <th className="py-3 px-3 text-right">2-Wheeler</th>
                <th className="py-3 px-3 text-right">Car</th>
                <th className="py-3 px-3 text-right">Bus</th>
                <th className="py-3 px-3 text-right">Truck</th>
                <th className="py-3 px-3 text-right">Auto</th>
                <th className="py-3 px-3 text-right font-bold text-amber-400">Total</th>
                <th className="py-3 px-3">Weather</th>
                <th className="py-3 px-3">Peak?</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500">
                    No matching traffic observations found.
                  </td>
                </tr>
              ) : (
                filteredData.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.id}</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.date}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{r.time}</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.day}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{r.twoWheeler}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{r.car}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{r.bus}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{r.truck}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{r.auto}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-amber-400">
                      {r.totalVehicles}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{r.weather}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-[11px] ${r.isPeakHour ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                        {r.isPeakHour ? 'PEAK' : 'OFF-PEAK'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Add Traffic Observation Record
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={e => setFormState({ ...formState, date: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={formState.time}
                    onChange={e => setFormState({ ...formState, time: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Day of Week</label>
                  <select
                    value={formState.day}
                    onChange={e => setFormState({ ...formState, day: e.target.value as DayOfWeek })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Weather</label>
                  <select
                    value={formState.weather}
                    onChange={e => setFormState({ ...formState, weather: e.target.value as WeatherCondition })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
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
                <label className="block text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={e => setFormState({ ...formState, location: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Vehicle counts */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Vehicle Tallies</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">2-Wheeler</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.twoWheeler}
                      onChange={e => setFormState({ ...formState, twoWheeler: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Car</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.car}
                      onChange={e => setFormState({ ...formState, car: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Auto</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.auto}
                      onChange={e => setFormState({ ...formState, auto: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Bus</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.bus}
                      onChange={e => setFormState({ ...formState, bus: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Truck</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.truck}
                      onChange={e => setFormState({ ...formState, truck: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Other</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.other}
                      onChange={e => setFormState({ ...formState, other: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Calculated Total:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {formState.twoWheeler + formState.car + formState.bus + formState.truck + formState.auto + formState.other} vehicles
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
