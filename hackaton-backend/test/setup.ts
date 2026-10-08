// La prueba HTTP solo puede escribir en la base reservada para tests.
if (process.env.RUN_DB_TESTS === '1') {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || new URL(databaseUrl).pathname !== '/club_test') {
    throw new Error('RUN_DB_TESTS requiere DATABASE_URL apuntando a club_test');
  }
}
