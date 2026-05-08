export function formatPrice(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '정보 없음';
  }

  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

export function formatWeight(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '정보 없음';
  }

  return `${new Intl.NumberFormat('ko-KR').format(value)}g`;
}

export function formatPricePer100g(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '100g당 정보 없음';
  }

  return `100g당 ${formatPrice(value)}`;
}
