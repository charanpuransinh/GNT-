import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine } from '../validators/import.validators';
import { FieldMapping } from '../types/import.types';

describe('Import Validation Engine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  it('should validate required fields', () => {
    engine.addRule('name', {
      validate: (v) => ({ valid: String(v).length >= 2, message: 'Name too short' }),
      severity: 'error'
    });

    const mappings: FieldMapping[] = [
      { sourceColumn: 'Name', targetField: 'name', required: true }
    ];

    const result = engine.validateRow({ Name: '', _rowNumber: 1 }, mappings);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Field "name" is required');
  });

  it('should apply transforms', () => {
    const mappings: FieldMapping[] = [
      { sourceColumn: 'Name', targetField: 'name', required: false, transform: 'uppercase' }
    ];

    const result = engine.validateRow({ Name: 'test', _rowNumber: 1 }, mappings);
    expect(result.data.name).toBe('TEST');
  });

  it('should create entity validators', () => {
    const productValidator = ValidationEngine.createEntityValidator('product');
    const mappings: FieldMapping[] = [
      { sourceColumn: 'Price', targetField: 'price', required: true }
    ];

    const result = productValidator.validateRow({ Price: '-10', _rowNumber: 1 }, mappings);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Price'))).toBe(true);
  });
});
