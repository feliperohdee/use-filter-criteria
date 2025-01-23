import { describe, it, expect } from 'vitest';
import { isStringArray, isNumberArray, objectContainKeys, stringify } from './util';

describe('/util', () => {
	describe('isStringArray', () => {
		it('should return true for array of strings', () => {
			expect(isStringArray(['a', 'b', 'c'])).toBe(true);
		});

		it('should return false for array with non-strings', () => {
			expect(isStringArray(['a', 1, 'c'])).toBe(false);
			expect(isStringArray([1, 2, 3])).toBe(false);
		});

		it('should return false for non-array values', () => {
			expect(isStringArray('not an array')).toBe(false);
			expect(isStringArray(123)).toBe(false);
			expect(isStringArray(null)).toBe(false);
			expect(isStringArray(undefined)).toBe(false);
			expect(isStringArray({})).toBe(false);
		});
	});

	describe('isNumberArray', () => {
		it('should return true for array of numbers', () => {
			expect(isNumberArray([1, 2, 3])).toBe(true);
		});

		it('should return false for array with non-numbers', () => {
			expect(isNumberArray([1, 'a', 3])).toBe(false);
			expect(isNumberArray(['a', 'b', 'c'])).toBe(false);
		});

		it('should return false for non-array values', () => {
			expect(isNumberArray('not an array')).toBe(false);
			expect(isNumberArray(123)).toBe(false);
			expect(isNumberArray(null)).toBe(false);
			expect(isNumberArray(undefined)).toBe(false);
			expect(isNumberArray({})).toBe(false);
		});
	});

	describe('objectContainKeys', () => {
		it('should return true when object contains all specified keys', () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(objectContainKeys(obj, ['a', 'b'])).toBe(true);
			expect(objectContainKeys(obj, ['a', 'b', 'c'])).toBe(true);
		});

		it('should return false when object is missing some keys', () => {
			const obj = { a: 1, b: 2 };
			expect(objectContainKeys(obj, ['a', 'b', 'c'])).toBe(false);
		});

		it('should return false for non-object values', () => {
			expect(objectContainKeys(null, ['a'])).toBe(false);
			expect(objectContainKeys(undefined, ['a'])).toBe(false);
			expect(objectContainKeys([], ['a'])).toBe(false);
			expect(objectContainKeys('string', ['a'])).toBe(false);
			expect(objectContainKeys(123, ['a'])).toBe(false);
		});
	});

	describe('stringify', () => {
		it('should return string representation of numbers', () => {
			expect(stringify(123)).toBe('123');
			expect(stringify(-456)).toBe('-456');
			expect(stringify(0)).toBe('0');
		});

		it('should return string representation of RegExp', () => {
			expect(stringify(/test/)).toBe('/test/');
			expect(stringify(/test/g)).toBe('/test/g');
		});

		it('should return string as is', () => {
			expect(stringify('hello')).toBe('hello');
			expect(stringify('')).toBe('');
		});

		it('should return JSON string for objects and arrays', () => {
			expect(stringify({ a: 1 })).toBe('{"a":1}');
			expect(stringify([1, 2, 3])).toBe('[1,2,3]');
			expect(stringify({ nested: { value: true } })).toBe('{"nested":{"value":true}}');
		});

		it('should handle null and undefined', () => {
			expect(stringify(null)).toBe('null');
			expect(stringify(undefined)).toBe('undefined');
		});
	});
});
