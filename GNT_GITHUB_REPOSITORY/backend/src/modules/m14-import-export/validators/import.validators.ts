import { ImportRow, FieldMapping, ValidationResult } from '../types/import.types';

export class ValidationEngine {
  private rules: Map<string, ValidatorRule[]> = new Map();

  addRule(field: string, rule: ValidatorRule) {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  validateRow(row: ImportRow, mappings: FieldMapping[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data: any = {};

    for (const mapping of mappings) {
      const value = row[mapping.sourceColumn];
      const fieldRules = this.rules.get(mapping.targetField) || [];

      // Required check
      if (mapping.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field "${mapping.targetField}" is required`);
        continue;
      }

      // Apply custom rules
      for (const rule of fieldRules) {
        const result = rule.validate(value, row);
        if (!result.valid) {
          if (rule.severity === 'error') {
            errors.push(result.message);
          } else {
            warnings.push(result.message);
          }
        }
      }

      // Transform if needed
      if (mapping.transform) {
        data[mapping.targetField] = this.applyTransform(value, mapping.transform);
      } else {
        data[mapping.targetField] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data
    };
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'uppercase': return String(value).toUpperCase();
      case 'lowercase': return String(value).toLowerCase();
      case 'trim': return String(value).trim();
      case 'number': return Number(value);
      case 'boolean': return ['true', '1', 'yes'].includes(String(value).toLowerCase());
      case 'date': return new Date(value);
      default: return value;
    }
  }

  static createEntityValidator(entityType: string): ValidationEngine {
    const engine = new ValidationEngine();

    switch (entityType) {
      case 'product':
        engine.addRule('name', { validate: (v) => ({ valid: String(v).length >= 2, message: 'Name must be at least 2 characters' }), severity: 'error' });
        engine.addRule('price', { validate: (v) => ({ valid: !isNaN(Number(v)) && Number(v) > 0, message: 'Price must be a positive number' }), severity: 'error' });
        engine.addRule('sku', { validate: (v) => ({ valid: /^[A-Z0-9-]+$/.test(String(v)), message: 'SKU must be alphanumeric' }), severity: 'error' });
        break;
      case 'customer':
        engine.addRule('email', { validate: (v) => ({ valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)), message: 'Invalid email format' }), severity: 'error' });
        engine.addRule('phone', { validate: (v) => ({ valid: /^[\d\s\-+()]{10,}$/.test(String(v)), message: 'Invalid phone number' }), severity: 'warning' });
        break;
      default:
        break;
    }

    return engine;
  }
}

interface ValidatorRule {
  validate: (value: any, row: ImportRow) => { valid: boolean; message: string };
  severity: 'error' | 'warning';
}
