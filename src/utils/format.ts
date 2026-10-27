import { CATEGORIES } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function getCategoryDetails(categoryName: string, type: 'income' | 'expense' = 'expense') {
  const match = CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match;

  return {
    id: 'custom',
    name: categoryName,
    type,
    icon: type === 'income' ? 'wallet-outline' : 'pricetag-outline',
    color: type === 'income' ? '#10B981' : '#64748B',
  };
}
