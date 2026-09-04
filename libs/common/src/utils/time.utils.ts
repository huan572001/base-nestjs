/**
 * Delay for a given time
 * @param time Time to delay in milliseconds
 * @returns Promise
 */
export function delay(time: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, time));
}
