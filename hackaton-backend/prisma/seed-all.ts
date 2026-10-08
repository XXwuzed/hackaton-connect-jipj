import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Orden obligatorio: los mocks dependen de la empresa, zona, tienda y productos del seed base.
const STEPS = [
  './seed.ts',
  './mock/load-customers.ts',
  './mock/load-redeemables.ts',
  './mock/load-prizes.ts',
  './mock/load-sales.ts',
];

/** Ejecuta el seed base y todos los mocks en secuencia, heredando el entorno. */
function main(): void {
  for (const step of STEPS) {
    execFileSync(
      process.execPath,
      ['--import', 'tsx', fileURLToPath(new URL(step, import.meta.url))],
      { stdio: 'inherit' },
    );
  }
}

main();
