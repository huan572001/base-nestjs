import { PipeTransform } from '@nestjs/common';
import { StringUtils } from 'libs/common/src/utils';

export class ParseAptosAddressPipe implements PipeTransform {
  transform(value: string): string {
    return StringUtils.toAptosAddress(value);
  }
}
