export const rupeesToPaise = (value) => {
  if (!value) return undefined;
  return Math.round(parseFloat(value) * 100).toString();
};

export const paisaToRupee = (value) => {
  return (Number(value || 0) / 100).toFixed(2);
};
