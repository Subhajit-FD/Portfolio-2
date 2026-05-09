'use client';

import { useEffect, useMemo, useState } from 'react';

type DateTimeState = {
  fullDate: string;
  time: string;
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  localeDate: string;
};

const twoDigits = (value: number) => value.toString().padStart(2, '0');

export function useDateAndTime(): DateTimeState {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JS month base 0
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const fullDate = `${year}-${twoDigits(month)}-${twoDigits(day)}`;
    const time = `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
    const localeDate = now.toLocaleDateString();

    return { fullDate, time, year, month, day, localeDate };
  }, [now]);
}

export default useDateAndTime;
