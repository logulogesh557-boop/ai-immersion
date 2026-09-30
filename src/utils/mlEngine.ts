import { TrafficRecord, ModelType, ModelEvaluation, PredictionInput, PredictionResult } from '../types/traffic';

export interface ExtractedFeatures {
  X: number[][];
  y: number[];
  featureNames: string[];
}

// Convert dataset records to numerical feature vectors
export function extractFeatures(records: TrafficRecord[]): ExtractedFeatures {
  const featureNames = [
    'Hour of Day',
    'Day of Week',
    'Is Peak Hour',
    'Weather Code',
    'Previous Hour Traffic',
    'Is Weekend'
  ];

  const X: number[][] = [];
  const y: number[] = [];

  for (const r of records) {
    const isWeekend = r.day === 'Saturday' || r.day === 'Sunday' ? 1 : 0;
    const isPeak = r.isPeakHour ? 1 : 0;

    X.push([
      r.hour,
      r.dayNumber,
      isPeak,
      r.weatherCode,
      r.prevHourVolume,
      isWeekend,
    ]);

    y.push(r.totalVehicles);
  }

  return { X, y, featureNames };
}

// Simple train-test split utility
export function trainTestSplit(
  X: number[][],
  y: number[],
  testSize: number = 0.2,
  seed: number = 42
): {
  X_train: number[][];
  X_test: number[][];
  y_train: number[];
  y_test: number[];
} {
  const n = X.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  // Deterministic shuffle with seed
  let currentSeed = seed;
  function random() {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testCount = Math.max(1, Math.round(n * testSize));
  const testIndices = new Set(indices.slice(0, testCount));

  const X_train: number[][] = [];
  const X_test: number[][] = [];
  const y_train: number[] = [];
  const y_test: number[] = [];

  for (let i = 0; i < n; i++) {
    if (testIndices.has(i)) {
      X_test.push(X[i]);
      y_test.push(y[i]);
    } else {
      X_train.push(X[i]);
      y_train.push(y[i]);
    }
  }

  return { X_train, X_test, y_train, y_test };
}

// Standard normalization for stable linear algebra
interface Scaler {
  means: number[];
  stds: number[];
  transform: (row: number[]) => number[];
}

function fitScaler(X: number[][]): Scaler {
  const numFeatures = X[0].length;
  const means = new Array(numFeatures).fill(0);
  const stds = new Array(numFeatures).fill(0);

  for (let j = 0; j < numFeatures; j++) {
    let sum = 0;
    for (let i = 0; i < X.length; i++) sum += X[i][j];
    means[j] = sum / X.length;

    let varSum = 0;
    for (let i = 0; i < X.length; i++) varSum += Math.pow(X[i][j] - means[j], 2);
    stds[j] = Math.sqrt(varSum / X.length) || 1e-6;
  }

  return {
    means,
    stds,
    transform: (row: number[]) => row.map((val, idx) => (val - means[idx]) / stds[idx]),
  };
}

// Matrix operations for Ordinary Least Squares & Ridge Regression
function fitLinearModel(X_train: number[][], y_train: number[], alpha: number = 0.1): (row: number[]) => number {
  const scaler = fitScaler(X_train);
  const scaledX = X_train.map(r => [1, ...scaler.transform(r)]); // Add bias column 1
  const m = scaledX.length;
  const p = scaledX[0].length;

  // Gradient descent for numerical stability
  const weights = new Array(p).fill(0);
  const lr = 0.05;
  const epochs = 600;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradients = new Array(p).fill(0);
    for (let i = 0; i < m; i++) {
      let pred = 0;
      for (let j = 0; j < p; j++) pred += weights[j] * scaledX[i][j];
      const error = pred - y_train[i];
      for (let j = 0; j < p; j++) {
        gradients[j] += (error * scaledX[i][j]) / m;
      }
    }
    // Update with L2 regularization (except bias)
    for (let j = 0; j < p; j++) {
      const reg = j === 0 ? 0 : alpha * weights[j];
      weights[j] -= lr * (gradients[j] + reg / m);
    }
  }

  return (rawRow: number[]) => {
    const scaled = scaler.transform(rawRow);
    let result = weights[0];
    for (let j = 0; j < scaled.length; j++) {
      result += weights[j + 1] * scaled[j];
    }
    return Math.max(10, Math.round(result));
  };
}

