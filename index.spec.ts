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
		map: new Map([['key-1', 'value-1']]),
		name: 'John Doe',
		null: null,
		obj: { a: 1 },
		phones: [
			{ country: 'US', number: '1234567890' },
			{ country: 'US', number: '1234567891' }
		],
		tags: ['developer', 'javascript'],
		tagsSet: new Set(['developer', 'javascript'])
	},
	{
		active: false,
		age: 30,
		createdAt: '2023-03-01T00:00:00Z',
		id: 2,
		map: new Map([['key-2', 'value-2']]),
		name: 'Jane Smith',
		null: null,
		obj: { a: 2 },
		phones: [
			{ country: 'US', number: '1234567892' },
			{ country: 'US', number: '1234567893' }
		],
		tags: ['designer', 'ui/ux'],
		tagsSet: new Set(['designer', 'ui/ux'])
	},
	{
		active: true,
		age: 35,
		createdAt: '2023-06-01T00:00:00Z',
		id: 3,
		map: new Map([['key-3', 'value-3']]),
		name: 'John Smith',
		null: null,
		obj: { a: 3 },
		phones: [
			{ country: 'US', number: '1234567894' },
			{ country: 'US', number: '1234567895' }
		],
		tags: ['developer', 'python'],
		tagsSet: new Set(['developer', 'python'])
	}
];

