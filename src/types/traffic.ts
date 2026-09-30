export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type WeatherCondition = 'Clear' | 'Cloudy' | 'Rainy' | 'Foggy' | 'Hazy';

export interface TrafficRecord {
  id: string;
  date: string;
  time: string; // "HH:MM"
  hour: number; // 0 - 23
  minute: number;
  day: DayOfWeek;
  dayNumber: number; // 0: Mon, 1: Tue, ..., 6: Sun
  location: string;
  intervalMinutes: number; // 15, 30, 60
  twoWheeler: number;
  car: number;
  bus: number;
  truck: number;
  auto: number;
  other: number;
  totalVehicles: number;
  weather: WeatherCondition;
  weatherCode: number; // 0: Clear, 1: Cloudy, 2: Rainy, 3: Foggy, 4: Hazy
  isPeakHour: boolean;
  prevHourVolume: number;
  notes?: string;
  observerName?: string;
}

export type ModelType = 'random_forest' | 'decision_tree' | 'linear_regression' | 'ridge_regression';

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2Score: number;
  mape: number;
  trainingTimeMs: number;
  sampleCount: number;
}

export interface ModelEvaluation {
  modelType: ModelType;
  modelName: string;
  metrics: ModelMetrics;
  testActuals: number[];
  testPredictions: number[];
  featureImportance: { feature: string; importance: number }[];
  description: string;
}

export interface PredictionInput {
  hour: number;
  day: DayOfWeek;
  weather: WeatherCondition;
  location: string;
  prevHourVolume: number;
  modelType: ModelType;
}

export interface PredictionResult {
  predictedTotal: number;
  lowerBound: number;
  upperBound: number;
  congestionLevel: 'Low' | 'Moderate' | 'Heavy' | 'Severe Peak';
  congestionColor: string;
  isPeak: boolean;
  breakdown: {
    twoWheeler: number;
    car: number;
    bus: number;
    truck: number;
    auto: number;
    other: number;
  };
  recommendation: string;
  confidenceScore: number;
}