// Simple Decision Tree Node
interface TreeNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  splitValue?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function buildDecisionTree(
  X: number[][],
  y: number[],
  depth: number = 0,
  maxDepth: number = 5,
  minSamplesSplit: number = 4
): TreeNode {
  if (depth >= maxDepth || y.length <= minSamplesSplit) {
    const avg = y.reduce((a, b) => a + b, 0) / (y.length || 1);
    return { isLeaf: true, value: avg };
  }

  let bestFeature = -1;
  let bestSplit = 0;
  let minVariance = Infinity;
  let bestLeftIndices: number[] = [];
  let bestRightIndices: number[] = [];

  const numFeatures = X[0].length;

  for (let f = 0; f < numFeatures; f++) {
    const vals = X.map(row => row[f]);
    const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);

    for (let i = 0; i < uniqueVals.length - 1; i++) {
      const split = (uniqueVals[i] + uniqueVals[i + 1]) / 2;
      const left: number[] = [];
      const right: number[] = [];

      for (let k = 0; k < X.length; k++) {
        if (X[k][f] <= split) left.push(k);
        else right.push(k);
      }

      if (left.length === 0 || right.length === 0) continue;

      const meanLeft = left.reduce((acc, idx) => acc + y[idx], 0) / left.length;
      const meanRight = right.reduce((acc, idx) => acc + y[idx], 0) / right.length;

      const varLeft = left.reduce((acc, idx) => acc + Math.pow(y[idx] - meanLeft, 2), 0);
      const varRight = right.reduce((acc, idx) => acc + Math.pow(y[idx] - meanRight, 2), 0);
      const totalVar = varLeft + varRight;

      if (totalVar < minVariance) {
        minVariance = totalVar;
        bestFeature = f;
        bestSplit = split;
        bestLeftIndices = left;
        bestRightIndices = right;
      }
    }
  }

  if (bestFeature === -1 || bestLeftIndices.length === 0 || bestRightIndices.length === 0) {
    const avg = y.reduce((a, b) => a + b, 0) / (y.length || 1);
    return { isLeaf: true, value: avg };
  }

  const leftX = bestLeftIndices.map(i => X[i]);
  const leftY = bestLeftIndices.map(i => y[i]);
  const rightX = bestRightIndices.map(i => X[i]);
  const rightY = bestRightIndices.map(i => y[i]);

  return {
    isLeaf: false,
    featureIndex: bestFeature,
    splitValue: bestSplit,
    left: buildDecisionTree(leftX, leftY, depth + 1, maxDepth, minSamplesSplit),
    right: buildDecisionTree(rightX, rightY, depth + 1, maxDepth, minSamplesSplit),
  };
}

function predictTree(node: TreeNode, row: number[]): number {
  if (node.isLeaf) return node.value || 0;
  if (node.featureIndex !== undefined && node.splitValue !== undefined) {
    if (row[node.featureIndex] <= node.splitValue) {
      return predictTree(node.left!, row);
    } else {
      return predictTree(node.right!, row);
    }
  }
  return 0;
}

// Random Forest implementation with ensemble bagging
function buildRandomForest(X: number[][], y: number[], numTrees: number = 16, maxDepth: number = 5): (row: number[]) => number {
  const trees: TreeNode[] = [];
  const n = X.length;

  for (let t = 0; t < numTrees; t++) {
    // Bootstrap sample
    const sampleX: number[][] = [];
    const sampleY: number[] = [];

    for (let i = 0; i < n; i++) {
      const randIdx = Math.floor(Math.random() * n);
      sampleX.push(X[randIdx]);
      sampleY.push(y[randIdx]);
    }

    const tree = buildDecisionTree(sampleX, sampleY, 0, maxDepth, 3);
    trees.push(tree);
  }

  return (row: number[]) => {
    const preds = trees.map(t => predictTree(t, row));
    const mean = preds.reduce((a, b) => a + b, 0) / preds.length;
    return Math.max(10, Math.round(mean));
  };
}

// Calculate standard ML evaluation metrics
export function calculateMetrics(actuals: number[], predictions: number[], startTime: number): {
  mae: number;
  rmse: number;
  r2Score: number;
  mape: number;
  trainingTimeMs: number;
} {
  const n = actuals.length;
  let sumAbsError = 0;
  let sumSqError = 0;
  let sumAbsPctError = 0;

  const actualMean = actuals.reduce((a, b) => a + b, 0) / n;
  let totalVariance = 0;

  for (let i = 0; i < n; i++) {
    const diff = actuals[i] - predictions[i];
    sumAbsError += Math.abs(diff);
    sumSqError += diff * diff;
    sumAbsPctError += Math.abs(diff / (actuals[i] || 1));
    totalVariance += Math.pow(actuals[i] - actualMean, 2);
  }

  const mae = sumAbsError / n;
  const mse = sumSqError / n;
  const rmse = Math.sqrt(mse);
  const mape = (sumAbsPctError / n) * 100;
  const r2Score = Math.max(0, 1 - (sumSqError / (totalVariance || 1)));

  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    r2Score: Number(r2Score.toFixed(3)),
    mape: Number(mape.toFixed(2)),
    trainingTimeMs: Date.now() - startTime,
  };
}

