/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — FIELD MAPPER                            ║
 * ║  Lock Artifact #14 — Field Mapping & Validation Engine       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { FieldMapping, ValidationRule, ImportError } from '../types/importExport.types';

// ── Apply Field Mapping ──
export const applyFieldMapping = (
  row: Record<string, any>,
  mapping: FieldMapping[]
): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const map of mapping) {
    let value = row[map.sourceField];

    // Apply default if empty
    if ((value === undefined || value === null || value === '') && map.defaultValue !== undefined) {
      value = map.defaultValue;
    }

    // Apply transform
    if (map.transform && value !== undefined) {
      value = applyTransform(value, map.transform);
    }

    result[map.targetField] = value;
  }

  return result;
};

// ── Apply Transform ──
const applyTransform = (value: any, transform: string): any => {
  const [fn, ...args] = transform.split(':');

  switch (fn) {
    case 'uppercase':
      return String(value).toUpperCase();
    case 'lowercase':
      return String(value).toLowerCase();
    case 'trim':
      return String(value).trim();
    case 'date':
      return formatDate(value, args[0] || 'YYYY-MM-DD');
    case 'number':
      return parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    case 'boolean':
      return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
    case 'concat':
      return args.join(':').replace(/\{\{(.+?)\}\}/g, (_, key) => value[key] || '');
    case 'split':
      return String(value).split(args[0] || ',');
    case 'lookup':
      // In production: query lookup table
      return value;
    case 'regex':
      const match = String(value).match(new RegExp(args[0], args[1] || ''));
      return match ? match[0] : value;
    default:
      return value;
  }
};

// ── Format Date ──
const formatDate = (value: any, format: string): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  const pad = (n: number) => String(n).padStart(2, '0');

  return format
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
};

// ── Validate Row ──
export const validateRow = (
  row: Record<string, any>,
  rules: ValidationRule[],
  rowNumber: number
): ImportError[] => {
  const errors: ImportError[] = [];

  for (const rule of rules) {
    const value = row[rule.field];
    const isValid = validateField(value, rule);

    if (!isValid) {
      errors.push({
        rowNumber,
        field: rule.field,
        value,
        error: rule.errorMessage || `Validation failed for ${rule.field}`,
        severity: 'error',
      });
    }
  }

  return errors;
};

// ── Validate Single Field ──
const validateField = (value: any, rule: ValidationRule): boolean => {
  switch (rule.rule) {
    case 'required':
      return value !== undefined && value !== null && value !== '';

    case 'email':
      if (!value) return true; // skip if empty (use required for mandatory)
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

    case 'unique':
      // In production: check against database
      return true;

    case 'regex':
      if (!value) return true;
      return new RegExp(rule.config.pattern).test(String(value));

    case 'range':
      if (value === undefined || value === null || value === '') return true;
      const num = parseFloat(String(value));
      const min = rule.config.min;
      const max = rule.config.max;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;

    case 'enum':
      if (!value) return true;
      return rule.config.values.includes(value);

    case 'length':
      if (!value) return true;
      const len = String(value).length;
      const minLen = rule.config.min;
      const maxLen = rule.config.max;
      if (minLen !== undefined && len < minLen) return false;
      if (maxLen !== undefined && len > maxLen) return false;
      return true;

    case 'custom':
      // In production: execute custom validation function
      return true;

    default:
      return true;
  }
};

// ── Auto-Detect Mapping ──
export const autoDetectMapping = (
  headers: string[],
  entityFields: string[]
): FieldMapping[] => {
  const mappings: FieldMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match
    let match = entityFields.find(f => f.toLowerCase() === normalized);

    // Fuzzy match
    if (!match) {
      match = entityFields.find(f => {
        const fn = f.toLowerCase().replace(/[^a-z0-9]/g, '');
        return fn.includes(normalized) || normalized.includes(fn);
      });
    }

    // Common aliases
    if (!match) {
      const aliases: Record<string, string[]> = {
        email: ['emailaddress', 'emailaddr', 'mail'],
        phone: ['phonenumber', 'mobile', 'tel', 'telephone'],
        name: ['fullname', 'customername', 'clientname'],
        firstName: ['fname', 'firstname', 'givenname'],
        lastName: ['lname', 'lastname', 'surname', 'familyname'],
      };

      for (const [field, aliasList] of Object.entries(aliases)) {
        if (aliasList.includes(normalized) || normalized.includes(field.toLowerCase())) {
          match = entityFields.find(f => f === field);
          break;
        }
      }
    }

    if (match && !usedFields.has(match)) {
      usedFields.add(match);
      mappings.push({
        sourceField: header,
        targetField: match,
        required: false,
      });
    }
  }

  return mappings;
};

// ── Validate Mapping ──
export const validateMapping = (
  mapping: FieldMapping[],
  requiredFields: string[]
): { valid: boolean; missing: string[] } => {
  const mappedTargets = new Set(mapping.map(m => m.targetField));
  const missing = requiredFields.filter(f => !mappedTargets.has(f));

  return {
    valid: missing.length === 0,
    missing,
  };
};
