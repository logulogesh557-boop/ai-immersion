/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { initialTrafficDataset } from './data/initialTrafficData';
import { TrafficRecord, ModelType } from './types/traffic';
import { trainAndEvaluateModels } from './utils/mlEngine';
import { FieldVisitCounter } from './components/FieldVisitCounter';
import { DatasetViewer } from './components/DatasetViewer';
import { ModelStudio } from './components/ModelStudio';
import { PredictionSimulator } from './components/PredictionSimulator';
import { Visualizations } from './components/Visualizations';
import { ProjectReportHub } from './components/ProjectReportHub';
import { 
  Zap, 
  Database, 
  Cpu, 
  BarChart3, 
  FileText, 
  MapPin, 
  Download,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'counter' | 'dataset' | 'models' | 'predictor' | 'visualizations' | 'report'>('counter');
  const [dataset, setDataset] = useState<TrafficRecord[]>(initialTrafficDataset);
  const [selectedModel, setSelectedModel] = useState<ModelType>('random_forest');
  const [testSplitRatio, setTestSplitRatio] = useState(0.2);

  // Train and evaluate models on active dataset
  const evaluationsAndPredictors = useMemo(() => {
    return trainAndEvaluateModels(dataset, testSplitRatio);
  }, [dataset, testSplitRatio]);

  // Extract predictors map
  const predictors = useMemo(() => {
    return {
      random_forest: evaluationsAndPredictors.random_forest.predictor,
      decision_tree: evaluationsAndPredictors.decision_tree.predictor,
      linear_regression: evaluationsAndPredictors.linear_regression.predictor,
      ridge_regression: evaluationsAndPredictors.ridge_regression.predictor,
    };
  }, [evaluationsAndPredictors]);

  // Unique locations in dataset
  const locations = useMemo(() => {
    const locSet = new Set(dataset.map(r => r.location));
    return Array.from(locSet);
  }, [dataset]);

  // Handlers for dataset operations
  const handleAddRecord = useCallback((newRecord: TrafficRecord) => {
    setDataset(prev => [newRecord, ...prev]);
  }, []);

  const handleDeleteRecord = useCallback((id: string) => {
    setDataset(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleResetBenchmark = useCallback(() => {
    setDataset(initialTrafficDataset);
  }, []);

  const handleImportCsv = useCallback((importedRecords: TrafficRecord[]) => {
    setDataset(prev => [...importedRecords, ...prev]);
  }, []);

  const handleRetrain = useCallback((testSize: number) => {
    setTestSplitRatio(testSize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      {/* 
        Mandatory Top Bar Contract:
        Zone 1: Single text element wordmark
        Zone 2: 4-6 text navigation links with subtle active states
        Zone 3: 1-2 primary actions
      */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); setActiveTab('counter'); }} 
          className="text-lg font-bold tracking-tight text-slate-100 hover:text-amber-400 transition-colors cursor-pointer"
        >
          TrafficPredict
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('counter')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'counter' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Field Counter
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'dataset' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Dataset ({dataset.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'models' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Model Studio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('predictor')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'predictor' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Predictor
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visualizations')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'visualizations' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Analytics & Charts
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'report' ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-400' : ''
            }`}
          >
            Project Report
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('predictor')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            Live Simulator
          </button>
        </div>
      </header>

      {/* Sub-header / System Status Ribbon */}
      <div className="border-b border-slate-900 bg-slate-900/30 px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Field Survey ML Pipeline Active</span>
            <span className="text-slate-600">·</span>
            <span>Target: <strong>Total_Vehicles</strong></span>
            <span className="text-slate-600">·</span>
            <span>Active Algorithm: <strong className="text-amber-400">{evaluationsAndPredictors[selectedModel].evaluation.modelName}</strong></span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>R²: <strong className="text-emerald-400">{evaluationsAndPredictors[selectedModel].evaluation.metrics.r2Score}</strong></span>
            <span>·</span>
            <span>MAE: <strong className="text-slate-300">{evaluationsAndPredictors[selectedModel].evaluation.metrics.mae} veh</strong></span>
            <span>·</span>
            <span>Observations: <strong className="text-sky-400">{dataset.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Mobile Navigation bar for small screens */}
        <div className="flex md:hidden overflow-x-auto pb-4 mb-4 gap-2 border-b border-slate-800 text-xs">
          {[
            { id: 'counter', label: 'Field Counter' },
            { id: 'dataset', label: `Dataset (${dataset.length})` },
            { id: 'models', label: 'ML Models' },
            { id: 'predictor', label: 'Predictor' },
            { id: 'visualizations', label: 'Analytics' },
            { id: 'report', label: 'Project Report' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
                activeTab === tab.id ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Routing */}
        {activeTab === 'counter' && (
          <FieldVisitCounter onAddRecord={handleAddRecord} lastRecord={dataset[0]} />
        )}

        {activeTab === 'dataset' && (
          <DatasetViewer
            dataset={dataset}
            onAddRecord={handleAddRecord}
            onDeleteRecord={handleDeleteRecord}
            onResetBenchmark={handleResetBenchmark}
            onImportCsv={handleImportCsv}
          />
        )}

        {activeTab === 'models' && (
          <ModelStudio
            dataset={dataset}
            evaluations={evaluationsAndPredictors}
            onRetrain={handleRetrain}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        )}

        {activeTab === 'predictor' && (
          <PredictionSimulator
            predictors={predictors}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            locations={locations}
          />
        )}

        {activeTab === 'visualizations' && (
          <Visualizations
            dataset={dataset}
            activeEvaluation={evaluationsAndPredictors[selectedModel].evaluation}
          />
        )}

        {activeTab === 'report' && (
          <ProjectReportHub
            dataset={dataset}
            evaluations={evaluationsAndPredictors}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">TrafficPredict</span>
            <span className="text-slate-700">·</span>
            <span>Field-Visit Machine Learning Traffic Volume Prediction System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Engineering College Project & Field Survey Suite</span>
            <span>·</span>
            <span>Zero PII / License-Free Data Collection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
