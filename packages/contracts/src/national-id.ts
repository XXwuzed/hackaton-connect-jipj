import { z } from 'zod';

/** Valida la cédula ecuatoriana (módulo 10), nunca un RUC. */
export function isValidNationalId(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const province = Number(value.slice(0, 2));
  if (province < 1 || province > 24 || digits[2]! >= 6) return false;
  const sum = digits.slice(0, 9).reduce((total, digit, index) => {
    const weighted = digit * (index % 2 === 0 ? 2 : 1);
    return total + (weighted > 9 ? weighted - 9 : weighted);
  }, 0);
  return (10 - (sum % 10)) % 10 === digits[9];
}

export const nationalIdSchema = z.string().refine(isValidNationalId, {
  message: 'Cédula inválida',
});
