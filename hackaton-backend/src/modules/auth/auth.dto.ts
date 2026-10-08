import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8; // Igual que las credenciales demo (Admin123!)

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .transform((email) => email.toLowerCase()),
    password: z.string().min(1),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
      .max(128),
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'La contraseña nueva debe ser distinta',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
