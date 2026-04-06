import { BadRequestException } from '@nestjs/common';

function message(field: string, text: string): never {
  throw new BadRequestException(`${field} ${text}`);
}

export function asRecord(value: unknown, label = 'body'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function requiredString(
  input: Record<string, unknown>,
  field: string,
  options?: { min?: number; max?: number },
): string {
  const value = input[field];

  if (typeof value !== 'string') {
    message(field, 'is required');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    message(field, 'is required');
  }

  if (options?.min && trimmed.length < options.min) {
    message(field, `must be at least ${options.min} characters`);
  }

  if (options?.max && trimmed.length > options.max) {
    message(field, `must be at most ${options.max} characters`);
  }

  return trimmed;
}

export function optionalString(
  input: Record<string, unknown>,
  field: string,
  options?: { max?: number },
): string | undefined {
  const value = input[field];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    message(field, 'must be a string');
  }

  const trimmed = value.trim();

  if (options?.max && trimmed.length > options.max) {
    message(field, `must be at most ${options.max} characters`);
  }

  return trimmed;
}

export function email(input: Record<string, unknown>, field: string): string {
  const value = requiredString(input, field, { max: 120 }).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    message(field, 'must be a valid email');
  }

  return value;
}

export function enumValue<T extends string>(
  input: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = requiredString(input, field) as T;

  if (!allowed.includes(value)) {
    message(field, `must be one of: ${allowed.join(', ')}`);
  }

  return value;
}

export function positiveInt(
  input: Record<string, unknown>,
  field: string,
  options?: { min?: number; max?: number },
): number {
  const value = input[field];

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    message(field, 'must be an integer');
  }

  if (value <= 0) {
    message(field, 'must be greater than 0');
  }

  if (options?.min && value < options.min) {
    message(field, `must be at least ${options.min}`);
  }

  if (options?.max && value > options.max) {
    message(field, `must be at most ${options.max}`);
  }

  return value;
}

export function stringArray(
  input: Record<string, unknown>,
  field: string,
  allowed?: readonly string[],
): string[] | undefined {
  const value = input[field];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const items =
    Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : undefined;

  if (!items) {
    message(field, 'must be an array of strings');
  }

  const cleaned = items.map((item) => {
    if (typeof item !== 'string') {
      message(field, 'must contain only strings');
    }

    return item.trim();
  });

  if (allowed) {
    const invalid = cleaned.filter((item) => !allowed.includes(item));

    if (invalid.length) {
      message(field, `contains invalid values: ${invalid.join(', ')}`);
    }
  }

  return cleaned;
}

export function optionalBoolean(input: Record<string, unknown>, field: string): boolean | undefined {
  const value = input[field];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  message(field, 'must be a boolean');
}
