const formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

export function formatMoney(value: number): string {
  return formatter.format(value);
}
