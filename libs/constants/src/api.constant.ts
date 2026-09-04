export enum TimeFilter {
  DAY = 1,
  WEEK = 7,
  MONTH = 30,
}
export const TimeFilterValues = Object.values(TimeFilter).filter(Number.isInteger);
