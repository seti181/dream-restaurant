// Weather: names and what they mean for the day. How often each happens, and
// its effects, are tuned in balance.ts. See project.md section 6.10.

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'heatwave';

export const WEATHER_IDS: readonly Weather[] = ['sunny', 'cloudy', 'rain', 'heatwave'];

export const WEATHER: Record<Weather, { name: string; icon: string; forecast: string }> = {
  sunny: { name: 'Sunny', icon: '☀️', forecast: 'Sunshine! More people out walking, and terraces fill up.' },
  cloudy: { name: 'Cloudy', icon: '⛅', forecast: 'Grey but dry. An ordinary day in Gdańsk.' },
  rain: { name: 'Rain', icon: '🌧️', forecast: 'Rain. Fewer people out, terraces stay closed, and soup sells well.' },
  heatwave: {
    name: 'Heatwave',
    icon: '🌡️',
    forecast: 'A heatwave! Ice cream and lemonade fly out; nobody wants hot soup.',
  },
};

/** When the forecast is wrong, what the weather turns into instead (one is picked at random). */
export const FORECAST_MISSES: Record<Weather, readonly Weather[]> = {
  sunny: ['cloudy'],
  cloudy: ['sunny', 'rain'],
  rain: ['cloudy'],
  heatwave: ['sunny'],
};

/** How the weather is described when it turned out differently from the forecast. */
export const WEATHER_AFTER_ALL: Record<Weather, string> = {
  sunny: 'the sun came out after all',
  cloudy: 'it stayed grey after all',
  rain: 'it rained after all',
  heatwave: 'it turned into a scorcher',
};
