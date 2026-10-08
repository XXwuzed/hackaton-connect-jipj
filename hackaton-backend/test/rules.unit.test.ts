import { describe, expect, it } from 'vitest';
import { isValidNationalId, nationalIdSchema } from '@club/contracts';
import { createRedemptionSchema } from '../src/modules/redemptions/redemptions.dto';
import { createRollSchema } from '../src/modules/dice/dice.dto';
import { updateProductSchema } from '../src/modules/products/products.dto';
import { createUserSchema } from '../src/modules/users/users.dto';
import { dateSchema } from '../src/shared/queries';
import { startOfMonthGuayaquil, endOfMonthGuayaquil } from '../src/shared/time';

const id = '11111111-1111-4111-8111-111111111111';
describe('reglas sin base de datos', () => {
  it('acepta cédula ecuatoriana y rechaza checksum, RUC y provincia inválidos', () => {
    expect(isValidNationalId('2451234567')).toBe(true);
    expect(nationalIdSchema.safeParse('2451234568').success).toBe(false);
    expect(nationalIdSchema.safeParse('2451234567001').success).toBe(false);
    expect(nationalIdSchema.safeParse('9951234567').success).toBe(false);
  });
  it('restringe cada solicitud de canje a 1–2 productos', () => {
    expect(
      createRedemptionSchema.safeParse({ customerId: id, productIds: [id] })
        .success,
    ).toBe(true);
    expect(
      createRedemptionSchema.safeParse({
        customerId: id,
        productIds: [id, id, id],
      }).success,
    ).toBe(false);
  });
  it('rechaza isWinner enviado por el cliente y compras de hasta diez dólares', () => {
    const valid = {
      customerId: id,
      purchasedItems: [{ productId: id, quantity: 1 }],
      purchaseAmount: 10.01,
      die1: 6,
      die2: 6,
    };
    expect(createRollSchema.safeParse(valid).success).toBe(true);
    expect(
      createRollSchema.safeParse({ ...valid, purchaseAmount: 10 }).success,
    ).toBe(false);
    expect(
      createRollSchema.safeParse({ ...valid, isWinner: true }).success,
    ).toBe(false);
  });
  it('solo permite imagen y descripción del catálogo', () => {
    expect(updateProductSchema.safeParse({ description: 'Dato' }).success).toBe(
      true,
    );
    expect(
      updateProductSchema.safeParse({ imageKey: 'products/photo.webp' })
        .success,
    ).toBe(true);
    expect(
      updateProductSchema.safeParse({ imageKey: 'other/photo.webp' }).success,
    ).toBe(false);
    expect(updateProductSchema.safeParse({ name: 'Cambiar' }).success).toBe(
      false,
    );
    expect(updateProductSchema.safeParse({ pvp: 1 }).success).toBe(false);
  });
  it('valida fecha y límites de mes de Guayaquil', () => {
    expect(dateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(
      startOfMonthGuayaquil(new Date('2026-10-01T03:00:00Z')).toISOString(),
    ).toBe('2026-09-01T05:00:00.000Z');
    expect(
      endOfMonthGuayaquil(new Date('2026-10-01T05:00:00Z')).toISOString(),
    ).toBe('2026-11-01T04:59:59.999Z');
  });
  it('exige datos de rol y ámbito en creación de usuario', () => {
    expect(
      createUserSchema.safeParse({
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
        role: 'ADVISOR',
        companyId: null,
        zoneId: null,
        storeId: null,
      }).success,
    ).toBe(false);
  });
});
