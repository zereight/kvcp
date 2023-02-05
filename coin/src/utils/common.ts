export const isArray = Array.isArray;

export const isNumber = (subject: any) =>
  typeof subject === "number" &&
  // is not NaN: `NaN === NaN` => `false`
  subject === subject;
