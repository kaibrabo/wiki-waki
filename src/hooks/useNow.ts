import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

/** A DateTime that updates every `intervalMs` (default 1s) to drive live clocks. */
export function useNow(intervalMs = 1000): DateTime {
  const [now, setNow] = useState(() => DateTime.now());
  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
