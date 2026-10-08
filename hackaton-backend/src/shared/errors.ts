/** Error HTTP controlado con código estable. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Recurso inexistente. */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(404, 'NOT_FOUND', message);
  }
}

/** Rechaza credenciales o tokens no válidos. */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/** Rechaza una acción sin el permiso necesario. */
export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado', code = 'FORBIDDEN') {
    super(403, code, message);
  }
}

/** Rechaza entradas con formato inválido. */
export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

/** Indica una regla de negocio en conflicto con el estado actual. */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, code, message);
  }
}
