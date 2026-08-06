// A curated set of cities for the location picker, each mapped to its IANA zone.
// Labels are "City, State/Region, Country" (state omitted where not meaningful).
// `codes` are IATA airport codes so the search matches "sfo", "oak", "hnl", etc.
// Several cities can share one zone (e.g. Whistler & Vancouver) — that's fine;
// they show the same time but keep their own identity and alarms.

export type ZoneOption = { zone: string; label: string; codes?: string[] };

export const COMMON_ZONES: ZoneOption[] = [
  // United States
  { zone: 'America/Los_Angeles', label: 'San Francisco, CA, USA', codes: ['SFO'] },
  { zone: 'America/Los_Angeles', label: 'Oakland, CA, USA', codes: ['OAK'] },
  { zone: 'America/Los_Angeles', label: 'San Jose, CA, USA', codes: ['SJC'] },
  { zone: 'America/Los_Angeles', label: 'Los Angeles, CA, USA', codes: ['LAX'] },
  { zone: 'America/Los_Angeles', label: 'Seattle, WA, USA', codes: ['SEA'] },
  { zone: 'America/Los_Angeles', label: 'Las Vegas, NV, USA', codes: ['LAS'] },
  { zone: 'America/Denver', label: 'Denver, CO, USA', codes: ['DEN'] },
  { zone: 'America/Phoenix', label: 'Phoenix, AZ, USA', codes: ['PHX'] },
  { zone: 'America/Chicago', label: 'Chicago, IL, USA', codes: ['ORD', 'MDW'] },
  { zone: 'America/Chicago', label: 'Austin, TX, USA', codes: ['AUS'] },
  { zone: 'America/New_York', label: 'New York, NY, USA', codes: ['JFK', 'LGA', 'EWR'] },
  { zone: 'America/New_York', label: 'Miami, FL, USA', codes: ['MIA'] },
  { zone: 'America/New_York', label: 'Boston, MA, USA', codes: ['BOS'] },
  { zone: 'Pacific/Honolulu', label: 'Honolulu, HI, USA', codes: ['HNL'] },
  { zone: 'America/Anchorage', label: 'Anchorage, AK, USA', codes: ['ANC'] },

  // Canada
  { zone: 'America/Vancouver', label: 'Vancouver, BC, Canada', codes: ['YVR'] },
  { zone: 'America/Vancouver', label: 'Whistler, BC, Canada' },
  { zone: 'America/Edmonton', label: 'Calgary, AB, Canada', codes: ['YYC'] },
  { zone: 'America/Toronto', label: 'Toronto, ON, Canada', codes: ['YYZ', 'YTZ'] },
  { zone: 'America/Toronto', label: 'Montreal, QC, Canada', codes: ['YUL'] },

  // Latin America
  { zone: 'America/Mexico_City', label: 'Mexico City, CDMX, Mexico', codes: ['MEX'] },
  { zone: 'America/Sao_Paulo', label: 'Rio de Janeiro, RJ, Brazil', codes: ['GIG', 'SDU'] },
  { zone: 'America/Sao_Paulo', label: 'São Paulo, SP, Brazil', codes: ['GRU', 'CGH'] },
  { zone: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentina', codes: ['EZE', 'AEP'] },

  // Europe
  { zone: 'Europe/London', label: 'London, England, UK', codes: ['LHR', 'LGW', 'LCY', 'STN'] },
  { zone: 'Europe/Paris', label: 'Paris, France', codes: ['CDG', 'ORY'] },
  { zone: 'Europe/Berlin', label: 'Berlin, Germany', codes: ['BER'] },
  { zone: 'Europe/Madrid', label: 'Madrid, Spain', codes: ['MAD'] },
  { zone: 'Europe/Lisbon', label: 'Lisbon, Portugal', codes: ['LIS'] },
  { zone: 'Europe/Rome', label: 'Rome, Italy', codes: ['FCO', 'CIA'] },
  { zone: 'Europe/Athens', label: 'Athens, Greece', codes: ['ATH'] },
  { zone: 'Europe/Moscow', label: 'Moscow, Russia', codes: ['SVO', 'DME'] },

  // Africa & Middle East
  { zone: 'Africa/Cairo', label: 'Cairo, Egypt', codes: ['CAI'] },
  { zone: 'Africa/Johannesburg', label: 'Johannesburg, South Africa', codes: ['JNB'] },
  { zone: 'Asia/Dubai', label: 'Dubai, UAE', codes: ['DXB'] },

  // Asia & Pacific
  { zone: 'Asia/Kolkata', label: 'Mumbai, India', codes: ['BOM'] },
  { zone: 'Asia/Kolkata', label: 'New Delhi, India', codes: ['DEL'] },
  { zone: 'Asia/Bangkok', label: 'Bangkok, Thailand', codes: ['BKK', 'DMK'] },
  { zone: 'Asia/Singapore', label: 'Singapore', codes: ['SIN'] },
  { zone: 'Asia/Hong_Kong', label: 'Hong Kong', codes: ['HKG'] },
  { zone: 'Asia/Shanghai', label: 'Shanghai, China', codes: ['PVG', 'SHA'] },
  { zone: 'Asia/Tokyo', label: 'Tokyo, Japan', codes: ['HND', 'NRT'] },
  { zone: 'Asia/Seoul', label: 'Seoul, South Korea', codes: ['ICN', 'GMP'] },
  { zone: 'Australia/Sydney', label: 'Sydney, NSW, Australia', codes: ['SYD'] },
  { zone: 'Pacific/Auckland', label: 'Auckland, New Zealand', codes: ['AKL'] },
];

/** Lowercased haystack for searching a zone option by name, IANA zone, or code. */
export function zoneHaystack(z: ZoneOption): string {
  return `${z.label} ${z.zone} ${(z.codes ?? []).join(' ')}`.toLowerCase();
}

/** Best-effort friendly label for a zone, falling back to the city segment. */
export function labelForZone(zone: string): string {
  const found = COMMON_ZONES.find((z) => z.zone === zone);
  if (found) return found.label;
  const city = zone.split('/').pop() ?? zone;
  return city.replace(/_/g, ' ');
}
