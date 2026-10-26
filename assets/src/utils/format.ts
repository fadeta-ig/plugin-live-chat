export const formatRupiah = (amount: number): string => amount.toLocaleString('id-ID');

export const formatClock = (date: Date): string =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
