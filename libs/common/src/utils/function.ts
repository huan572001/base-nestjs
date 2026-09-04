import { BigNumber } from 'bignumber.js';

export function calculatePriceFromSqrtPrice(
  sqrtPrice: string | number,
  decimalsToken1: number,
  decimalsToken2: number,
): number {
  return new BigNumber(sqrtPrice)
    .pow(2)
    .div(new BigNumber(2).pow(128))
    .times(Math.pow(10, decimalsToken1 - decimalsToken2))
    .toNumber();
}

export const convertValueToDecimals = (value: number | string, decimals: number): string => {
  const valueBigNumber = typeof value === 'string' ? new BigNumber(value) : new BigNumber(Number(value));
  const multiplier = new BigNumber(10).exponentiatedBy(decimals);

  const result = valueBigNumber.multipliedBy(multiplier);

  return result.toString();
};

export const convertValueWithDecimals = (value: number | string, decimals: number): string => {
  const valueBigNumber = typeof value === 'string' ? new BigNumber(value) : new BigNumber(Number(value));
  const divisor = new BigNumber(10).exponentiatedBy(decimals);

  const result = valueBigNumber.dividedBy(divisor);

  return result.toString();
};

export const getPreviousTimestamps = (count: number, startDate: number, step: number): number[] => {
  const dates: number[] = [];

  for (let i = 0; i < count; i++) {
    const date = startDate - i * step;
    dates.push(date);
  }

  return dates;
};

export const stringToHex = (str: string) => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const hexValue = charCode.toString(16);

    // Pad with zeros to ensure two-digit representation
    hex += hexValue.padStart(2, '0');
  }
  return hex;
};
export const stringToHexString = (str: string) => {
  return Array.from(new TextEncoder().encode(str))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};
export const getLastAlignedInterval = (interval: number) => {
  const now = Date.now();

  const alignedTime = now - (now % interval);
  return alignedTime;
};

export function sumFloorDividedBy(array: number[], divisor: number): number {
  return array.reduce((sum, value) => sum + Math.floor(value / divisor), 0);
}
