export const formatIndianCurrency = (num: number | string): string => {
  const parsed = Number(num);
  if (isNaN(parsed) || parsed === null || parsed === undefined) return '₹0';
  return '₹' + parsed.toLocaleString('en-IN');
};
