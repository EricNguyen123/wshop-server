import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Match decorator implementation
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          const relatedValue =
            typeof args.object === 'object' && args.object !== null
              ? ((args.object as Record<string, any>)[relatedPropertyName] as string | undefined)
              : undefined;
          return value === relatedValue;
        },
      },
    });
  };
}
