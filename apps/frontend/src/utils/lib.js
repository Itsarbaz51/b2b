export const rupeesToPaise = (value) => {
  if (!value) return undefined;
  return Math.round(parseFloat(value) * 100).toString();
};
