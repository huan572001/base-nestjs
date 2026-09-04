import { AccountAddress } from '@aptos-labs/ts-sdk';

export class StringUtils {
  /**
   * Check is Json type
   * @param str String
   * @returns Is Json type
   */
  public static isJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static isString(value: unknown): boolean {
    return typeof value === 'string';
  }

  /**
   * Remove all line break and trim
   * @param str Snake case string
   * @returns string
   * @note Windows would be \r\n, but Linux just uses \n and Apple uses \r.
   */
  public static trim(str: string): string {
    if (!str) {
      return '';
    }

    return str.replace(/^\s+|\s+$|(\r\n|\n|\r)/gm, '');
  }

  public static stringToHex(str: string): string {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const hexValue = charCode.toString(16);

      // Pad with zeros to ensure two-digit representation
      hex += hexValue.padStart(2, '0');
    }
    return hex;
  }

  public static toAptosAddress(address: string): string {
    return AccountAddress.fromString(address).toString();
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  }

  public static hexToString(hex: string): string {
    return Buffer.from(hex.replace(/^0x/, ''), 'hex').toString('utf8');
  }
}