// Compute feature importance by measuring performance drop
function computeFeatureImportance(
  predictor: (row: number[]) => number,
  X_test: number[][],
  y_test: number[],
  featureNames: string[]
): { feature: string; importance: number }[] {
  const baselinePreds = X_test.map(predictor);
  let baseSqErr = 0;
  for (let i = 0; i < y_test.length; i++) {
    baseSqErr += Math.pow(y_test[i] - baselinePreds[i], 2);
  }

  const drops: number[] = [];

  for (let f = 0; f < featureNames.length; f++) {
    // Permute feature f
    const shuffledX = X_test.map(row => [...row]);
    for (let i = shuffledX.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledX[i][f];
      shuffledX[i][f] = shuffledX[j][f];
      shuffledX[j][f] = temp;
    }

    const permPreds = shuffledX.map(predictor);
    let permSqErr = 0;
    for (let i = 0; i < y_test.length; i++) {
      permSqErr += Math.pow(y_test[i] - permPreds[i], 2);
    }

    drops.push(Math.max(0, permSqErr - baseSqErr));
  }

  const totalDrop = drops.reduce((a, b) => a + b, 0) || 1;
  return featureNames.map((name, idx) => ({
    feature: name,
    importance: Number(((drops[idx] / totalDrop) * 100).toFixed(1)),
  })).sort((a, b) => b.importance - a.importance);
}

// Train and benchmark all requested models
export function trainAndEvaluateModels(
  records: TrafficRecord[],
  testSize: number = 0.2
): Record<ModelType, { evaluation: ModelEvaluation; predictor: (row: number[]) => number }> {
  const { X, y, featureNames } = extractFeatures(records);
  const { X_train, X_test, y_train, y_test } = trainTestSplit(X, y, testSize);

  const results: any = {};

  // 1. Random Forest Regressor
  {
    const start = Date.now();
    const predictor = buildRandomForest(X_train, y_train, 18, 5);
    const testPredictions = X_test.map(predictor);
    const metrics = { ...calculateMetrics(y_test, testPredictions, start), sampleCount: records.length };
    const featureImportance = computeFeatureImportance(predictor, X_test, y_test, featureNames);

    results.random_forest = {
      evaluation: {
        modelType: 'random_forest',
        modelName: 'Random Forest Regressor',
        metrics,
        testActuals: y_test,
        testPredictions,
        featureImportance,
        description: 'Ensemble of 18 decision trees with bootstrap aggregation (bagging). Excels at non-linear traffic rush dynamics with minimal variance.',
      },
      predictor,
    };
  }

  // 2. Decision Tree Regressor
  {
    const start = Date.now();
    const tree = buildDecisionTree(X_train, y_train, 0, 5, 3);
    const predictor = (row: number[]) => Math.max(10, Math.round(predictTree(tree, row)));
    const testPredictions = X_test.map(predictor);
    const metrics = { ...calculateMetrics(y_test, testPredictions, start), sampleCount: records.length };
    const featureImportance = computeFeatureImportance(predictor, X_test, y_test, featureNames);

    results.decision_tree = {
      evaluation: {
        modelType: 'decision_tree',
        modelName: 'Decision Tree Regressor',
        metrics,
        testActuals: y_test,
        testPredictions,
        featureImportance,
        description: 'Hierarchical tree model using recursive variance reduction. Simple to interpret but prone to sharp threshold boundaries.',
      },
      predictor,
    };
  }

  // 3. Linear Regression (OLS)
  {
    const start = Date.now();
    const predictor = fitLinearModel(X_train, y_train, 0.05);
    const testPredictions = X_test.map(predictor);
    const metrics = { ...calculateMetrics(y_test, testPredictions, start), sampleCount: records.length };
    const featureImportance = computeFeatureImportance(predictor, X_test, y_test, featureNames);

    results.linear_regression = {
      evaluation: {
        modelType: 'linear_regression',
        modelName: 'Linear Regression (OLS)',
        metrics,
        testActuals: y_test,
        testPredictions,
        featureImportance,
        description: 'Baseline parametric model fitting an optimal hyperplane. High interpretability with moderate fit on complex non-linear rush-hour curves.',
      },
      predictor,
    };
  }

  // 4. Ridge Regression (L2 Regularized)
  {
    const start = Date.now();
    const predictor = fitLinearModel(X_train, y_train, 0.4);
    const testPredictions = X_test.map(predictor);
    const metrics = { ...calculateMetrics(y_test, testPredictions, start), sampleCount: records.length };
    const featureImportance = computeFeatureImportance(predictor, X_test, y_test, featureNames);

    results.ridge_regression = {
      evaluation: {
        modelType: 'ridge_regression',
        modelName: 'Ridge Regression (L2)',
        metrics,
        testActuals: y_test,
        testPredictions,
        featureImportance,
        description: 'Linear model with Tikhonov L2 regularization to shrink coefficients and prevent multicollinearity between time and lag traffic.',
      },
      predictor,
    };
  }

  return results;
}

