import _ from 'lodash';
import { beforeEach, describe, expect, it } from 'vitest';

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
		tags: ['developer', 'python'],
		tagsSet: new Set(['developer', 'python'])
	}
];

describe('/index', () => {
	beforeEach(() => {
		FilterCriteria.customCriteria.clear();
	});

	describe('match', () => {
		it('should return by filter with AND', async () => {
			const filter: FilterCriteria.MatchInput = {
				operator: 'AND',
				rules: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								type: 'STRING',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'jo_hn'
							},
							{
								type: 'STRING',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'john'
							}
						]
					};
				})
			};

			const res = await Promise.all([FilterCriteria.match(testData[0], filter, false), FilterCriteria.match(testData[0], filter, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				level: 'filter',
				operator: 'AND',
				passed: true,
				reason: 'Filter "AND" check PASSED',
				results: _.times(2, () => {
					return {
						operator: 'OR',
						passed: true,
						reason: 'Rule "OR" check PASSED',
						results: [
							{
								criteriaValue: 'jo_hn',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: false,
								reason: 'String "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								criteriaValue: 'john',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: true,
								reason: 'String "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						],
						level: 'rule'
					};
				})
			});
		});

		it('should return by filter with OR', async () => {
			const filter: FilterCriteria.MatchInput = {
				operator: 'OR',
				rules: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								type: 'STRING',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'jo_hn'
							},
							{
								type: 'STRING',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'john'
							}
						]
					};
				})
			};

			const res = await Promise.all([FilterCriteria.match(testData[0], filter, false), FilterCriteria.match(testData[0], filter, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				level: 'filter',
				operator: 'OR',
				passed: true,
				reason: 'Filter "OR" check PASSED',
				results: _.times(2, () => {
					return {
						operator: 'OR',
						passed: true,
						reason: 'Rule "OR" check PASSED',
						results: [
							{
								criteriaValue: 'jo_hn',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: false,
								reason: 'String "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								criteriaValue: 'john',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: true,
								reason: 'String "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						],
						level: 'rule'
					};
				})
			});
		});

		it('should return by rule', async () => {
			const rule: FilterCriteria.MatchInput = {
				operator: 'OR',
				criteria: [
					{
						type: 'STRING',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'jo_hn'
					},
					{
						type: 'STRING',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'john'
					}
				]
			};

			const res = await Promise.all([FilterCriteria.match(testData[0], rule, false), FilterCriteria.match(testData[0], rule, true)]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				operator: 'OR',
				passed: true,
				reason: 'Rule "OR" check PASSED',
				results: [
					{
						criteriaValue: 'jo_hn',
						level: 'criteria',
						operator: 'CONTAINS',
						passed: false,
						reason: 'String "CONTAINS" check FAILED',
						value: 'john-doe'
					},
					{
						criteriaValue: 'john',
						level: 'criteria',
						operator: 'CONTAINS',
						passed: true,
						reason: 'String "CONTAINS" check PASSED',
						value: 'john-doe'
					}
				],
				level: 'rule'
			});
		});

		it('should return by criteria', async () => {
			const criteria: FilterCriteria.MatchInput = {
				type: 'STRING',
				operator: 'CONTAINS',
				path: ['name'],
				value: 'john'
			};

			const res = await Promise.all([
				FilterCriteria.match(testData[0], criteria, false),
				FilterCriteria.match(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				criteriaValue: 'john',
				level: 'criteria',
				operator: 'CONTAINS',
				passed: true,
				reason: 'String "CONTAINS" check PASSED',
				value: 'john-doe'
			});
		});
	});

	describe('matchMany', () => {
		describe('complex filters', () => {
			it('should handle nested AND/OR combinations', async () => {
				const filter: FilterCriteria.MatchInput = {
					operator: 'AND',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'BOOLEAN',
									operator: 'IS',
									path: ['active'],
									value: true
								}
							]
						},
						{
							operator: 'OR',
							criteria: [
								{
									type: 'STRING',
									operator: 'CONTAINS',
									path: ['name'],
									value: 'John'
								},
								{
									type: 'NUMBER',
									operator: 'LESS',
									path: ['age'],
									value: 30
								}
							]
						}
					]
				};

				const res = await FilterCriteria.matchMany(testData, filter);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});

			it('should handle nested OR/AND combinations', async () => {
				const filter: FilterCriteria.MatchInput = {
					operator: 'OR',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'BOOLEAN',
									operator: 'IS',
									path: ['active'],
									value: true
								}
							]
						},
						{
							operator: 'OR',
							criteria: [
								{
									type: 'STRING',
									operator: 'CONTAINS',
									path: ['name'],
									value: 'John'
								},
								{
									type: 'NUMBER',
									operator: 'LESS',
									path: ['age'],
									value: 30
								}
							]
						}
					]
				};

				const res = await FilterCriteria.matchMany(testData, filter);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});
		});

		describe('default values', () => {
			it('should use defaultValue when field is missing', async () => {
				const filter: FilterCriteria.MatchInput = {
					operator: 'AND',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'NUMBER',
									operator: 'GREATER-OR-EQUALS',
									path: ['missing'],
									value: 30,
									defaultValue: 40
								}
							]
						}
					]
				};

				const res = await FilterCriteria.matchMany(testData, filter);
				expect(res).toHaveLength(3);
			});

			it('should return false when field is missing and no defaultValue', async () => {
				const filter: FilterCriteria.MatchInput = {
					operator: 'AND',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'NUMBER',
									operator: 'GREATER-OR-EQUALS',
									path: ['missing'],
									value: 30
								}
							]
						}
					]
				};

				const res = await FilterCriteria.matchMany(testData, filter);
				expect(res).toHaveLength(0);
			});
		});
	});

	describe('applyRule', () => {
		it('should return', async () => {
			const rule: FilterCriteria.RuleInput = {
				operator: 'OR',
				criteria: [
					{
						type: 'STRING',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'jo_hn'
					},
					{
						type: 'STRING',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'john'
					}
				]
			};

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyRule(testData[0], rule, false),
				// @ts-expect-error
				FilterCriteria.applyRule(testData[0], rule, true)
			]);

			expect(res[0]).toEqual(false);
			expect(res[1]).toEqual({
				operator: 'OR',
				passed: false,
				reason: 'Rule "OR" check FAILED',
				results: [
					{
						criteriaValue: 'jo_hn',
						level: 'criteria',
						operator: 'CONTAINS',
						passed: false,
						reason: 'String "CONTAINS" check FAILED',
						value: 'John Doe'
					},
					{
						criteriaValue: 'john',
						level: 'criteria',
						operator: 'CONTAINS',
						passed: false,
						reason: 'String "CONTAINS" check FAILED',
						value: 'John Doe'
					}
				],
				level: 'rule'
			});
		});
	});

	describe('applyCriteria', () => {
		it('should handle undefined value', async () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'STRING',
				operator: 'CONTAINS',
				path: ['inexistent'],
				value: 'value'
			};

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(false);
			expect(res[1]).toEqual({
				criteriaValue: 'value',
				level: 'criteria',
				operator: 'CONTAINS',
				passed: false,
				reason: 'Value not found in path',
				value: null
			});
		});

		it('should handle dynamic value', async () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'ARRAY',
				operator: 'EXACTLY-MATCHES',
				path: ['tags'],
				value: { $path: ['tags'] }
			};

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				criteriaValue: ['developer', 'javascript'],
				level: 'criteria',
				operator: 'EXACTLY-MATCHES',
				passed: true,
				reason: 'Array "EXACTLY-MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle inexistent value', async () => {
			const criteria: FilterCriteria.CriteriaInput = {
				// @ts-expect-error
				type: 'INEXISTENT',
				operator: 'CONTAINS',
				path: ['name'],
				value: 'John'
			};

			const res = await Promise.all([
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria),
				// @ts-expect-error
				FilterCriteria.applyCriteria(testData[0], criteria, true)
			]);

			expect(res[0]).toEqual(false);
			expect(res[1]).toEqual({
				criteriaValue: null,
				level: 'criteria',
				operator: '',
				passed: false,
				reason: 'Unknown filter type',
				value: 'John Doe'
			});
		});

		describe('array', () => {
			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					path: ['tags'],
					value: ['Develóper', 'JavaScript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'EXACTLY-MATCHES',
					passed: true,
					reason: 'Array "EXACTLY-MATCHES" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = false', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					normalize: false,
					operator: 'EXACTLY-MATCHES',
					path: ['tags'],
					value: ['Develóper', 'JavaScript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['Develóper', 'JavaScript'],
					level: 'criteria',
					operator: 'EXACTLY-MATCHES',
					passed: false,
					reason: 'Array "EXACTLY-MATCHES" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES-ALL operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'INCLUDES-ALL',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES-ALL',
					passed: true,
					reason: 'Array "INCLUDES-ALL" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES-ANY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'INCLUDES-ANY',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES-ANY',
					passed: true,
					reason: 'Array "INCLUDES-ANY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'IS-EMPTY',
					path: ['tags'],
					value: []
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS-EMPTY',
					passed: false,
					reason: 'Array "IS-EMPTY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS-NOT-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'IS-NOT-EMPTY',
					path: ['tags'],
					value: []
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS-NOT-EMPTY',
					passed: true,
					reason: 'Array "IS-NOT-EMPTY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-INCLUDES-ALL operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'NOT-INCLUDES-ALL',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT-INCLUDES-ALL',
					passed: false,
					reason: 'Array "NOT-INCLUDES-ALL" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT-INCLUDES-ANY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'NOT-INCLUDES-ANY',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT-INCLUDES-ANY',
					passed: false,
					reason: 'Array "NOT-INCLUDES-ANY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE-EQUALS',
					path: ['tags'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-EQUALS',
					passed: true,
					reason: 'Array "SIZE-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE-GREATER',
					path: ['tags'],
					value: 1
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE-GREATER',
					passed: true,
					reason: 'Array "SIZE-GREATER" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE-GREATER-OR-EQUALS',
					path: ['tags'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-GREATER-OR-EQUALS',
					passed: true,
					reason: 'Array "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE-LESS',
					path: ['tags'],
					value: 3
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 3,
					level: 'criteria',
					operator: 'SIZE-LESS',
					passed: true,
					reason: 'Array "SIZE-LESS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE-LESS-OR-EQUALS',
					path: ['tags'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-LESS-OR-EQUALS',
					passed: true,
					reason: 'Array "SIZE-LESS-OR-EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});
		});

		describe('boolean', () => {
			it('should handle IS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'BOOLEAN',
					operator: 'IS',
					path: ['active'],
					value: true
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: true,
					level: 'criteria',
					operator: 'IS',
					passed: true,
					reason: 'Boolean "IS" check PASSED',
					value: true
				});
			});

			it('should handle IS-NOT operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'BOOLEAN',
					operator: 'IS-NOT',
					path: ['active'],
					value: true
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: true,
					level: 'criteria',
					operator: 'IS-NOT',
					passed: false,
					reason: 'Boolean "IS-NOT" check FAILED',
					value: true
				});
			});
		});

		describe('custom', () => {
			it('should handle', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'CUSTOM',
					value: async (item: any) => {
						return _.startsWith(item.name, 'John');
					}
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'Custom Criteria Function',
					level: 'criteria',
					operator: 'Custom Criteria Operator',
					passed: true,
					reason: 'Custom check PASSED',
					value: testData[0]
				});
			});
		});

		describe('custom registered', () => {
			it('should handle', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'CUSTOM',
					value: 'custom-criteria'
				};

				FilterCriteria.registerCustomCriteria('custom-criteria', async (item: any) => {
					return _.startsWith(item.name, 'John');
				});

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'custom-criteria',
					level: 'criteria',
					operator: 'Custom Criteria Operator',
					passed: true,
					reason: 'Custom "custom-criteria" check PASSED',
					value: testData[0]
				});
			});

			it('should handle inexistent', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'CUSTOM',
					value: 'inexistent'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: 'inexistent',
					level: 'criteria',
					operator: 'Custom Criteria Operator',
					passed: false,
					reason: 'Custom criteria not found',
					value: testData[0]
				});
			});
		});

		describe('date', () => {
			it('should handle AFTER operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'AFTER',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00+00:01'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '2022-12-31T23:59:00.000Z',
					level: 'criteria',
					operator: 'AFTER',
					passed: true,
					reason: 'Date "AFTER" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle AFTER-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'AFTER-OR-EQUALS',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00Z'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '2023-01-01T00:00:00.000Z',
					level: 'criteria',
					operator: 'AFTER-OR-EQUALS',
					passed: true,
					reason: 'Date "AFTER-OR-EQUALS" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BEFORE operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BEFORE',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00-00:01'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '2023-01-01T00:01:00.000Z',
					level: 'criteria',
					operator: 'BEFORE',
					passed: true,
					reason: 'Date "BEFORE" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BEFORE-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BEFORE-OR-EQUALS',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00Z'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
			});

			it('should handle BETWEEN operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BETWEEN',
					path: ['createdAt'],
					value: ['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z'],
					level: 'criteria',
					operator: 'BETWEEN',
					passed: true,
					reason: 'Date "BETWEEN" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});
		});

		describe('geo', () => {
			it('should handle IN-RADIUS operator with km unit', async () => {
				// From New York
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN-RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					}
				};

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
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					},
					level: 'criteria',
					operator: 'IN-RADIUS',
					passed: false,
					reason: 'Geo "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark[0]).toEqual(true);
				expect(resNewark[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					},
					level: 'criteria',
					operator: 'IN-RADIUS',
					passed: true,
					reason: 'Geo "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle IN-RADIUS operator with mi unit', async () => {
				// From New York
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN-RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 62, // ~100km in miles
						unit: 'mi'
					}
				};

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
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					},
					level: 'criteria',
					operator: 'IN-RADIUS',
					passed: false,
					reason: 'Geo "IN-RADIUS" check FAILED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resNewark[0]).toEqual(true);
				expect(resNewark[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					},
					level: 'criteria',
					operator: 'IN-RADIUS',
					passed: true,
					reason: 'Geo "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle NOT-IN-RADIUS operator with different units', async () => {
				// From New York
				const criteriaKm: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'NOT-IN-RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 3000,
						unit: 'km'
					}
				};

				// From New York
				const criteriaMi: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'NOT-IN-RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 1864, // ~3000km in miles
						unit: 'mi'
					}
				};

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
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 3000,
						unit: 'km'
					},
					level: 'criteria',
					operator: 'NOT-IN-RADIUS',
					passed: true,
					reason: 'Geo "NOT-IN-RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});

				expect(resMi[0]).toEqual(true);
				expect(resMi[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 1864,
						unit: 'mi'
					},
					level: 'criteria',
					operator: 'NOT-IN-RADIUS',
					passed: true,
					reason: 'Geo "NOT-IN-RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});
			});

			it('should default to km when unit is not specified', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN-RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100
					}
				};

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
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100
					},
					level: 'criteria',
					operator: 'IN-RADIUS',
					passed: true,
					reason: 'Geo "IN-RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});
		});

		describe('map', () => {
			it('should handle HAS-KEY operator with normalize = true', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					normalize: true,
					operator: 'HAS-KEY',
					path: ['map'],
					value: 'KÉY-1'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'key-1',
					level: 'criteria',
					operator: 'HAS-KEY',
					passed: true,
					reason: 'Map "HAS-KEY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS-KEY operator with normalize = false', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					normalize: false,
					operator: 'HAS-KEY',
					path: ['map'],
					value: 'KÉY-1'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: 'KÉY-1',
					level: 'criteria',
					operator: 'HAS-KEY',
					passed: false,
					reason: 'Map "HAS-KEY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS-VALUE operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'HAS-VALUE',
					path: ['map'],
					value: 'value-1'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'IS-EMPTY',
					path: ['map'],
					value: ''
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: '',
					level: 'criteria',
					operator: 'IS-EMPTY',
					passed: false,
					reason: 'Map "IS-EMPTY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle IS-NOT-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'IS-NOT-EMPTY',
					path: ['map'],
					value: ''
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '',
					level: 'criteria',
					operator: 'IS-NOT-EMPTY',
					passed: true,
					reason: 'Map "IS-NOT-EMPTY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE-EQUALS',
					path: ['map'],
					value: 1
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE-EQUALS',
					passed: true,
					reason: 'Map "SIZE-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE-GREATER',
					path: ['map'],
					value: 0
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 0,
					level: 'criteria',
					operator: 'SIZE-GREATER',
					passed: true,
					reason: 'Map "SIZE-GREATER" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE-GREATER-OR-EQUALS',
					path: ['map'],
					value: 1
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE-GREATER-OR-EQUALS',
					passed: true,
					reason: 'Map "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE-LESS',
					path: ['map'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-LESS',
					passed: true,
					reason: 'Map "SIZE-LESS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE-LESS-OR-EQUALS',
					path: ['map'],
					value: 1
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE-LESS-OR-EQUALS',
					passed: true,
					reason: 'Map "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});
		});

		describe('number', () => {
			it('should handle BETWEEN operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'BETWEEN',
					path: ['age'],
					value: [25, 30]
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: [25, 30],
					level: 'criteria',
					operator: 'BETWEEN',
					passed: true,
					reason: 'Number "BETWEEN" check PASSED',
					value: 25
				});
			});

			it('should handle EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'EQUALS',
					path: ['age'],
					value: 25
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 25,
					level: 'criteria',
					operator: 'EQUALS',
					passed: true,
					reason: 'Number "EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle GREATER operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 20
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 20,
					level: 'criteria',
					operator: 'GREATER',
					passed: true,
					reason: 'Number "GREATER" check PASSED',
					value: 25
				});
			});

			it('should handle GREATER-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'GREATER-OR-EQUALS',
					path: ['age'],
					value: 25
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 25,
					level: 'criteria',
					operator: 'GREATER-OR-EQUALS',
					passed: true,
					reason: 'Number "GREATER-OR-EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle LESS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'LESS',
					path: ['age'],
					value: 30
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 30,
					level: 'criteria',
					operator: 'LESS',
					passed: true,
					reason: 'Number "LESS" check PASSED',
					value: 25
				});
			});

			it('should handle LESS-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'LESS-OR-EQUALS',
					path: ['age'],
					value: 30
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 30,
					level: 'criteria',
					operator: 'LESS-OR-EQUALS',
					passed: true,
					reason: 'Number "LESS-OR-EQUALS" check PASSED',
					value: 25
				});
			});
		});

		describe('set', () => {
			it('should handle EXACTLY-MATCHES operator with normalize = true', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					normalize: true,
					operator: 'EXACTLY-MATCHES',
					path: ['tagsSet'],
					value: ['Develóper', 'JavaScript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'EXACTLY-MATCHES',
					passed: true,
					reason: 'Set "EXACTLY-MATCHES" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle EXACTLY-MATCHES operator with normalize = false', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					normalize: false,
					operator: 'EXACTLY-MATCHES',
					path: ['tagsSet'],
					value: ['Develóper', 'JavaScript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['Develóper', 'JavaScript'],
					level: 'criteria',
					operator: 'EXACTLY-MATCHES',
					passed: false,
					reason: 'Set "EXACTLY-MATCHES" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle HAS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'HAS',
					path: ['tagsSet'],
					value: 'developer'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'developer',
					level: 'criteria',
					operator: 'HAS',
					passed: true,
					reason: 'Set "HAS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle INCLUDES-ALL operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'INCLUDES-ALL',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES-ALL',
					passed: true,
					reason: 'Set "INCLUDES-ALL" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle INCLUDES-ANY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'INCLUDES-ANY',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES-ANY',
					passed: true,
					reason: 'Set "INCLUDES-ANY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'IS-EMPTY',
					path: ['tagsSet'],
					value: []
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS-EMPTY',
					passed: false,
					reason: 'Set "IS-EMPTY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS-NOT-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'IS-NOT-EMPTY',
					path: ['tagsSet'],
					value: []
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS-NOT-EMPTY',
					passed: true,
					reason: 'Set "IS-NOT-EMPTY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-INCLUDES-ALL operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'NOT-INCLUDES-ALL',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT-INCLUDES-ALL',
					passed: false,
					reason: 'Set "NOT-INCLUDES-ALL" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT-INCLUDES-ANY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'NOT-INCLUDES-ANY',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT-INCLUDES-ANY',
					passed: false,
					reason: 'Set "NOT-INCLUDES-ANY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE-EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-EQUALS',
					passed: true,
					reason: 'Set "SIZE-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-GREATER operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE-GREATER',
					path: ['tagsSet'],
					value: 1
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE-GREATER',
					passed: true,
					reason: 'Set "SIZE-GREATER" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-GREATER-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE-GREATER-OR-EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-GREATER-OR-EQUALS',
					passed: true,
					reason: 'Set "SIZE-GREATER-OR-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-LESS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE-LESS',
					path: ['tagsSet'],
					value: 3
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 3,
					level: 'criteria',
					operator: 'SIZE-LESS',
					passed: true,
					reason: 'Set "SIZE-LESS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE-LESS-OR-EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE-LESS-OR-EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE-LESS-OR-EQUALS',
					passed: true,
					reason: 'Set "SIZE-LESS-OR-EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});
		});

		describe('STRING', () => {
			it('should handle CONTAINS operator with normalize = true', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					normalize: true,
					operator: 'CONTAINS',
					path: ['name'],
					value: 'doe'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'doe',
					level: 'criteria',
					operator: 'CONTAINS',
					passed: true,
					reason: 'String "CONTAINS" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle CONTAINS operator with normalize = false', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					normalize: false,
					operator: 'CONTAINS',
					path: ['name'],
					value: 'doe'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: 'doe',
					level: 'criteria',
					operator: 'CONTAINS',
					passed: false,
					reason: 'String "CONTAINS" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle ENDS-WITH operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					operator: 'ENDS-WITH',
					path: ['name'],
					value: 'Doe'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'Doe',
					level: 'criteria',
					operator: 'ENDS-WITH',
					passed: true,
					reason: 'String "ENDS-WITH" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle EQUALS operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					operator: 'EQUALS',
					path: ['name'],
					value: 'John Doe'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'John Doe',
					level: 'criteria',
					operator: 'EQUALS',
					passed: true,
					reason: 'String "EQUALS" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle IS-EMPTY operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					operator: 'IS-EMPTY',
					path: ['name'],
					value: []
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS-EMPTY',
					passed: false,
					reason: 'String "IS-EMPTY" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle MATCHES-REGEX operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					operator: 'MATCHES-REGEX',
					path: ['name'],
					value: /john/i
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: /john/i,
					level: 'criteria',
					operator: 'MATCHES-REGEX',
					passed: true,
					reason: 'String "MATCHES-REGEX" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle STARTS-WITH operator', async () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'STRING',
					operator: 'STARTS-WITH',
					path: ['name'],
					value: 'John'
				};

				const res = await Promise.all([
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				]);

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'John',
					level: 'criteria',
					operator: 'STARTS-WITH',
					passed: true,
					reason: 'String "STARTS-WITH" check PASSED',
					value: 'John Doe'
				});
			});
		});
	});

	describe('convertToFilterInput', () => {
		it('should convert CriteriaInput to FilterInput', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'STRING',
				operator: 'EQUALS',
				path: ['name'],
				value: 'John Doe'
			};

			// @ts-expect-error
			const filterInput = FilterCriteria.convertToFilterInput(criteria);

			expect(filterInput).toEqual({
				input: {
					operator: 'AND',
					rules: [{ operator: 'AND', criteria: [criteria] }]
				},
				level: 'criteria'
			});
		});

		it('should convert RuleInput to FilterInput', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'STRING',
				operator: 'EQUALS',
				path: ['name'],
				value: 'John Doe'
			};

			const rule: FilterCriteria.RuleInput = {
				operator: 'AND',
				criteria: [criteria]
			};

			// @ts-expect-error
			const filterInput = FilterCriteria.convertToFilterInput(rule);
			expect(filterInput).toEqual({
				input: { operator: 'AND', rules: [rule] },
				level: 'rule'
			});
		});

		it('should convert FilterInput to FilterInput', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'STRING',
				operator: 'EQUALS',
				path: ['name'],
				value: 'John Doe'
			};

			const filterInput = {
				operator: 'AND',
				rules: [{ operator: 'AND', criteria: [criteria] }]
			};

			// @ts-expect-error
			expect(FilterCriteria.convertToFilterInput(filterInput)).toEqual({
				input: filterInput,
				level: 'filter'
			});
		});
	});

	describe('normalize', () => {
		it('should normalize array', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalize([1, 'Develóper', 3])).toEqual([1, 'developer', 3]);
		});

		it('should normalize boolean', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalize(true)).toEqual(true);
			// @ts-expect-error
			expect(FilterCriteria.normalize(false)).toEqual(false);
		});

		it('should normalize map', () => {
			expect(
				// @ts-expect-error
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
			// @ts-expect-error
			expect(FilterCriteria.normalize(123)).toEqual(123);
		});

		it('should normalize object', () => {
			expect(
				// @ts-expect-error
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
				// @ts-expect-error
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
			// @ts-expect-error
			expect(FilterCriteria.normalize(new Set(['1', 'Develóper']))).toEqual(new Set(['1', 'developer']));
		});

		it('should normalize string', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalize('Develóper')).toEqual('developer');
		});

		it('should normalize undefined', () => {
			// @ts-expect-error
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

	describe('registerCustomCriteria / unregisterCustomCriteria', () => {
		it('should register custom criteria', () => {
			FilterCriteria.registerCustomCriteria('custom', () => true);
			expect(FilterCriteria.customCriteria.size).toEqual(1);

			FilterCriteria.unregisterCustomCriteria('inexistent');
			expect(FilterCriteria.customCriteria.size).toEqual(1);

			FilterCriteria.unregisterCustomCriteria('custom');
			expect(FilterCriteria.customCriteria.size).toEqual(0);
		});
	});
});
