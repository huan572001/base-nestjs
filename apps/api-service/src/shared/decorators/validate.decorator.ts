import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { StringUtils } from 'libs/common/src/utils';

export function IsAptosAddress(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string): void {
    registerDecorator({
      name: 'isAptosAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: string, args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          try {
            StringUtils.toAptosAddress(value);
            return true;
          } catch (e) {
            return false;
          }
        },
        defaultMessage(): string {
          return `The provided value is not a valid Aptos address`;
        },
      },
    });
  };
}
