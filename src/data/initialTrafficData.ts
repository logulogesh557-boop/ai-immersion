import { TrafficRecord, DayOfWeek, WeatherCondition } from '../types/traffic';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WEATHER_CODES: Record<WeatherCondition, number> = {
  Clear: 0,
  Cloudy: 1,
  Rainy: 2,
  Foggy: 3,
  Hazy: 4,
};

// Generates a realistic calibrated dataset of 112 observation intervals (representing 2 weeks of field studies)
function generateFieldVisitDataset(): TrafficRecord[] {
  const records: TrafficRecord[] = [];
  const locations = [
    'College North Gate Junction',
    'Anna Nagar Main Roundabout',
    'Tech Park Ring Road Exit',
  ];

  const startDate = new Date(2026, 8, 1); // Sept 1, 2026 (Tuesday)
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  let recordId = 1;
  let runningPrevVolume = 120;

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayOffset);
    const dayName = daysOfWeek[(currentDate.getDay() + 6) % 7]; // Monday=0
    const dayNumber = (currentDate.getDay() + 6) % 7;
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

    // Weather simulation per day
    let weather: WeatherCondition = 'Clear';
    if (dayOffset === 3 || dayOffset === 4) weather = 'Rainy';
    else if (dayOffset === 7 || dayOffset === 8) weather = 'Cloudy';
    else if (dayOffset === 11) weather = 'Hazy';
    else if (dayOffset === 13) weather = 'Rainy';

    const selectedHours = isWeekend ? [8, 10, 12, 14, 17, 19, 21] : [7, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20];

    for (const hr of selectedHours) {
      const isMorningPeak = hr >= 8 && hr <= 10;
      const isEveningPeak = hr >= 17 && hr <= 20;
      const isPeak = isMorningPeak || isEveningPeak;

      // Base volume calculation
      let baseVolume = 100;
      if (isMorningPeak) {
        baseVolume = isWeekend ? 180 : 280;
      } else if (isEveningPeak) {
        baseVolume = isWeekend ? 240 : 330;
      } else if (hr >= 12 && hr <= 14) {
        baseVolume = 160;
      } else {
        baseVolume = 110;
      }

      // Day modifier
      if (dayName === 'Friday' && isEveningPeak) baseVolume += 45; // Friday evening rush
      if (dayName === 'Sunday') baseVolume -= 40;

      // Weather modifier
      if (weather === 'Rainy') {
        baseVolume -= 30; // some people delay travel or switch to cars
      }

      // Add controlled variance
      const variance = Math.floor(Math.sin(recordId * 1.7) * 25);
      const totalVehicles = Math.max(45, baseVolume + variance);

      // Modal distribution based on weather and time
      let twoWheelerPct = weather === 'Rainy' ? 0.35 : 0.52;
      let carPct = weather === 'Rainy' ? 0.38 : 0.26;
      let busPct = isPeak ? 0.05 : 0.03;
      let truckPct = hr < 8 || hr > 20 ? 0.06 : 0.02;
      let autoPct = weather === 'Rainy' ? 0.17 : 0.13;
      let otherPct = 0.04;

      const twoWheeler = Math.round(totalVehicles * twoWheelerPct);
      const car = Math.round(totalVehicles * carPct);
      const bus = Math.round(totalVehicles * busPct);
      const truck = Math.round(totalVehicles * truckPct);
      const auto = Math.round(totalVehicles * autoPct);
      const other = Math.max(1, totalVehicles - (twoWheeler + car + bus + truck + auto));

      const finalTotal = twoWheeler + car + bus + truck + auto + other;

      const timeStr = `${hr.toString().padStart(2, '0')}:00`;
      const dateStr = currentDate.toISOString().split('T')[0];

      records.push({
        id: `REC-${recordId.toString().padStart(3, '0')}`,
        date: dateStr,
        time: timeStr,
        hour: hr,
        minute: 0,
        day: dayName,
        dayNumber,
        location: locations[recordId % locations.length],
        intervalMinutes: 60,
        twoWheeler,
        car,
        bus,
        truck,
        auto,
        other,
        totalVehicles: finalTotal,
        weather,
        weatherCode: WEATHER_CODES[weather],
        isPeakHour: isPeak,
        prevHourVolume: runningPrevVolume,
        notes: isPeak ? 'Heavy queue at north-bound arm' : 'Free flowing traffic',
        observerName: 'Field Team Alpha',
      });

      runningPrevVolume = finalTotal;
      recordId++;
    }
  }

  return records;
}

export const initialTrafficDataset: TrafficRecord[] = generateFieldVisitDataset();
