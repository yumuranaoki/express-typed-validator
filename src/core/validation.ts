export interface IValidator<T> {
  validate: (obj: unknown) => ValidationResult<T>;
}

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ErrorDetail[];
    };

export type ErrorDetail = {
  message: string;
  path: (string | number)[];
};