describe('/index', () => {
	let filterCriteria: FilterCriteria;

	beforeEach(() => {
		filterCriteria = new FilterCriteria();

		// @ts-expect-error
		filterCriteria.savedCriteria.clear();
	});

	describe('statics', () => {
		describe('alias', () => {
			it('should return', () => {
				const res = FilterCriteria.alias('test');

				expect(res).toEqual({
					alias: 'test',
					criteriaMapper: null,
					defaultValue: null,
					matchValue: null,
					normalize: null,
					operator: null,
					type: null,
					valueMapper: null,
					valuePath: null
				});
			});

			it('should return with input', () => {
				const res = FilterCriteria.alias('test', {
					matchInArray: false,
					type: 'NUMBER'
				});

				expect(res).toEqual({
					alias: 'test',
					criteriaMapper: null,
					defaultValue: null,
					matchInArray: false,
					matchValue: null,
					operator: null,
					type: 'NUMBER',
					valueMapper: null,
					valuePath: null
				});
			});
		});

		describe('criteria', () => {
			it('should return', () => {
				const res = FilterCriteria.criteria({
					matchValue: 'john',
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['name']
				});

				expect(res).toEqual({
					alias: '',
					criteriaMapper: null,
					defaultValue: '',
					matchInArray: true,
					matchValue: 'john',
					normalize: true,
					operator: 'CONTAINS',
					type: 'STRING',
					valueMapper: null,
					valuePath: ['name']
				});
			});
		});

		describe('filter', () => {
			it('should return', () => {
				const res = FilterCriteria.filter({
					operator: 'AND',
					criterias: []
				});

				expect(res).toEqual({
					operator: 'AND',
					criterias: []
				});
			});
		});

		describe('filterGroup', () => {
			it('should return', () => {
				const res = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: []
				});

				expect(res).toEqual({
					operator: 'AND',
					filters: []
				});
			});
		});
	});

	describe('match', () => {
		it('should return by filter group with AND', async () => {
			const input = FilterCriteria.filterGroup({
				operator: 'AND',
				filters: _.times(2, () => {
					return {
						operator: 'OR',
						criterias: [
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

			const res = await filterCriteria.match(testData[0], input);

			expect(res).toEqual({
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
								reason: 'STRING criteria "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								matchValue: 'john',
								passed: true,
								reason: 'STRING criteria "CONTAINS" check PASSED',
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
						criterias: [
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

			const res = await filterCriteria.match(testData[0], input);

			expect(res).toEqual({
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
								reason: 'STRING criteria "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								matchValue: 'john',
								passed: true,
								reason: 'STRING criteria "CONTAINS" check PASSED',
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
				criterias: [
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

			const res = await filterCriteria.match(testData[0], input);

			expect(res).toEqual({
				operator: 'OR',
				passed: true,
				reason: 'Filter "OR" check PASSED',
				results: [
					{
						matchValue: 'jo_hn',
						passed: false,
						reason: 'STRING criteria "CONTAINS" check FAILED',
						value: 'john-doe'
					},
					{
						matchValue: 'john',
						passed: true,
						reason: 'STRING criteria "CONTAINS" check PASSED',
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

			const res = await filterCriteria.match(testData[0], input);

			expect(res).toEqual({
				matchValue: 'john',
				passed: true,
				reason: 'STRING criteria "CONTAINS" check PASSED',
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
							criterias: [
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
							criterias: [
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

				const res = await filterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});

			it('should handle nested OR/AND combinations', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'OR',
					filters: [
						{
							operator: 'AND',
							criterias: [
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
							criterias: [
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

				const res = await filterCriteria.matchMany(testData, input);
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
				const predicate = vi.fn(({ value }) => {
					return userLoader.load(value.id);
				});

				const input = FilterCriteria.filter({
					operator: 'AND',
					criterias: [
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

				const res = await filterCriteria.matchMany(testData, input, 2);

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
							criterias: [
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

				const res = await filterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(3);
			});

			it('should return false when field is missing and no defaultValue', async () => {
				const input = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: [
						{
							operator: 'AND',
							criterias: [
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

				const res = await filterCriteria.matchMany(testData, input);
				expect(res).toHaveLength(0);
			});
		});
	});

	describe('matchManyMultiple', () => {
		it('should filter by multiple criteria simultaneously', async () => {
			const filters = {
				developers: FilterCriteria.criteria({
					matchValue: 'developer',
					operator: 'HAS',
					type: 'SET',
					valuePath: ['tagsSet']
				}),
				activeUsers: FilterCriteria.criteria({
					matchValue: true,
					operator: 'EQUALS',
					type: 'BOOLEAN',
					valuePath: ['active']
				}),
				usPhones: FilterCriteria.criteria({
					matchValue: 'us',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['phones', 'country']
				})
			};

			const results = await filterCriteria.matchManyMultiple(testData, filters);

			expect(results.developers).toHaveLength(2);
			expect(_.map(results.developers, 'id')).toEqual([1, 3]);

			expect(results.activeUsers).toHaveLength(2);
			expect(_.map(results.activeUsers, 'id')).toEqual([1, 3]);

			expect(results.usPhones).toHaveLength(3);
			expect(_.map(results.usPhones, 'id')).toEqual([1, 2, 3]);
		});

		it('should handle empty results', async () => {
			const filters = {
				empty: FilterCriteria.criteria({
					matchValue: 'inexistent',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				})
			};

			const results = await filterCriteria.matchManyMultiple(testData, filters);

			expect(results.empty).toEqual([]);
		});

		it('should handle empty filters object', async () => {
			const results = await filterCriteria.matchManyMultiple(testData, {});

			expect(results).toEqual({});
		});
	});

	describe('applyCriteria', () => {
		it('should handle matchValue as a path', async () => {
			const criteria = FilterCriteria.criteria({
				matchValue: { $path: ['tags'] },
				operator: 'EXACTLY-MATCHES',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(res).toEqual({
				matchValue: JSON.stringify(['developer', 'javascript']),
				passed: true,
				reason: 'ARRAY criteria "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle matchValue as function', async () => {
			const matchValue = vi.fn(({ value }) => {
				return value.tags;
			});

			const criteria = FilterCriteria.criteria({
				matchValue,
				operator: 'EXACTLY-MATCHES',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(matchValue).toHaveBeenCalledWith({
				context: expect.any(Map),
				criteria: {
					...criteria,
					matchValue: ['developer', 'javascript']
				},
				value: testData[0]
			});

			expect(res).toEqual({
				matchValue: JSON.stringify(['developer', 'javascript']),
				passed: true,
				reason: 'ARRAY criteria "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle criteriaMapper', async () => {
			const criteriaMapper = vi.fn(({ criteria }) => {
				return {
					...criteria,
					criteriaMapper: null
				};
			});

			const criteria = FilterCriteria.criteria({
				criteriaMapper,
				matchValue: ['developer', 'javascript'],
				operator: 'EXACTLY-MATCHES',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(criteriaMapper).toHaveBeenCalledWith({
				context: expect.any(Map),
				criteria,
				value: testData[0]
			});

			expect(res).toEqual({
				matchValue: JSON.stringify(['developer', 'javascript']),
				passed: true,
				reason: 'ARRAY criteria "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle criteriaMapper returning CUSTOM', async () => {
			const criteriaMapper = vi.fn(() => {
				return FilterCriteria.criteria({
					predicate: () => true,
					type: 'CUSTOM'
				});
			});

			// must match false
			const criteria = FilterCriteria.criteria({
				criteriaMapper,
				operator: 'IS-EMPTY',
				type: 'ARRAY',
				valuePath: ['tags']
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(criteriaMapper).toHaveBeenCalledWith({
				context: expect.any(Map),
				criteria,
				value: testData[0]
			});

			expect(res).toEqual({
				matchValue: 'null',
				passed: true,
				reason: 'CUSTOM predicate check PASSED',
				value: testData[0]
			});
		});

		it('should handle valueMapper', async () => {
			const valueMapper = vi.fn(({ value }) => {
				return value.name;
			});

			const criteria = FilterCriteria.criteria({
				operator: 'NOT-UNDEFINED',
				type: 'BOOLEAN',
				valueMapper
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(valueMapper).toHaveBeenCalledWith({
				context: expect.any(Map),
				criteria,
				value: testData[0]
			});

			expect(res).toEqual({
				matchValue: 'null',
				passed: true,
				reason: 'BOOLEAN criteria "NOT-UNDEFINED" check PASSED',
				value: 'John Doe'
			});
		});

		it('should handle pass context through criteriaMapper -> valueMapper', async () => {
			const criteriaMapper = vi.fn(({ context, criteria, value }) => {
				context.set('name', value.name);
				return criteria;
			});

			const valueMapper = vi.fn(({ context }) => {
				return context.get('name');
			});

			const criteria = FilterCriteria.criteria({
				criteriaMapper,
				matchValue: 'John Doe',
				operator: 'EQUALS',
				type: 'STRING',
				valueMapper
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(valueMapper).toHaveBeenCalledWith({
				context: expect.any(Map),
				criteria: {
					...criteria,
					matchValue: 'john-doe'
				},
				value: testData[0]
			});

			expect(res).toEqual({
				matchValue: 'john-doe',
				passed: true,
				reason: 'STRING criteria "EQUALS" check PASSED',
				value: 'john-doe'
			});
		});

		it('should handle no valuePath', async () => {
			const criteria = FilterCriteria.criteria({
				operator: 'NOT-UNDEFINED',
				type: 'BOOLEAN'
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(res).toEqual({
				matchValue: 'null',
				passed: true,
				reason: 'BOOLEAN criteria "NOT-UNDEFINED" check PASSED',
				value: testData[0]
			});
		});

		it('should handle no operator', async () => {
			const criteria = FilterCriteria.criteria({
				// @ts-expect-error
				operator: '',
				type: 'BOOLEAN'
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(res).toEqual({
				matchValue: 'null',
				passed: false,
				reason: 'Unknown criteria operator',
				value: testData[0]
			});
		});

		it('should handle path traversal inside array (arrayBranching)', async () => {
			const criteria = FilterCriteria.criteria({
				matchValue: '1234567891',
				operator: 'EQUALS',
				type: 'STRING',
				valuePath: ['phones', 'number']
			});

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(res).toEqual({
				matchValue: '1234567891',
				passed: true,
				reason: 'STRING criteria "EQUALS" check PASSED',
				value: ['1234567890', '1234567891']
			});
		});

		it('should handle match in array', async () => {
			const criteria = FilterCriteria.criteria({
				matchValue: 'jane doe',
				operator: 'EQUALS',
				type: 'STRING',
				matchInArray: true,
				normalize: true,
				valuePath: ['names']
			});

			const testValue = {
				names: ['John Smith', 'Jane Doe', 'Bob Johnson']
			};

			const res = await Promise.all([
				// @ts-expect-error
				filterCriteria.applyCriteria(testValue, criteria),
				// @ts-expect-error
				filterCriteria.applyCriteria(testValue, { ...criteria, matchInArray: false })
			]);

			expect(res[0]).toEqual({
				matchValue: 'jane-doe',
				passed: true,
				reason: 'STRING criteria "EQUALS" check PASSED',
				value: ['john-smith', 'jane-doe', 'bob-johnson']
			});

			expect(res[1]).toEqual({
				matchValue: 'jane-doe',
				passed: false,
				reason: 'STRING criteria "EQUALS" check FAILED',
				value: ['john-smith', 'jane-doe', 'bob-johnson']
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

			// @ts-expect-error
			const res = await filterCriteria.applyCriteria(testData[0], criteria);

			expect(res).toEqual({
				matchValue: 'john',
				passed: false,
				reason: 'Unknown criteria type',
				value: 'John Doe'
			});
		});

		describe('alias', () => {
			beforeEach(() => {
				filterCriteria.saveCriteria(
					FilterCriteria.criteria({
						alias: 'test',
						operator: 'STARTS-WITH',
						type: 'STRING',
						valuePath: ['name']
					})
				);
			});

			it('should handle', async () => {
				let criteria = FilterCriteria.alias('test', {
					matchValue: 'JOHN',
					type: 'STRING'
				});

				// @ts-expect-error
				criteria = filterCriteria.translateCriteriaAlias(criteria);

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'john',
					passed: true,
					reason: 'STRING criteria "STARTS-WITH" check PASSED',
					value: 'john-doe'
				});
			});
		});

		describe('array', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'ARRAY',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'ARRAY criteria "EXACTLY-MATCHES" check FAILED',
					value: 25
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['Develóper', 'JavaScript'],
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'ARRAY criteria "EXACTLY-MATCHES" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['Develóper', 'JavaScript']),
					passed: false,
					reason: 'ARRAY criteria "EXACTLY-MATCHES" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'ARRAY criteria "HAS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'ARRAY criteria "INCLUDES-ALL" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'inexistent']),
					passed: true,
					reason: 'ARRAY criteria "INCLUDES-ANY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'ARRAY criteria "HAS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'ARRAY criteria "IS-EMPTY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'ARRAY',
					valuePath: ['tags']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'ARRAY criteria "NOT-EMPTY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'ARRAY criteria "NOT-INCLUDES-ALL" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'inexistent']),
					passed: false,
					reason: 'ARRAY criteria "NOT-INCLUDES-ANY" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'ARRAY criteria "SIZE-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'ARRAY criteria "SIZE-GREATER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'ARRAY criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '3',
					passed: true,
					reason: 'ARRAY criteria "SIZE-LESS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'ARRAY criteria "SIZE-LESS-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'BOOLEAN criteria "EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'false',
					passed: false,
					reason: 'BOOLEAN criteria "IS-FALSE" check FAILED',
					value: true
				});
			});

			it('should handle IS-FALSY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-FALSY',
					type: 'BOOLEAN',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'BOOLEAN criteria "IS-FALSY" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle IS-NIL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-NIL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'BOOLEAN criteria "IS-NIL" check PASSED',
					value: null
				});
			});

			it('should handle IS-NULL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-NULL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'BOOLEAN criteria "IS-NULL" check PASSED',
					value: null
				});
			});

			it('should handle IS-TRUE operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-TRUE',
					type: 'BOOLEAN',
					valuePath: ['active']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'BOOLEAN criteria "IS-TRUE" check PASSED',
					value: true
				});
			});

			it('should handle IS-TRUTHY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-TRUTHY',
					type: 'BOOLEAN',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'BOOLEAN criteria "IS-TRUTHY" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle IS-UNDEFINED operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-UNDEFINED',
					type: 'BOOLEAN',
					valuePath: ['inexistent']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'BOOLEAN criteria "IS-UNDEFINED" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: false,
					reason: 'BOOLEAN criteria "NOT-EQUALS" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle NOT-NIL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-NIL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'BOOLEAN criteria "NOT-NIL" check FAILED',
					value: null
				});
			});

			it('should handle NOT-NULL operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-NULL',
					type: 'BOOLEAN',
					valuePath: ['null']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'BOOLEAN criteria "NOT-NULL" check FAILED',
					value: null
				});
			});

			it('should handle NOT-UNDEFINED operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-UNDEFINED',
					type: 'BOOLEAN',
					valuePath: ['inexistent']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'BOOLEAN criteria "NOT-UNDEFINED" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: false,
					reason: 'BOOLEAN criteria "STRICT-EQUAL" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'BOOLEAN criteria "STRICT-NOT-EQUAL" check PASSED',
					value: { a: 1 }
				});
			});
		});

		describe('custom', () => {
			it('should handle', async () => {
				const predicate = vi.fn(async ({ value }) => {
					return _.startsWith(value.name, 'John');
				});

				const criteria = FilterCriteria.criteria({
					predicate,
					type: 'CUSTOM'
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(predicate).toHaveBeenCalledWith({
					matchValue: null,
					value: testData[0]
				});

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'CUSTOM predicate check PASSED',
					value: testData[0]
				});
			});

			it('should handle with matchValue', async () => {
				const predicate = vi.fn(async ({ matchValue, value }) => {
					return _.startsWith(value.name, matchValue);
				});

				const criteria = FilterCriteria.criteria({
					matchValue: 'John',
					predicate,
					type: 'CUSTOM'
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(predicate).toHaveBeenCalledWith({
					matchValue: 'John',
					value: testData[0]
				});

				expect(res).toEqual({
					matchValue: 'John',
					passed: true,
					reason: 'CUSTOM predicate check PASSED',
					value: testData[0]
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
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '',
					passed: false,
					reason: 'DATE criteria "AFTER" check FAILED',
					value: 25
				});
			});

			it('should handle AFTER operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '2023-01-01T00:00:00+00:01',
					operator: 'AFTER',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2023-01-01T00:00:00+00:01',
					passed: true,
					reason: 'DATE criteria "AFTER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2023-01-01T00:00:00Z',
					passed: true,
					reason: 'DATE criteria "AFTER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2023-01-01T00:00:00-00:01',
					passed: true,
					reason: 'DATE criteria "BEFORE" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2023-01-01T00:00:00Z',
					passed: true,
					reason: 'DATE criteria "BEFORE-OR-EQUALS" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BETWEEN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z'],
					operator: 'BETWEEN',
					type: 'DATE',
					valuePath: ['createdAt']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z']),
					passed: true,
					reason: 'DATE criteria "BETWEEN" check PASSED',
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
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ lat: 0, lng: 0, radius: 0, unit: 'km' }),
					passed: false,
					reason: 'GEO criteria "IN-RADIUS" check FAILED',
					value: 25
				});
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

				// @ts-expect-error
				const resLA = await filterCriteria.applyCriteria(LAPoint, criteria);
				// @ts-expect-error
				const resNewark = await filterCriteria.applyCriteria(newarkPoint, criteria);

				expect(resLA).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: false,
					reason: 'GEO criteria "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: true,
					reason: 'GEO criteria "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle IN-RADIUS operator with km unit (number array)', async () => {
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
					location: [34.0522, -118.2437]
				};

				// Newark is ~16km from NY, should be in the radius
				const newarkPoint = {
					location: [40.7357, -74.1724]
				};

				// @ts-expect-error
				const resLA = await filterCriteria.applyCriteria(LAPoint, criteria);
				// @ts-expect-error
				const resNewark = await filterCriteria.applyCriteria(newarkPoint, criteria);

				expect(resLA).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: false,
					reason: 'GEO criteria "IN-RADIUS" check FAILED',
					value: [34.0522, -118.2437]
				});

				expect(resNewark).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: true,
					reason: 'GEO criteria "IN-RADIUS" check PASSED',
					value: [40.7357, -74.1724]
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

				// @ts-expect-error
				const resLA = await filterCriteria.applyCriteria(LAPoint, criteria);
				// @ts-expect-error
				const resNewark = await filterCriteria.applyCriteria(newarkPoint, criteria);

				expect(resLA).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					}),
					passed: false,
					reason: 'GEO criteria "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					}),
					passed: true,
					reason: 'GEO criteria "IN-RADIUS" check PASSED',
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

				// @ts-expect-error
				const resKm = await filterCriteria.applyCriteria(LAPoint, criteriaKm);
				// @ts-expect-error
				const resMi = await filterCriteria.applyCriteria(LAPoint, criteriaMi);

				// A distance is ~3936km or ~2445mi, so it should be outside the radius in both cases
				expect(resKm).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 3000,
						unit: 'km'
					}),
					passed: true,
					reason: 'GEO criteria "NOT-IN-RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resMi).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 1864,
						unit: 'mi'
					}),
					passed: true,
					reason: 'GEO criteria "NOT-IN-RADIUS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(newarkPoint, criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}),
					passed: true,
					reason: 'GEO criteria "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});
		});

		describe('map', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'MAP',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'MAP criteria "CONTAINS" check FAILED',
					value: 25
				});
			});

			it('should handle CONTAINS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { 'key-1': 'VALUE-1' },
					operator: 'CONTAINS',
					type: 'MAP',
					valuePath: ['map']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ 'key-1': 'value-1' }),
					passed: true,
					reason: 'MAP criteria "CONTAINS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'key-1',
					passed: true,
					reason: 'MAP criteria "HAS-KEY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'KÉY-1',
					passed: false,
					reason: 'MAP criteria "HAS-KEY" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'value-1',
					passed: true,
					reason: 'MAP criteria "HAS-VALUE" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'MAP',
					valuePath: ['map']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'MAP criteria "IS-EMPTY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'MAP',
					valuePath: ['map']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'MAP criteria "NOT-EMPTY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'MAP criteria "SIZE-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '0',
					passed: true,
					reason: 'MAP criteria "SIZE-GREATER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'MAP criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'MAP criteria "SIZE-LESS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'MAP criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});
		});

		describe('number', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'NUMBER',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'NUMBER criteria "EQUALS" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle BETWEEN operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: [25, 30],
					operator: 'BETWEEN',
					type: 'NUMBER',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify([25, 30]),
					passed: true,
					reason: 'NUMBER criteria "BETWEEN" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '25',
					passed: true,
					reason: 'NUMBER criteria "EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '20',
					passed: true,
					reason: 'NUMBER criteria "GREATER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '25',
					passed: true,
					reason: 'NUMBER criteria "GREATER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify([15, 25, 30]),
					passed: true,
					reason: 'NUMBER criteria "IN" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'NUMBER criteria "LESS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'NUMBER criteria "LESS-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '30',
					passed: true,
					reason: 'NUMBER criteria "NOT-EQUALS" check PASSED',
					value: 25
				});
			});
		});

		describe('object', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'OBJECT',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'OBJECT criteria "CONTAINS" check FAILED',
					value: 25
				});
			});

			it('should handle CONTAINS operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: { a: 1 },
					operator: 'CONTAINS',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify({ a: 1 }),
					passed: true,
					reason: 'OBJECT criteria "CONTAINS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'a',
					passed: true,
					reason: 'OBJECT criteria "HAS-KEY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'KÉY-1',
					passed: false,
					reason: 'OBJECT criteria "HAS-KEY" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'OBJECT criteria "HAS-VALUE" check PASSED',
					value: { a: 1 }
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'OBJECT criteria "IS-EMPTY" check FAILED',
					value: { a: 1 }
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'OBJECT',
					valuePath: ['obj']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'OBJECT criteria "NOT-EMPTY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'OBJECT criteria "SIZE-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '0',
					passed: true,
					reason: 'OBJECT criteria "SIZE-GREATER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'OBJECT criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'OBJECT criteria "SIZE-LESS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'OBJECT criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: { a: 1 }
				});
			});
		});

		describe('set', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'SET',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'SET criteria "EXACTLY-MATCHES" check FAILED',
					value: 25
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: ['developer', 'javascript'],
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'SET criteria "EXACTLY-MATCHES" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['Develóper', 'JavaScript']),
					passed: false,
					reason: 'SET criteria "EXACTLY-MATCHES" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'developer',
					passed: true,
					reason: 'SET criteria "HAS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'SET criteria "INCLUDES-ALL" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: true,
					reason: 'SET criteria "INCLUDES-ANY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'SET criteria "IS-EMPTY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'NOT-EMPTY',
					type: 'SET',
					valuePath: ['tagsSet']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: true,
					reason: 'SET criteria "NOT-EMPTY" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'SET criteria "NOT-INCLUDES-ALL" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['developer', 'javascript']),
					passed: false,
					reason: 'SET criteria "NOT-INCLUDES-ANY" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'SET criteria "SIZE-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '1',
					passed: true,
					reason: 'SET criteria "SIZE-GREATER" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'SET criteria "SIZE-GREATER-OR-EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '3',
					passed: true,
					reason: 'SET criteria "SIZE-LESS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '2',
					passed: true,
					reason: 'SET criteria "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});
		});

		describe('string', () => {
			it('should handle invalid valuePath', async () => {
				const criteria = FilterCriteria.criteria({
					type: 'STRING',
					valuePath: ['age']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'STRING criteria "EQUALS" check FAILED',
					value: 25
				});
			});

			it('should handle CONTAINS operator with normalize = true', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'doe',
					normalize: true,
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'doe',
					passed: true,
					reason: 'STRING criteria "CONTAINS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'doe',
					passed: false,
					reason: 'STRING criteria "CONTAINS" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle CONTAINS operator with number', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: '456',
					operator: 'CONTAINS',
					type: 'STRING',
					valuePath: ['phones', 'number']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '456',
					passed: true,
					reason: 'STRING criteria "CONTAINS" check PASSED',
					value: ['1234567890', '1234567891']
				});
			});

			it('should handle ENDS-WITH operator', async () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'Doe',
					operator: 'ENDS-WITH',
					type: 'STRING',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'doe',
					passed: true,
					reason: 'STRING criteria "ENDS-WITH" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'john-doe',
					passed: true,
					reason: 'STRING criteria "EQUALS" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: JSON.stringify(['doe', 'john-doe', 'john']),
					passed: true,
					reason: 'STRING criteria "IN" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria = FilterCriteria.criteria({
					operator: 'IS-EMPTY',
					type: 'STRING',
					valuePath: ['name']
				});

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'null',
					passed: false,
					reason: 'STRING criteria "IS-EMPTY" check FAILED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: '/john/i',
					passed: true,
					reason: 'STRING criteria "MATCHES-REGEX" check PASSED',
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

				// @ts-expect-error
				const res = await filterCriteria.applyCriteria(testData[0], criteria);

				expect(res).toEqual({
					matchValue: 'john',
					passed: true,
					reason: 'STRING criteria "STARTS-WITH" check PASSED',
					value: 'john-doe'
				});
			});
		});
	});

	describe('applyFilter', () => {
		it('should return', async () => {
			const filter = FilterCriteria.filter({
				operator: 'OR',
				criterias: [
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

			// @ts-expect-error
			const res = await filterCriteria.applyFilter(testData[0], filter);

			expect(res).toEqual({
				operator: 'OR',
				passed: true,
				reason: 'Filter "OR" check PASSED',
				results: [
					{
						matchValue: 'jo_hn',
						passed: false,
						reason: 'STRING criteria "CONTAINS" check FAILED',
						value: 'john-doe'
					},
					{
						matchValue: 'john',
						passed: true,
						reason: 'STRING criteria "CONTAINS" check PASSED',
						value: 'john-doe'
					}
				]
			});
		});
	});

	describe('findByPath', () => {
		describe('basic object traversal', () => {
			const simpleObject = {
				name: 'John',
				age: 30,
				isActive: true,
				nullValue: null,
				undefinedValue: undefined
			};

			it('should find string value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['name'])).toEqual({
					arrayBranching: false,
					value: 'John'
				});
			});

			it('should find number value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['age'])).toEqual({
					arrayBranching: false,
					value: 30
				});
			});

			it('should find boolean value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['isActive'])).toEqual({
					arrayBranching: false,
					value: true
				});
			});

			it('should find null value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['nullValue'])).toEqual({
					arrayBranching: false,
					value: null
				});
			});

			it('should return defaultValue for undefined value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['undefinedValue'])).toEqual({
					arrayBranching: false,
					value: undefined
				});
			});

			it('should return defaultValue for non-existent path', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(simpleObject, ['nonexistent'])).toEqual({
					arrayBranching: false,
					value: undefined
				});
			});
		});

		describe('nested object traversal', () => {
			const nestedObject = {
				user: {
					details: {
						name: 'John',
						address: {
							street: 'Main St',
							number: 123
						}
					}
				}
			};

			it('should find deeply nested value using dot notation', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(nestedObject, ['user', 'details', 'name'])).toEqual({
					arrayBranching: false,
					value: 'John'
				});
			});

			it('should find multiple levels deep value', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(nestedObject, ['user', 'details', 'address', 'street'])).toEqual({
					arrayBranching: false,
					value: 'Main St'
				});
			});

			it('should return undefined for invalid nested path', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(nestedObject, ['user', 'invalid', 'path'])).toEqual({
					arrayBranching: false,
					value: undefined
				});
			});
		});

		describe('array traversal', () => {
			const arrayData = {
				numbers: [1, 2, 3],
				nested: [
					[4, 5],
					[6, 7]
				],
				deepNested: [[[8, 9]], [[10, 11]]],
				mixedArray: [1, '2', true, null]
			};

			it('should return simple array', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(arrayData, ['numbers'])).toEqual({
					arrayBranching: false,
					value: [1, 2, 3]
				});
			});

			it('should return nested arrays', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(arrayData, ['nested'])).toEqual({
					arrayBranching: false,
					value: [
						[4, 5],
						[6, 7]
					]
				});
			});

			it('should return deeply nested arrays', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(arrayData, ['deepNested'])).toEqual({
					arrayBranching: false,
					value: [[[8, 9]], [[10, 11]]]
				});
			});

			it('should return mixed type arrays', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(arrayData, ['mixedArray'])).toEqual({
					arrayBranching: false,
					value: [1, '2', true, null]
				});
			});
		});

		describe('object arrays traversal', () => {
			const objectArrays = {
				users: [
					{ id: 1, name: 'John', tags: ['admin', 'user'] },
					{ id: 2, name: 'Jane', tags: ['user'] }
				],
				nested: {
					groups: [
						{ id: 1, members: [{ name: 'Alice' }, { name: 'Bob' }] },
						{ id: 2, members: [{ name: 'Charlie' }] }
					]
				}
			};

			it('should find values across array of objects', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(objectArrays, ['users', 'name'])).toEqual({
					arrayBranching: true,
					value: ['John', 'Jane']
				});
			});

			it('should find and flatten nested arrays in objects', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(objectArrays, ['users', 'tags'])).toEqual({
					arrayBranching: true,
					value: ['admin', 'user', 'user']
				});
			});

			it('should traverse deeply nested object arrays', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(objectArrays, ['nested', 'groups', 'members', 'name'])).toEqual({
					arrayBranching: true,
					value: ['Alice', 'Bob', 'Charlie']
				});
			});

			it('should return empty array for invalid nested path', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(objectArrays, ['nested', 'groups', 'invalid'])).toEqual({
					arrayBranching: true,
					value: []
				});
			});
		});

		describe('edge cases', () => {
			it('should handle empty object', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath({}, ['any', 'path'])).toEqual({
					arrayBranching: false,
					value: undefined
				});
			});

			it('should handle empty array', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath([], ['any', 'path'])).toEqual({
					arrayBranching: false,
					value: []
				});
			});

			it('should handle empty path', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath({ value: 1 }, [])).toEqual({
					arrayBranching: false,
					value: { value: 1 }
				});
			});

			const circularRef: any = { a: 1 };
			circularRef.self = circularRef;

			it('should handle circular references', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(circularRef, ['a'])).toEqual({
					arrayBranching: false,
					value: 1
				});
				// @ts-expect-error
				expect(filterCriteria.findByPath(circularRef, ['self', 'a'])).toEqual({
					arrayBranching: false,
					value: 1
				});
			});

			const specialChars = {
				'key.with.dots': 'value',
				'key-with-dashes': 'value2',
				'@special!chars': 'value3'
			};

			it('should handle special characters in path using bracket notation', () => {
				// @ts-expect-error
				expect(filterCriteria.findByPath(specialChars, ['["key.with.dots"]'])).toEqual({
					arrayBranching: false,
					value: 'value'
				});
				// @ts-expect-error
				expect(filterCriteria.findByPath(specialChars, ['["key-with-dashes"]'])).toEqual({
					arrayBranching: false,
					value: 'value2'
				});
				// @ts-expect-error
				expect(filterCriteria.findByPath(specialChars, ['["@special!chars"]'])).toEqual({
					arrayBranching: false,
					value: 'value3'
				});
			});
		});
	});

	describe('inspect', () => {
		it('should return a JSON string with operators and saved criteria', () => {
			filterCriteria.saveCriteria(
				FilterCriteria.criteria({
					alias: 'test-boolean',
					matchInArray: false,
					operator: 'IS-TRUE',
					type: 'BOOLEAN',
					valuePath: ['active']
				})
			);

			// Save some test criteria
			filterCriteria.saveCriteria(
				FilterCriteria.criteria({
					alias: 'test-string',
					type: 'STRING',
					operator: 'STARTS-WITH',
					valuePath: ['name']
				})
			);

			const result = JSON.parse(filterCriteria.inspect());

			// Check operators
			expect(result.operators).toEqual({
				array: [
					'EXACTLY-MATCHES',
					'INCLUDES-ALL',
					'INCLUDES-ANY',
					'HAS',
					'IS-EMPTY',
					'NOT-EMPTY',
					'NOT-INCLUDES-ALL',
					'NOT-INCLUDES-ANY',
					'SIZE-EQUALS',
					'SIZE-GREATER',
					'SIZE-GREATER-OR-EQUALS',
					'SIZE-LESS',
					'SIZE-LESS-OR-EQUALS'
				],
				boolean: [
					'EQUALS',
					'IS-FALSE',
					'IS-FALSY',
					'IS-NIL',
					'IS-NULL',
					'IS-TRUE',
					'IS-TRUTHY',
					'IS-UNDEFINED',
					'NOT-EQUALS',
					'NOT-NIL',
					'NOT-NULL',
					'NOT-UNDEFINED',
					'STRICT-EQUAL',
					'STRICT-NOT-EQUAL'
				],
				date: ['AFTER', 'AFTER-OR-EQUALS', 'BEFORE', 'BEFORE-OR-EQUALS', 'BETWEEN'],
				geo: ['IN-RADIUS', 'NOT-IN-RADIUS'],
				map: [
					'CONTAINS',
					'HAS-KEY',
					'HAS-VALUE',
					'IS-EMPTY',
					'NOT-EMPTY',
					'SIZE-EQUALS',
					'SIZE-GREATER',
					'SIZE-GREATER-OR-EQUALS',
					'SIZE-LESS',
					'SIZE-LESS-OR-EQUALS'
				],
				number: ['BETWEEN', 'EQUALS', 'GREATER', 'GREATER-OR-EQUALS', 'IN', 'LESS', 'LESS-OR-EQUALS', 'NOT-EQUALS'],
				object: [
					'CONTAINS',
					'HAS-KEY',
					'HAS-VALUE',
					'IS-EMPTY',
					'NOT-EMPTY',
					'SIZE-EQUALS',
					'SIZE-GREATER',
					'SIZE-GREATER-OR-EQUALS',
					'SIZE-LESS',
					'SIZE-LESS-OR-EQUALS'
				],
				set: [
					'EXACTLY-MATCHES',
					'INCLUDES-ALL',
					'INCLUDES-ANY',
					'HAS',
					'IS-EMPTY',
					'NOT-EMPTY',
					'NOT-INCLUDES-ALL',
					'NOT-INCLUDES-ANY',
					'SIZE-EQUALS',
					'SIZE-GREATER',
					'SIZE-GREATER-OR-EQUALS',
					'SIZE-LESS',
					'SIZE-LESS-OR-EQUALS'
				],
				string: ['CONTAINS', 'ENDS-WITH', 'EQUALS', 'IN', 'IS-EMPTY', 'MATCHES-REGEX', 'STARTS-WITH']
			});

			// Check saved criteria
			expect(result.savedCriteria).toEqual({
				'test-boolean': {
					alias: 'test-boolean',
					criteriaMapper: null,
					matchInArray: false,
					matchValue: null,
					operator: 'IS-TRUE',
					type: 'BOOLEAN',
					valueMapper: null,
					valuePath: ['active']
				},
				'test-string': {
					alias: 'test-string',
					criteriaMapper: null,
					defaultValue: '',
					matchInArray: true,
					matchValue: null,
					normalize: true,
					operator: 'STARTS-WITH',
					type: 'STRING',
					valueMapper: null,
					valuePath: ['name']
				}
			});
		});

		it('should return empty savedCriteria when no criteria are saved', () => {
			const result = JSON.parse(filterCriteria.inspect());

			expect(result.savedCriteria).toEqual({});
			expect(Object.keys(result.operators).length).toBe(9); // Check that operators are still present
		});
	});

	describe('normalize', () => {
		it('should normalize array', () => {
			expect(filterCriteria.normalize([1, 'Develóper', 3])).toEqual([1, 'developer', 3]);
		});

		it('should normalize boolean', () => {
			expect(filterCriteria.normalize(true)).toEqual(true);
			expect(filterCriteria.normalize(false)).toEqual(false);
		});

		it('should normalize map', () => {
			expect(
				filterCriteria.normalize(
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
			expect(filterCriteria.normalize(123)).toEqual(123);
		});

		it('should normalize object', () => {
			expect(
				filterCriteria.normalize({
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
				filterCriteria.normalize({
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
			expect(filterCriteria.normalize(new Set(['1', 'Develóper']))).toEqual(new Set(['1', 'developer']));
		});

		it('should normalize string', () => {
			expect(filterCriteria.normalize('Develóper')).toEqual('developer');
		});

		it('should normalize undefined', () => {
			expect(filterCriteria.normalize(undefined)).toEqual(undefined);
		});
	});

	describe('normalizeString', () => {
		it('should normalize string', () => {
			// @ts-expect-error
			expect(filterCriteria.normalizeString('Develóper')).toEqual('developer');
			// @ts-expect-error
			expect(filterCriteria.normalizeString('Devel  óper')).toEqual('devel-oper');
		});
	});

	describe('objectContaining', () => {
		it('should return false for null or undefined values', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining(null, {})).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(undefined, {})).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({}, null)).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({}, undefined)).toBe(false);
		});

		it('should compare strings', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining('hello', 'hello')).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining('Hello', 'hello')).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining('hello', 'Hello')).toBe(false);
		});

		it('should compare primitive values directly', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining(42, 42)).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(42, 43)).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(true, true)).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(true, false)).toBe(false);
		});

		it('should handle array comparisons', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining([1, 2, 3], [1, 2])).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining([1, 2], [1, 2, 3])).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining([{ a: 1 }, { b: 2 }], [{ a: 1 }])).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining([1, 2, 3], [4, 5])).toBe(false);
		});

		it('should handle nested array comparisons', () => {
			expect(
				// @ts-expect-error
				filterCriteria.objectContaining(
					[
						[1, 2],
						[3, 4]
					],
					[[1, 2]]
				)
			).toBe(true);
			expect(
				// @ts-expect-error
				filterCriteria.objectContaining(
					[[1, 2]],
					[
						[1, 2],
						[3, 4]
					]
				)
			).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining([[{ a: 1 }]], [[{ a: 1 }]])).toBe(true);
		});

		it('should handle object comparisons', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining({ a: 1, b: 2 }, { a: 1 })).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({ a: 1 }, { a: 1, b: 2 })).toBe(false);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
		});

		it('should handle mixed nested structures', () => {
			const obj = {
				a: 1,
				b: [1, 2, { c: 3 }],
				d: { e: [4, 5] }
			};

			// @ts-expect-error
			expect(filterCriteria.objectContaining(obj, { b: [{ c: 3 }] })).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(obj, { d: { e: [4] } })).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(obj, { b: [{ c: 4 }] })).toBe(false);
		});

		it('should handle string comparisons in nested structures with normalize = true', () => {
			const obj = {
				name: 'John',
				details: [{ city: 'New York' }, { city: 'London' }]
			};

			// @ts-expect-error
			expect(filterCriteria.objectContaining(obj, { details: [{ city: 'New York' }] })).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining(obj, { details: [{ city: 'Caple Town' }] })).toBe(false);
		});

		it('should handle edge cases', () => {
			// @ts-expect-error
			expect(filterCriteria.objectContaining({}, {})).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining([], [])).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({ a: [] }, { a: [] })).toBe(true);
			// @ts-expect-error
			expect(filterCriteria.objectContaining({ a: {} }, { a: {} })).toBe(true);
		});
	});

	describe('saveCriteria', () => {
		it('should save criteria', () => {
			filterCriteria.saveCriteria(
				FilterCriteria.criteria({
					alias: 'test',
					matchInArray: true,
					matchValue: 'John',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				})
			);

			// @ts-expect-error
			expect(filterCriteria.savedCriteria.get('test')).toEqual({
				criteria: {
					alias: 'test',
					criteriaMapper: null,
					defaultValue: '',
					matchInArray: true,
					matchValue: 'John',
					normalize: true,
					operator: 'EQUALS',
					type: 'STRING',
					valueMapper: null,
					valuePath: ['name']
				}
			});
		});

		it('should throw error when alias is not provided', () => {
			try {
				filterCriteria.saveCriteria(FilterCriteria.criteria({ type: 'STRING' }));

				throw new Error('Expected to throw');
			} catch (err) {
				expect(err).toEqual(new Error('Alias is required'));
			}
		});
	});

	describe('translateCriteriaAlias', () => {
		beforeEach(() => {
			filterCriteria.saveCriteria(
				FilterCriteria.criteria({
					alias: 'test',
					type: 'STRING',
					valuePath: ['name']
				})
			);
		});

		it('should throw error when alias is not found', () => {
			try {
				// @ts-expect-error
				filterCriteria.translateCriteriaAlias({ alias: 'inexistent' });

				throw new Error('Expected to throw');
			} catch (err) {
				expect(err).toEqual(new Error('Criteria "inexistent" not found'));
			}
		});

		it('should override [criteriaMapper, matchInArray, matchValue, operator, type, valuePath, valueMapper]', async () => {
			const criteriaMapper = vi.fn(({ criteria }) => {
				return criteria;
			});

			const valueMapper = vi.fn(({ value }) => {
				return value;
			});

			let criteria = FilterCriteria.alias('test', {
				criteriaMapper,
				matchInArray: false,
				matchValue: 25,
				operator: 'EQUALS',
				type: 'NUMBER',
				valueMapper,
				valuePath: ['age']
			});

			// @ts-expect-error
			criteria = filterCriteria.translateCriteriaAlias(criteria);

			expect(criteria).toEqual({
				alias: 'test',
				criteriaMapper,
				defaultValue: 0,
				matchInArray: false,
				matchValue: 25,
				operator: 'EQUALS',
				type: 'NUMBER',
				valueMapper,
				valuePath: ['age']
			});
		});

		it('should override [normalize]', async () => {
			const criteriaMapper = vi.fn(({ criteria }) => {
				return criteria;
			});

			const valueMapper = vi.fn(({ value }) => {
				return value;
			});

			let criteria = FilterCriteria.alias('test', {
				normalize: false,
				type: 'STRING'
			});

			// @ts-expect-error
			criteria = filterCriteria.translateCriteriaAlias(criteria);

			expect(criteria).toEqual({
				alias: 'test',
				criteriaMapper: null,
				defaultValue: '',
				matchInArray: true,
				matchValue: null,
				normalize: false,
				operator: 'EQUALS',
				type: 'STRING',
				valueMapper: null,
				valuePath: ['name']
			});
		});
	});

	describe('translateToFilterGroupInput', () => {
		let criteriaAlias: FilterCriteria.Criteria;

		beforeEach(() => {
			criteriaAlias = FilterCriteria.criteria({
				alias: 'test',
				operator: 'GREATER',
				type: 'NUMBER',
				valuePath: ['age']
			});

			filterCriteria.saveCriteria(criteriaAlias);
		});

		describe('from filterGroup', () => {
			it('should convert', () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'John Doe',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				});

				const filterGroupInput = FilterCriteria.filterGroup({
					operator: 'AND',
					filters: [
						{
							operator: 'AND',
							criterias: [criteria, FilterCriteria.alias('test')]
						}
					]
				});

				// @ts-expect-error
				expect(filterCriteria.translateToFilterGroupInput(filterGroupInput)).toEqual({
					input: {
						...filterGroupInput,
						filters: _.map(filterGroupInput.filters, filter => {
							return {
								...filter,
								criterias: [
									criteria,
									{
										alias: 'test',
										criteriaMapper: null,
										defaultValue: 0,
										matchInArray: true,
										matchValue: null,
										operator: 'GREATER',
										type: 'NUMBER',
										valueMapper: null,
										valuePath: ['age']
									}
								]
							};
						})
					},
					level: 'filter-group'
				});
			});
		});

		describe('from filter', () => {
			it('should convert', () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'John Doe',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				});

				const filter = FilterCriteria.filter({
					operator: 'AND',
					criterias: [criteria, FilterCriteria.alias('test')]
				});

				// @ts-expect-error
				const filterGroupInput = filterCriteria.translateToFilterGroupInput(filter);
				expect(filterGroupInput).toEqual({
					input: {
						operator: 'AND',
						filters: [
							{
								...filter,
								criterias: [
									criteria,
									{
										alias: 'test',
										criteriaMapper: null,
										defaultValue: 0,
										matchInArray: true,
										matchValue: null,
										operator: 'GREATER',
										type: 'NUMBER',
										valueMapper: null,
										valuePath: ['age']
									}
								]
							}
						]
					},
					level: 'filter'
				});
			});
		});

		describe('from criteria', () => {
			it('should convert', () => {
				const criteria = FilterCriteria.criteria({
					matchValue: 'John Doe',
					operator: 'EQUALS',
					type: 'STRING',
					valuePath: ['name']
				});

				// @ts-expect-error
				const filterInput = filterCriteria.translateToFilterGroupInput(criteria);

				expect(filterInput).toEqual({
					input: {
						operator: 'AND',
						filters: [{ operator: 'AND', criterias: [criteria] }]
					},
					level: 'criteria'
				});
			});

			it('should convert with alias', () => {
				const criteria = FilterCriteria.alias('test');

				// @ts-expect-error
				const filterInput = filterCriteria.translateToFilterGroupInput(criteria);

				expect(filterInput).toEqual({
					input: {
						operator: 'AND',
						filters: [
							{
								operator: 'AND',
								criterias: [
									{
										alias: 'test',
										criteriaMapper: null,
										defaultValue: 0,
										matchInArray: true,
										matchValue: null,
										operator: 'GREATER',
										type: 'NUMBER',
										valueMapper: null,
										valuePath: ['age']
									}
								]
							}
						]
					},
					level: 'criteria'
				});
			});
		});
	});
});
