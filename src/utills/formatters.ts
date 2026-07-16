export const formatIndianCurrency = (num: number | string): string => {
  const parsed = Number(num);
  if (isNaN(parsed) || parsed === null || parsed === undefined) return '₹0';
  
  if (parsed >= 10000000) {
    return '₹' + (parsed / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  } else if (parsed >= 100000) {
    return '₹' + (parsed / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  } else if (parsed >= 10000) {
    return '₹' + parsed.toLocaleString('en-IN');
  } else {
    return '₹' + parsed.toLocaleString('en-IN');
  }
};
