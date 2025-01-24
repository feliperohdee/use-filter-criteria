import _ from 'lodash';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import DataLoader from 'use-data-loader';

import FilterCriteria from './index';

const testData = [
	{
		active: true,
		age: 25,
		createdAt: '2023-01-01T00:00:00Z',
		id: 1,
		location: { lat: 40.7128, lng: -74.006 },
		map: new Map([['key-1', 'value-1']]),
		name: 'John Doe',
		null: null,
		obj: { a: 1 },
		tags: ['developer', 'javascript'],
		tagsSet: new Set(['developer', 'javascript'])
	},
	{
		active: false,
		age: 30,
		createdAt: '2023-03-01T00:00:00Z',
		id: 2,
		location: { lat: 34.0522, lng: -118.2437 },
		map: new Map([['key-2', 'value-2']]),
		name: 'Jane Smith',
		null: null,
		obj: { a: 2 },
		tags: ['designer', 'ui/ux'],
		tagsSet: new Set(['designer', 'ui/ux'])
	},
	{
		active: true,
		age: 35,
		createdAt: '2023-06-01T00:00:00Z',
		id: 3,
		location: { lat: 51.5074, lng: -0.1278 },
		map: new Map([['key-3', 'value-3']]),
		name: 'John Smith',
		null: null,
		obj: { a: 3 },
		tags: ['developer', 'python'],
		tagsSet: new Set(['developer', 'python'])
	}
];