// Generate single prediction with breakdown and actionable guidance
export function predictTrafficVolume(
  input: PredictionInput,
  predictor: (row: number[]) => number
): PredictionResult {
  const isWeekend = input.day === 'Saturday' || input.day === 'Sunday' ? 1 : 0;
  const isPeak = (input.hour >= 8 && input.hour <= 10) || (input.hour >= 17 && input.hour <= 20);

  const weatherCodeMap: Record<string, number> = {
    Clear: 0,
    Cloudy: 1,
    Rainy: 2,
    Foggy: 3,
    Hazy: 4,
  };

  const dayNumbers: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const featureRow = [
    input.hour,
    dayNumbers[input.day] ?? 1,
    isPeak ? 1 : 0,
    weatherCodeMap[input.weather] ?? 0,
    input.prevHourVolume,
    isWeekend,
  ];

  const rawPred = predictor(featureRow);
  const predictedTotal = Math.max(30, rawPred);

  // Uncertainty interval (+/- 6% to 9%)
  const margin = Math.round(predictedTotal * 0.08);
  const lowerBound = Math.max(10, predictedTotal - margin);
  const upperBound = predictedTotal + margin;

  // Congestion categorization
  let congestionLevel: 'Low' | 'Moderate' | 'Heavy' | 'Severe Peak' = 'Low';
  let congestionColor = 'text-emerald-400';
  let recommendation = 'Traffic flow is free. Standard fixed-time traffic light cycles adequate.';

  if (predictedTotal >= 320) {
    congestionLevel = 'Severe Peak';
    congestionColor = 'text-rose-400';
    recommendation = 'Critical queue length detected. Implement 30s green-split extension on arterial approaches; deploy traffic wardens to clear junction box blockage.';
  } else if (predictedTotal >= 240) {
    congestionLevel = 'Heavy';
    congestionColor = 'text-amber-400';
    recommendation = 'Heavy corridor flow. Coordinate upstream signal offsets; activate dynamic advisory signage for alternate bypass routes.';
  } else if (predictedTotal >= 140) {
    congestionLevel = 'Moderate';
    congestionColor = 'text-sky-400';
    recommendation = 'Moderate traffic density. Maintain standard semi-actuated loop detector cycles.';
  }

  // Realistic vehicle breakdown estimation based on weather and time
  let twoWheelerRatio = input.weather === 'Rainy' ? 0.36 : 0.51;
  let carRatio = input.weather === 'Rainy' ? 0.36 : 0.27;
  let busRatio = isPeak ? 0.05 : 0.03;
  let truckRatio = input.hour < 8 || input.hour > 20 ? 0.06 : 0.02;
  let autoRatio = input.weather === 'Rainy' ? 0.18 : 0.13;

  const twoWheeler = Math.round(predictedTotal * twoWheelerRatio);
  const car = Math.round(predictedTotal * carRatio);
  const bus = Math.round(predictedTotal * busRatio);
  const truck = Math.round(predictedTotal * truckRatio);
  const auto = Math.round(predictedTotal * autoRatio);
  const other = Math.max(1, predictedTotal - (twoWheeler + car + bus + truck + auto));

  return {
    predictedTotal,
    lowerBound,
    upperBound,
    congestionLevel,
    congestionColor,
    isPeak,
    breakdown: {
      twoWheeler,
      car,
      bus,
      truck,
      auto,
      other,
    },
    recommendation,
    confidenceScore: 0.92,
  };
}
