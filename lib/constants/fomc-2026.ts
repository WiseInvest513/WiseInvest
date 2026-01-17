// Federal Reserve (FOMC) Meeting Schedule 2026
// Note: Month is 0-indexed in JS Date (0 = Jan, 11 = Dec)

export interface FOMCMeeting {
  date: Date;
  endDate: Date;
  title: string;
  hasSEP: boolean; // Summary of Economic Projections
}

export const FOMC_MEETINGS_2026: FOMCMeeting[] = [
  { 
    date: new Date(2026, 0, 27), 
    endDate: new Date(2026, 0, 28), 
    title: 'FOMC Meeting (Jan)', 
    hasSEP: false 
  },
  { 
    date: new Date(2026, 2, 17), 
    endDate: new Date(2026, 2, 18), 
    title: 'FOMC Meeting (Mar) + Projections', 
    hasSEP: true 
  },
  { 
    date: new Date(2026, 3, 28), 
    endDate: new Date(2026, 3, 29), 
    title: 'FOMC Meeting (Apr)', 
    hasSEP: false 
  },
  { 
    date: new Date(2026, 5, 16), 
    endDate: new Date(2026, 5, 17), 
    title: 'FOMC Meeting (Jun) + Projections', 
    hasSEP: true 
  },
  { 
    date: new Date(2026, 6, 28), 
    endDate: new Date(2026, 6, 29), 
    title: 'FOMC Meeting (Jul)', 
    hasSEP: false 
  },
  { 
    date: new Date(2026, 8, 15), 
    endDate: new Date(2026, 8, 16), 
    title: 'FOMC Meeting (Sep) + Projections', 
    hasSEP: true 
  },
  { 
    date: new Date(2026, 9, 27), 
    endDate: new Date(2026, 9, 28), 
    title: 'FOMC Meeting (Oct)', 
    hasSEP: false 
  },
  { 
    date: new Date(2026, 11, 8), 
    endDate: new Date(2026, 11, 9), 
    title: 'FOMC Meeting (Dec) + Projections', 
    hasSEP: true 
  },
];