describe('/index', () => {
	beforeEach(() => {
		FilterCriteria.savedCriteria.clear();
	});

	describe('match', () => {
		it('should return by filter group with AND', async () => {
			const input = FilterCriteria.filterGroup({
				operator: 'AND',
				filters: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								matchValue: 'jo_hn',
								operator: 'CONTAINS',
								type: 'STRING',
								valuePath: ['name']
							},
							{
								matchValue: 'john',
								operator: 'CONTAINS',
								type: 'STRING',
								valuePath: ['name']
							}
						]
					};
				})
			});

			const res = await Promise.all([FilterCriteria.match(testData[0], input, false), FilterCriteria.match(testData[0], input, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				operator: 'AND',
				passed: true,
				reason: 'Filter group "AND" check PASSED',
				results: _.times(2, () => {
					return {
						operator: 'OR',
						passed: true,
						reason: 'Filter "OR" check PASSED',
						results: [
							{
								matchValue: 'jo_hn',
								passed: false,
								reason: 'String criteria "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								matchValue: 'john',
								passed: true,
								reason: 'String criteria "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						]
					};
				})
			});
		});

		it('should return by filter group with OR', async () => {
			const input = FilterCriteria.filterGroup({
				operator: 'OR',
				filters: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								matchValue: 'jo_hn',
								operator: 'CONTAINS',
								type: 'STRING',
								valuePath: ['name']
							},
							{
								matchValue: 'john',
								operator: 'CONTAINS',
								type: 'STRING',
								valuePath: ['name']
							}
						]
					};
				})
			});

			const res = await Promise.all([FilterCriteria.match(testData[0], input, false), FilterCriteria.match(testData[0], input, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				operator: 'OR',
				passed: true,
				reason: 'Filter group "OR" check PASSED',
				results: _.times(2, () => {
					return {
						operator: 'OR',
						passed: true,
						reason: 'Filter "OR" check PASSED',
						results: [
							{
								matchValue: 'jo_hn',
								passed: false,
								reason: 'String criteria "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								matchValue: 'john',
								passed: true,
								reason: 'String criteria "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						]
					};
				})
			});
		});

		it('should return by filter', async () => {
			const input = FilterCriteria.filter({
				operator: 'OR',
				criteria: [
					{
						matchValue: 'jo_hn',
						operator: 'CONTAINS',
						type: 'STRING',
						valuePath: ['name']
					},
					{
						matchValue: 'john',
						operator: 'CONTAINS',
						type: 'STRING',
						valuePath: ['name']
					}
				]
			});

			const res = await Promise.all([FilterCriteria.match(testData[0], input, false), FilterCriteria.match(testData[0], input, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				operator: 'OR',
				passed: true,
				reason: 'Filter "OR" check PASSED',
				results: [
					{
						matchValue: 'jo_hn',
						passed: false,
						reason: 'String criteria "CONTAINS" check FAILED',
						value: 'john-doe'
					},
					{
						matchValue: 'john',
						passed: true,
						reason: 'String criteria "CONTAINS" check PASSED',
						value: 'john-doe'
					}
				]
			});
		});

		it('should return by criteria', async () => {
			const input = FilterCriteria.criteria({
				matchValue: 'john',
				operator: 'CONTAINS',
				type: 'STRING',
				valuePath: ['name']
			});

			const res = await Promise.all([FilterCriteria.match(testData[0], input, false), FilterCriteria.match(testData[0], input, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				matchValue: 'john',
				passed: true,
				reason: 'String criteria "CONTAINS" check PASSED',
				value: 'john-doe'
			});
		});
	});

	describe('matchMany', () => {
		describe('complex filters', () => {
			it('should handle nested AND/OR combinations', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: [
						{
							operator: 'AND',
							criteria: [
								{
									matchValue: true,
									operator: 'EQUALS',
									type: 'BOOLEAN',
									valuePath: ['active']
								}
							]
						},
						{
							operator: 'OR',
							criteria: [
								{
									matchValue: 'John',
									operator: 'CONTAINS',
									type: 'STRING',
									valuePath: ['name']
								},
								{
									matchValue: 30,
									operator: 'LESS',
									type: 'NUMBER',
									valuePath: ['age']
								}
							]
						}
					]
				});

				const res = await FilterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});

			it('should handle nested OR/AND combinations', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'OR',
					filters: [
						{
							operator: 'AND',
							criteria: [
								{
									matchValue: true,
									operator: 'EQUALS',
									type: 'BOOLEAN',
									valuePath: ['active']
								}
							]
						},
						{
							operator: 'OR',
							criteria: [
								{
									matchValue: 'John',
									operator: 'CONTAINS',
									type: 'STRING',
									valuePath: ['name']
								},
								{
									matchValue: 30,
									operator: 'LESS',
									type: 'NUMBER',
									valuePath: ['age']
								}
							]
						}
					]
				});

				const res = await FilterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});

			it('should handle multiple CUSTOM criteria using dataloader and concurrency', async () => {
				const fn = vi.fn(async users => {
					return _.map(users, () => {
						return true;
					});
				});

				const userLoader = new DataLoader(fn);
				const predicate = vi.fn(user => {
					return userLoader.load(user.id);
				});

				const input = FilterCriteria.filter({
					operator: 'AND',
					criteria: [
						{
							predicate,
							type: 'CUSTOM'
						},
						{
							predicate,
							type: 'CUSTOM'
						}
					]
				});

				const res = await FilterCriteria.matchMany(testData, input, 2);

				expect(fn).toHaveBeenCalledTimes(2);
				expect(fn).toHaveBeenCalledWith([1, 2]);
				expect(fn).toHaveBeenCalledWith([3]);

				expect(res).toHaveLength(3);
			});
		});

		describe('default values', () => {
			it('should use defaultValue when field is missing', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: [
						{
							operator: 'AND',
							criteria: [
								{
									defaultValue: 40,
									matchValue: 30,
									operator: 'GREATER-OR-EQUALS',
									type: 'NUMBER',
									valuePath: ['missing']
								}
							]
						}
					]
				});

				const res = await FilterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(3);
			});

			it('should return false when field is missing and no defaultValue', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: [
						{
							operator: 'AND',
							criteria: [
								{
									matchValue: 30,
									operator: 'GREATER-OR-EQUALS',
									type: 'NUMBER',
									valuePath: ['missing']
								}
							]
						}
					]
				});

				const res = await FilterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(0);
			});
		});
	});

	describe('applyCriteria', () => {
		it('should handle dynamic matchValue', async () => {
			const criteria = FilterCriteria.criteria({
				matchValue: { $path: ['tags'] },
				operator: 'EXACTLY-MATCHES',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				matchValue: JSON.stringify(['developer', 'javascript']),
				passed: true,
				reason: 'Array criteria "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle custom matchValue', async () => {
			const matchValue = vi.fn(value => {
				return value.tags;
			});

			const criteria = FilterCriteria.criteria({
				matchValue,
				operator: 'EXACTLY-MATCHES',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(matchValue).toHaveBeenCalledWith(testData[0]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				matchValue: JSON.stringify(['developer', 'javascript']),
				passed: true,
				reason: 'Array criteria "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle empty valuePath', async () => {
			const criteria = FilterCriteria.criteria({
				operator: 'NOT-UNDEFINED',
				type: 'BOOLEAN',
				valuePath: []
			});

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				matchValue: 'null',
				passed: true,
				reason: 'Boolean criteria "NOT-UNDEFINED" check PASSED',
				value: testData[0]
			});
		});

		it('should handle valueTransformer', async () => {
			const valueTransformer = vi.fn(value => {
				return value.name;
			});

			const criteria = FilterCriteria.criteria({
				operator: 'NOT-UNDEFINED',
				type: 'BOOLEAN',
				valuePath: [],
				valueTransformer
			});

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(valueTransformer).toHaveBeenCalledWith(testData[0]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				matchValue: 'null',
				passed: true,
				reason: 'Boolean criteria "NOT-UNDEFINED" check PASSED',
				value: 'John Doe'
			});
		});

		it('should handle inexistent criteria', async () => {
			const criteria = FilterCriteria.criteria({
				matchValue: 'john',
				normalize: false,
				operator: 'CONTAINS',
				// @ts-expect-error
				type: 'INEXISTENT',
				valuePath: ['name']
			});

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(false);
			expect(res[1]).toEqual({
				matchValue: 'john',
				passed: false,
				reason: 'Unknown criteria type',
				value: 'John Doe'
			});
		});

		describe('array', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'ARRAY',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['Develóper', 'JavaScript'],
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Array criteria "EXACTLY-MATCHES" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = false', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['Develóper', 'JavaScript'],
					normalize: false,
					operator: 'EXACTLY-MATCHES',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['Develóper', 'JavaScript']),
					passed: false,
					reason: 'Array criteria "EXACTLY-MATCHES" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize function', async () => {
				const normalize = vi.fn(() => {
					return ['developer', 'javascript'];
				});

				const criteria = FilterCriteria.criteria({
					matchValue: ['Develóper', 'JavaScript'],
					normalize,
					operator: 'EXACTLY-MATCHES',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(normalize).toHaveBeenCalledWith(['Develóper', 'JavaScript']);
				expect(normalize).toHaveBeenCalledWith(['developer', 'javascript']);
				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Array criteria "EXACTLY-MATCHES" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle HAS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'developer',
					operator: 'HAS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'Array criteria "HAS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES-ALL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'INCLUDES-ALL',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Array criteria "INCLUDES-ALL" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES-ANY operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'inexistent'],
					operator: 'INCLUDES-ANY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'inexistent']),
					passed: true,
					reason: 'Array criteria "INCLUDES-ANY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle HAS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'developer',
					operator: 'HAS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'Array criteria "HAS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Array criteria "IS-EMPTY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Array criteria "NOT-EMPTY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-INCLUDES-ALL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'NOT-INCLUDES-ALL',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'Array criteria "NOT-INCLUDES-ALL" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-INCLUDES-ANY operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'inexistent'],
					operator: 'NOT-INCLUDES-ANY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'inexistent']),
					passed: false,
					reason: 'Array criteria "NOT-INCLUDES-ANY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-EQUALS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Array criteria "SIZE-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-GREATER',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Array criteria "SIZE-GREATER" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-GREATER-OR-EQUALS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Array criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 3,
					operator: 'SIZE-LESS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '3',
					passed: true,
					reason: 'Array criteria "SIZE-LESS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-LESS-OR-EQUALS',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Array criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});
		});

		describe('boolean', () => {
			it('should handle EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'EQUALS',
					type: 'BOOLEAN',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'Boolean criteria "EQUALS" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle IS-FALSE operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: false,
					operator: 'IS-FALSE',
					type: 'BOOLEAN',
					valuePath: ['active']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'false',
					passed: false,
					reason: 'Boolean criteria "IS-FALSE" check FAILED',
					value: true
				});
			});

			it('should handle IS-FALSY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-FALSY',
					type: 'BOOLEAN',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Boolean criteria "IS-FALSY" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle IS-NIL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-NIL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Boolean criteria "IS-NIL" check PASSED',
					value: null
				});
			});

			it('should handle IS-NULL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-NULL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Boolean criteria "IS-NULL" check PASSED',
					value: null
				});
			});

			it('should handle IS-TRUE operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-TRUE',
					type: 'BOOLEAN',
					valuePath: ['active']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Boolean criteria "IS-TRUE" check PASSED',
					value: true
				});
			});

			it('should handle IS-TRUTHY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-TRUTHY',
					type: 'BOOLEAN',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Boolean criteria "IS-TRUTHY" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle IS-UNDEFINED operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-UNDEFINED',
					type: 'BOOLEAN',
					valuePath: ['inexistent']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Boolean criteria "IS-UNDEFINED" check PASSED',
					value: undefined
				});
			});

			it('should handle NOT-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'NOT-EQUALS',
					type: 'BOOLEAN',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: false,
					reason: 'Boolean criteria "NOT-EQUALS" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle NOT-NIL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-NIL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Boolean criteria "NOT-NIL" check FAILED',
					value: null
				});
			});

			it('should handle NOT-NULL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-NULL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Boolean criteria "NOT-NULL" check FAILED',
					value: null
				});
			});

			it('should handle NOT-UNDEFINED operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-UNDEFINED',
					type: 'BOOLEAN',
					valuePath: ['inexistent']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Boolean criteria "NOT-UNDEFINED" check FAILED',
					value: undefined
				});
			});

			it('should handle STRICT-EQUAL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'STRICT-EQUAL',
					type: 'BOOLEAN',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: false,
					reason: 'Boolean criteria "STRICT-EQUAL" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle STRICT-NOT-EQUAL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'STRICT-NOT-EQUAL',
					type: 'BOOLEAN',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'Boolean criteria "STRICT-NOT-EQUAL" check PASSED',
					value: { a: 1 }
				});
			});
		});

		describe('custom', () => {
			it('should handle', async () => {
				const predicate = vi.fn(async value => {
					return _.startsWith(value.name, 'John');
				});

				const criteria = FilterCriteria.criteria({
					predicate,
					type: 'CUSTOM'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(predicate).toHaveBeenCalledWith(testData[0], null);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Custom predicate check PASSED',
					value: testData[0]
				});
			});

			it('should handle with matchValue', async () => {
				const predicate = vi.fn(async (value, matchValue) => {
					return _.startsWith(value.name, matchValue);
				});

				const criteria = FilterCriteria.criteria({
					matchValue: 'John',
					predicate,
					type: 'CUSTOM'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(predicate).toHaveBeenCalledWith(testData[0], 'John');

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'John',
					passed: true,
					reason: 'Custom predicate check PASSED',
					value: testData[0]
				});
			});

			it('should handle with matchValue function', async () => {
				const matchValue = vi.fn(() => {
					return 'John';
				});

				const predicate = vi.fn(async (value, matchValue) => {
					return _.startsWith(value.name, matchValue);
				});

				const criteria = FilterCriteria.criteria({
					matchValue,
					predicate,
					type: 'CUSTOM'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(matchValue).toHaveBeenCalledWith(testData[0]);
				expect(predicate).toHaveBeenCalledWith(testData[0], 'John');

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'John',
					passed: true,
					reason: 'Custom predicate check PASSED',
					value: testData[0]
				});
			});
		});

		describe('criteria', () => {
			let predicate: Mock;

			beforeEach(() => {
				predicate = vi.fn(async (value, matchValue) => {
					return _.startsWith(FilterCriteria.normalize(value.name), FilterCriteria.normalize(matchValue));
				});

				FilterCriteria.saveCriteria(
					'test',
					FilterCriteria.criteria({
						type: 'CUSTOM',
						predicate
					})
				);

				// @ts-expect-error
				vi.spyOn(FilterCriteria, 'applyCriteria');
			});

			it('should handle', async () => {
				const criteria = FilterCriteria.criteria({
					key: 'test',
					type: 'CRITERIA'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				const savedCriteria = FilterCriteria.savedCriteria.get('test');

				// @ts-expect-error
				expect(FilterCriteria.applyCriteria).toHaveBeenCalledWith(testData[0], savedCriteria, true);
				expect(predicate).toHaveBeenCalledWith(testData[0], null);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Custom predicate check FAILED',
					value: testData[0]
				});
			});

			it('should handle with matchValue', async () => {
				const criteria = FilterCriteria.criteria({
					key: 'test',
					matchValue: 'JÓHN',
					type: 'CRITERIA'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				const savedCriteria = FilterCriteria.savedCriteria.get('test');

				// @ts-expect-error
				expect(FilterCriteria.applyCriteria).toHaveBeenCalledWith(
					testData[0],
					{
						...savedCriteria,
						matchValue: 'JÓHN'
					},
					true
				);
				expect(predicate).toHaveBeenCalledWith(testData[0], 'JÓHN');

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'JÓHN',
					passed: true,
					reason: 'Custom predicate check PASSED',
					value: testData[0]
				});
			});

			it('should handle with [operator, normalize, valuePath]', async () => {
				FilterCriteria.saveCriteria(
					'test-string',
					FilterCriteria.criteria({
						type: 'STRING',
						operator: 'STARTS-WITH',
						valuePath: ['name']
					})
				);

				const criteria = FilterCriteria.criteria({
					key: 'test-string',
					matchValue: 'John Doe',
					normalize: false,
					operator: 'EQUALS',
					type: 'CRITERIA',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				const savedCriteria = FilterCriteria.savedCriteria.get('test-string');

				// @ts-expect-error
				expect(FilterCriteria.applyCriteria).toHaveBeenCalledWith(
					testData[0],
					{
						...savedCriteria,
						matchValue: 'John Doe',
						normalize: false,
						operator: 'EQUALS',
						valuePath: ['name']
					},
					true
				);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'John Doe',
					passed: true,
					reason: 'String criteria "EQUALS" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle inexistent', async () => {
				const criteria = FilterCriteria.criteria({
					key: 'inexistent',
					type: 'CRITERIA'
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Criteria "inexistent" not found',
					value: null
				});
			});
		});

		describe('date', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'DATE',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle AFTER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '2023-01-01T00:00:00+00:01',
					operator: 'AFTER',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2023-01-01T00:00:00+00:01',
					passed: true,
					reason: 'Date criteria "AFTER" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle AFTER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '2023-01-01T00:00:00Z',
					operator: 'AFTER-OR-EQUALS',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2023-01-01T00:00:00Z',
					passed: true,
					reason: 'Date criteria "AFTER-OR-EQUALS" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BEFORE operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '2023-01-01T00:00:00-00:01',
					operator: 'BEFORE',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2023-01-01T00:00:00-00:01',
					passed: true,
					reason: 'Date criteria "BEFORE" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BEFORE-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '2023-01-01T00:00:00Z',
					operator: 'BEFORE-OR-EQUALS',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
			});

			it('should handle BETWEEN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z'],
					operator: 'BETWEEN',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z']),
					passed: true,
					reason: 'Date criteria "BETWEEN" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});
		});

		describe('geo', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'GEO',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle IN-RADIUS operator with km unit', async () => {
				// From New York
				const criteria = FilterCriteria.criteria({
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					},
					operator: 'IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				// Los Angeles is ~3936km from NY, should not be in the radius
				const LAPoint = {
					location: { lat: 34.0522, lng: -118.2437 }
				};

				// Newark is ~16km from NY, should be in the radius
				const newarkPoint = {
					location: { lat: 40.7357, lng: -74.1724 }
				};

				const resLA = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteria, true)
				]);
				const resNewark = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria, true)
				]);

				expect(resLA[0]).toEqual(false);
				expect(resLA[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: false,
					reason: 'Geo criteria "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark[0]).toEqual(true);
				expect(resNewark[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: true,
					reason: 'Geo criteria "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle IN-RADIUS operator with mi unit', async () => {
				// From New York
				const criteria = FilterCriteria.criteria({
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 62, // ~100km in miles
						unit: 'mi'
					},
					operator: 'IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				// Los Angeles is ~2445 miles from NY, should not be in the radius
				const LAPoint = {
					location: { lat: 34.0522, lng: -118.2437 }
				};

				// Newark is ~10 miles from NY, should be in the radius
				const newarkPoint = {
					location: { lat: 40.7357, lng: -74.1724 }
				};

				const resLA = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteria, true)
				]);
				const resNewark = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria, true)
				]);

				expect(resLA[0]).toEqual(false);
				expect(resLA[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					}),
					passed: false,
					reason: 'Geo criteria "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark[0]).toEqual(true);
				expect(resNewark[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					}),
					passed: true,
					reason: 'Geo criteria "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle NOT-IN-RADIUS operator with different units', async () => {
				// From New York
				const criteriaKm = FilterCriteria.criteria({
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 3000,
						unit: 'km'
					},
					operator: 'NOT-IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				// From New York
				const criteriaMi = FilterCriteria.criteria({
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 1864, // ~3000km in miles
						unit: 'mi'
					},
					operator: 'NOT-IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				// Los Angeles is ~3936km from NY, should not be in the radius
				const LAPoint = {
					location: { lat: 34.0522, lng: -118.2437 }
				};

				const resKm = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteriaKm),
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteriaKm, true)
				]);
				const resMi = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteriaMi),
					// @ts-expect-error
					FilterCriteria.applyCriteria(LAPoint, criteriaMi, true)
				]);

				// A distance is ~3936km or ~2445mi, so it should be outside the radius in both cases
				expect(resKm[0]).toEqual(true);
				expect(resKm[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 3000,
						unit: 'km'
					}),
					passed: true,
					reason: 'Geo criteria "NOT-IN-RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resMi[0]).toEqual(true);
				expect(resMi[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 1864,
						unit: 'mi'
					}),
					passed: true,
					reason: 'Geo criteria "NOT-IN-RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});
			});

			it('should default to km when unit is not specified', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100
					},
					operator: 'IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				// Newark is a ~16 km from NY, should be in the radius if using km
				const newarkPoint = {
					location: { lat: 40.7357, lng: -74.1724 }
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: true,
					reason: 'Geo criteria "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle getCoordinates', async () => {
				const criteria = FilterCriteria.criteria({
					getCoordinates: {
						lat: ['location', 'lat'],
						lng: ['location', 'lng']
					},
					matchValue: {
						lat: 40.7128,
						lng: -74.006
					},
					operator: 'IN-RADIUS',
					type: 'GEO',
					valuePath: ['location']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 0,
						unit: 'km'
					}),
					passed: false,
					reason: 'Geo criteria "IN-RADIUS" check FAILED',
					value: { lat: 0, lng: 0 }
				});
			});
		});

		describe('map', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'MAP',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle CONTAINS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { 'key-1': 'VALUE-1' },
					operator: 'CONTAINS',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ 'key-1': 'value-1' }),
					passed: true,
					reason: 'Map criteria "CONTAINS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS-KEY operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'KÉY-1',
					normalize: true,
					operator: 'HAS-KEY',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'key-1',
					passed: true,
					reason: 'Map criteria "HAS-KEY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS-KEY operator with normalize = false', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'KÉY-1',
					normalize: false,
					operator: 'HAS-KEY',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'KÉY-1',
					passed: false,
					reason: 'Map criteria "HAS-KEY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS-VALUE operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'value-1',
					operator: 'HAS-VALUE',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'value-1',
					passed: true,
					reason: 'Map criteria "HAS-VALUE" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Map criteria "IS-EMPTY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Map criteria "NOT-EMPTY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-EQUALS',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Map criteria "SIZE-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 0,
					operator: 'SIZE-GREATER',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '0',
					passed: true,
					reason: 'Map criteria "SIZE-GREATER" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-GREATER-OR-EQUALS',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Map criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-LESS',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Map criteria "SIZE-LESS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-LESS-OR-EQUALS',
					type: 'MAP',
					valuePath: ['map']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Map criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});
		});

		describe('number', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'NUMBER',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle BETWEEN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: [25, 30],
					operator: 'BETWEEN',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify([25, 30]),
					passed: true,
					reason: 'Number criteria "BETWEEN" check PASSED',
					value: 25
				});
			});

			it('should handle EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 25,
					operator: 'EQUALS',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '25',
					passed: true,
					reason: 'Number criteria "EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle GREATER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 20,
					operator: 'GREATER',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '20',
					passed: true,
					reason: 'Number criteria "GREATER" check PASSED',
					value: 25
				});
			});

			it('should handle GREATER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 25,
					operator: 'GREATER-OR-EQUALS',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '25',
					passed: true,
					reason: 'Number criteria "GREATER-OR-EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle IN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: [15, 25, 30],
					operator: 'IN',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify([15, 25, 30]),
					passed: true,
					reason: 'Number criteria "IN" check PASSED',
					value: 25
				});
			});

			it('should handle LESS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 30,
					operator: 'LESS',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'Number criteria "LESS" check PASSED',
					value: 25
				});
			});

			it('should handle LESS-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 30,
					operator: 'LESS-OR-EQUALS',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'Number criteria "LESS-OR-EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle NOT-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 30,
					operator: 'NOT-EQUALS',
					type: 'NUMBER',
					valuePath: ['age']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'Number criteria "NOT-EQUALS" check PASSED',
					value: 25
				});
			});
		});

		describe('object', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'OBJECT',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle CONTAINS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'CONTAINS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'Object criteria "CONTAINS" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle HAS-KEY operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'A',
					normalize: true,
					operator: 'HAS-KEY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'a',
					passed: true,
					reason: 'Object criteria "HAS-KEY" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle HAS-KEY operator with normalize = false', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'KÉY-1',
					normalize: false,
					operator: 'HAS-KEY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'KÉY-1',
					passed: false,
					reason: 'Object criteria "HAS-KEY" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle HAS-VALUE operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'HAS-VALUE',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Object criteria "HAS-VALUE" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Object criteria "IS-EMPTY" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Object criteria "NOT-EMPTY" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-EQUALS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Object criteria "SIZE-EQUALS" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 0,
					operator: 'SIZE-GREATER',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '0',
					passed: true,
					reason: 'Object criteria "SIZE-GREATER" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-GREATER-OR-EQUALS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Object criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-LESS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Object criteria "SIZE-LESS" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-LESS-OR-EQUALS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Object criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: { a: 1 }
				});
			});
		});

		describe('set', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'SET',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Set criteria "EXACTLY-MATCHES" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = false', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['Develóper', 'JavaScript'],
					normalize: false,
					operator: 'EXACTLY-MATCHES',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['Develóper', 'JavaScript']),
					passed: false,
					reason: 'Set criteria "EXACTLY-MATCHES" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle HAS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'developer',
					operator: 'HAS',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'Set criteria "HAS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle INCLUDES-ALL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'INCLUDES-ALL',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Set criteria "INCLUDES-ALL" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle INCLUDES-ANY operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'INCLUDES-ANY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'Set criteria "INCLUDES-ANY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'Set criteria "IS-EMPTY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'Set criteria "NOT-EMPTY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-INCLUDES-ALL operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'NOT-INCLUDES-ALL',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'Set criteria "NOT-INCLUDES-ALL" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-INCLUDES-ANY operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					operator: 'NOT-INCLUDES-ANY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'Set criteria "NOT-INCLUDES-ANY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-EQUALS',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Set criteria "SIZE-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 1,
					operator: 'SIZE-GREATER',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'Set criteria "SIZE-GREATER" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-GREATER-OR-EQUALS',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Set criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 3,
					operator: 'SIZE-LESS',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '3',
					passed: true,
					reason: 'Set criteria "SIZE-LESS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 2,
					operator: 'SIZE-LESS-OR-EQUALS',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'Set criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});
		});

		describe('string', () => {
			it('should handle invalid valuePath', async () => {
				// @ts-expect-error
				const criteria = FilterCriteria.criteria({
					type: 'STRING',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await FilterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual(false);
			});

			it('should handle CONTAINS operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'doe',
					normalize: true,
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'doe',
					passed: true,
					reason: 'String criteria "CONTAINS" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle CONTAINS operator with normalize = false', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'doe',
					normalize: false,
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'doe',
					passed: false,
					reason: 'String criteria "CONTAINS" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle CONTAINS operator with normalize function', async () => {
				const normalize = vi.fn((value: string) => {
					return value.toUpperCase();
				});

				const criteria = FilterCriteria.criteria({
					matchValue: 'DOE',
					normalize,
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(normalize).toHaveBeenCalledWith('John Doe');

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'DOE',
					passed: true,
					reason: 'String criteria "CONTAINS" check PASSED',
					value: 'JOHN DOE'
				});
			});

			it('should handle ENDS-WITH operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'Doe',
					operator: 'ENDS-WITH',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'doe',
					passed: true,
					reason: 'String criteria "ENDS-WITH" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle EQUALS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'John Doe',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'john-doe',
					passed: true,
					reason: 'String criteria "EQUALS" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle IN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['DOE', 'JOHN DOE', 'JOHN'],
					operator: 'IN',
					normalize: true,
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: JSON.stringify(['doe', 'john-doe', 'john']),
					passed: true,
					reason: 'String criteria "IN" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'String criteria "IS-EMPTY" check FAILED',
					value: 'john-doe'
				});
			});

			it('should handle MATCHES-REGEX operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: /john/i,
					operator: 'MATCHES-REGEX',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: '/john/i',
					passed: true,
					reason: 'String criteria "MATCHES-REGEX" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle STARTS-WITH operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'john',
					operator: 'STARTS-WITH',
					type: 'STRING',
					valuePath: ['name']
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					matchValue: 'john',
					passed: true,
					reason: 'String criteria "STARTS-WITH" check PASSED',
					value: 'john-doe'
				});
			});
		});
	});

	describe('applyFilter', () => {
		it('should return', async () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'OR',
				criteria: [
					{
						matchValue: 'jo_hn',
						operator: 'CONTAINS',
						type: 'STRING',
						valuePath: ['name']
					},
					{
						matchValue: 'john',
						operator: 'CONTAINS',
						type: 'STRING',
						valuePath: ['name']
					}
				]
			};

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyFilter(testData[0], filter, false),
				// @ts-expect-error
				FilterCriteria.applyFilter(testData[0], filter, true)
			]);

			expect(res[0]).toEqual(false);
			expect(res[1]).toEqual({
				operator: 'OR',
				passed: false,
				reason: 'Filter "OR" check FAILED',
				results: [
					{
						matchValue: 'jo_hn',
						passed: false,
						reason: 'String criteria "CONTAINS" check FAILED',
						value: 'John Doe'
					},
					{
						matchValue: 'john',
						passed: false,
						reason: 'String criteria "CONTAINS" check FAILED',
						value: 'John Doe'
					}
				]
			});
		});
	});

	describe('convertToFilterGroupInput', () => {
		it('should convert CriteriaInput to FilterGroupInput', () => {
			const criteria = FilterCriteria.criteria({
				matchValue: 'John Doe',
				operator: 'EQUALS',
				type: 'STRING',
				valuePath: ['name']
			});

			// @ts-expect-error
			const filterInput = FilterCriteria.convertToFilterGroupInput(criteria);

			expect(filterInput).toEqual({
				input: {
					operator: 'AND',
					filters: [{ operator: 'AND', criteria: [criteria] }]
				},
				level: 'criteria'
			});
		});

		it('should convert FilterInput to FilterGroupInput', () => {
			const criteria = FilterCriteria.criteria({
				matchValue: 'John Doe',
				operator: 'EQUALS',
				type: 'STRING',
				valuePath: ['name']
			});

			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				criteria: [criteria]
			};

			// @ts-expect-error
			const filterGroupInput = FilterCriteria.convertToFilterGroupInput(filter);
			expect(filterGroupInput).toEqual({
				input: { operator: 'AND', filters: [filter] },
				level: 'filter'
			});
		});

		it('should convert FilterGroupInput to FilterGroupInput', () => {
			const criteria = FilterCriteria.criteria({
				matchValue: 'John Doe',
				operator: 'EQUALS',
				type: 'STRING',
				valuePath: ['name']
			});

			const filterGroupInput = {
				operator: 'AND',
				rules: [{ operator: 'AND', criteria: [criteria] }]
			};

			// @ts-expect-error
			expect(FilterCriteria.convertToFilterGroupInput(filterGroupInput)).toEqual({
				input: filterGroupInput,
				level: 'filter-group'
			});
		});
	});

	describe('normalize', () => {
		it('should normalize array', () => {
			expect(FilterCriteria.normalize([1, 'Develóper', 3])).toEqual([1, 'developer', 3]);
		});

		it('should normalize boolean', () => {
			expect(FilterCriteria.normalize(true)).toEqual(true);
			expect(FilterCriteria.normalize(false)).toEqual(false);
		});

		it('should normalize map', () => {
			expect(
				FilterCriteria.normalize(
					new Map([
						['a', '1'],
						['b', 'Develóper']
					])
				)
			).toEqual(
				new Map([
					['a', '1'],
					['b', 'developer']
				])
			);
		});

		it('should normalize number', () => {
			expect(FilterCriteria.normalize(123)).toEqual(123);
		});

		it('should normalize object', () => {
			expect(
				FilterCriteria.normalize({
					a: 1,
					b: 'Develóper',
					c: 3
				})
			).toEqual({
				a: 1,
				b: 'developer',
				c: 3
			});
		});

		it('should normalize nested object', () => {
			expect(
				FilterCriteria.normalize({
					a: 1,
					b: 'Develóper',
					c: {
						d: 'Developer',
						e: 'JavaScript'
					}
				})
			).toEqual({
				a: 1,
				b: 'developer',
				c: {
					d: 'developer',
					e: 'javascript'
				}
			});
		});

		it('should normalize set', () => {
			expect(FilterCriteria.normalize(new Set(['1', 'Develóper']))).toEqual(new Set(['1', 'developer']));
		});

		it('should normalize string', () => {
			expect(FilterCriteria.normalize('Develóper')).toEqual('developer');
		});

		it('should normalize undefined', () => {
			expect(FilterCriteria.normalize(undefined)).toEqual(undefined);
		});
	});

	describe('normalizeString', () => {
		it('should normalize string', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalizeString('Develóper')).toEqual('developer');
			// @ts-expect-error
			expect(FilterCriteria.normalizeString('Devel  óper')).toEqual('devel-oper');
		});
	});

	describe('objectContaining', () => {
		it('should return false for null or undefined values', () => {
			expect(FilterCriteria.objectContaining(null, {})).toBe(false);
			expect(FilterCriteria.objectContaining(undefined, {})).toBe(false);
			expect(FilterCriteria.objectContaining({}, null)).toBe(false);
			expect(FilterCriteria.objectContaining({}, undefined)).toBe(false);
		});

		it('should compare strings', () => {
			expect(FilterCriteria.objectContaining('hello', 'hello')).toBe(true);
			expect(FilterCriteria.objectContaining('Hello', 'hello')).toBe(false);
			expect(FilterCriteria.objectContaining('hello', 'Hello')).toBe(false);
		});

		it('should compare primitive values directly', () => {
			expect(FilterCriteria.objectContaining(42, 42)).toBe(true);
			expect(FilterCriteria.objectContaining(42, 43)).toBe(false);
			expect(FilterCriteria.objectContaining(true, true)).toBe(true);
			expect(FilterCriteria.objectContaining(true, false)).toBe(false);
		});

		it('should handle array comparisons', () => {
			expect(FilterCriteria.objectContaining([1, 2, 3], [1, 2])).toBe(true);
			expect(FilterCriteria.objectContaining([1, 2], [1, 2, 3])).toBe(false);
			expect(FilterCriteria.objectContaining([{ a: 1 }, { b: 2 }], [{ a: 1 }])).toBe(true);
			expect(FilterCriteria.objectContaining([1, 2, 3], [4, 5])).toBe(false);
		});

		it('should handle nested array comparisons', () => {
			expect(
				FilterCriteria.objectContaining(
					[
						[1, 2],
						[3, 4]
					],
					[[1, 2]]
				)
			).toBe(true);
			expect(
				FilterCriteria.objectContaining(
					[[1, 2]],
					[
						[1, 2],
						[3, 4]
					]
				)
			).toBe(false);
			expect(FilterCriteria.objectContaining([[{ a: 1 }]], [[{ a: 1 }]])).toBe(true);
		});

		it('should handle object comparisons', () => {
			expect(FilterCriteria.objectContaining({ a: 1, b: 2 }, { a: 1 })).toBe(true);
			expect(FilterCriteria.objectContaining({ a: 1 }, { a: 1, b: 2 })).toBe(false);
			expect(FilterCriteria.objectContaining({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
		});

		it('should handle mixed nested structures', () => {
			const obj = {
				a: 1,
				b: [1, 2, { c: 3 }],
				d: { e: [4, 5] }
			};

			expect(FilterCriteria.objectContaining(obj, { b: [{ c: 3 }] })).toBe(true);
			expect(FilterCriteria.objectContaining(obj, { d: { e: [4] } })).toBe(true);
			expect(FilterCriteria.objectContaining(obj, { b: [{ c: 4 }] })).toBe(false);
		});

		it('should handle string comparisons in nested structures with normalize = true', () => {
			const obj = {
				name: 'John',
				details: [{ city: 'New York' }, { city: 'London' }]
			};

			expect(FilterCriteria.objectContaining(obj, { details: [{ city: 'New York' }] })).toBe(true);
			expect(FilterCriteria.objectContaining(obj, { details: [{ city: 'Caple Town' }] })).toBe(false);
		});

		it('should handle edge cases', () => {
			expect(FilterCriteria.objectContaining({}, {})).toBe(true);
			expect(FilterCriteria.objectContaining([], [])).toBe(true);
			expect(FilterCriteria.objectContaining({ a: [] }, { a: [] })).toBe(true);
			expect(FilterCriteria.objectContaining({ a: {} }, { a: {} })).toBe(true);
		});
	});

	describe('saveCriteria', () => {
		it('should save criteria', () => {
			FilterCriteria.saveCriteria(
				'test',
				FilterCriteria.criteria({
					matchValue: 'John',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				})
			);

			expect(FilterCriteria.savedCriteria.get('test')).toEqual({
				defaultValue: '',
				matchValue: 'John',
				normalize: true,
				operator: 'EQUALS',
				type: 'STRING',
				valuePath: ['name'],
				valueTransformer: null
			});
		});

		it('should not save criteria with type "CRITERIA"', () => {
			try {
				FilterCriteria.saveCriteria(
					'test',
					FilterCriteria.criteria({
						key: 'test',
						type: 'CRITERIA'
					})
				);

				throw new Error('Expected to throw');
			} catch (err) {
				expect(err).toEqual(new Error('Cannot save criteria with type "CRITERIA"'));
			}
		});
	});
});
