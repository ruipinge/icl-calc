export const getClassName = ({
  error,
  touched,
  base = ['form-control'],
  invalid = ['is-invalid'],
  valid = []
}: {
  error?: string;
  touched?: boolean;
  base?: Array<string>;
  invalid?: Array<string>;
  valid?: Array<string>;
}): string => [...base, ...(error && touched ? invalid : valid)].join(' ');
