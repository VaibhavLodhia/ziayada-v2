export type SignalReading = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export const SIGNAL_READINGS: SignalReading[] = [
  { id: 'load', label: 'Cognitive load', value: 58, color: '#6BCFB8' },
  { id: 'pressure', label: 'Time pressure', value: 72, color: '#D9B45A' },
  { id: 'stake', label: 'Stake level', value: 85, color: '#85B7EB' },
  { id: 'cert', label: 'Certainty', value: 42, color: '#E58FB4' },
  { id: 'clar', label: 'Clarity', value: 61, color: '#A5C97A' },
];
