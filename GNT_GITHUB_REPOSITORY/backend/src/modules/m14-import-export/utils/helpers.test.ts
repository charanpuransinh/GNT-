// M14 — Helpers ki jaanch (pure functions)
import { test, expect } from 'vitest';
import { slugify, formatFileSize, parseCSVLine, generateId, deepClone } from './helpers';

test('slugify: lowercase + non-alphanumeric ko dash, kone ke dash hata', () => {
  expect(slugify('Hello World')).toBe('hello-world');
  expect(slugify('  GST & INVOICE  ')).toBe('gst-invoice');
  expect(slugify('ABC')).toBe('abc');
});

test('formatFileSize: B/KB/MB/GB sahi', () => {
  expect(formatFileSize(0)).toBe('0 B');
  expect(formatFileSize(512)).toBe('512 B');
  expect(formatFileSize(1024)).toBe('1 KB');
  expect(formatFileSize(1048576)).toBe('1 MB');
  expect(formatFileSize(1073741824)).toBe('1 GB');
});

test('parseCSVLine: simple + comma-inside-quotes + custom delimiter', () => {
  expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  expect(parseCSVLine('"a,b",c')).toEqual(['a,b', 'c']);
  expect(parseCSVLine('a|b|c', '|')).toEqual(['a', 'b', 'c']);
});

test('generateId: prefix ke saath unique id', () => {
  const id = generateId('imp');
  expect(id.startsWith('imp-')).toBe(true);
  expect(generateId('imp')).not.toBe(id);
});

test('deepClone: asli deep copy (andar wala object alag)', () => {
  const obj = { a: { b: 1 }, list: [1, 2] };
  const copy = deepClone(obj);
  copy.a.b = 2;
  copy.list.push(3);
  expect(obj.a.b).toBe(1);
  expect(obj.list).toEqual([1, 2]);
});
