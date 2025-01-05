import _ from 'lodash';
import { describe, expect, it } from 'vitest';

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
	describe('filter', () => {
		describe('complex filters', () => {
			it('should handle nested AND/OR combinations', () => {
				const filter: FilterCriteria.FilterInput = {
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
									type: 'TEXT',
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

				const res = FilterCriteria.filter(testData, filter);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});

			it('should handle nested OR/AND combinations', () => {
				const filter: FilterCriteria.FilterInput = {
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
									type: 'TEXT',
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

				const res = FilterCriteria.filter(testData, filter);
				expect(res).toHaveLength(2);
				expect(_.map(res, 'id').sort()).toEqual([1, 3]);
			});
		});

		describe('default values', () => {
			it('should use defaultValue when field is missing', () => {
				const filter: FilterCriteria.FilterInput = {
					operator: 'AND',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'NUMBER',
									operator: 'GREATER_OR_EQUALS',
									path: ['missing'],
									value: 30,
									defaultValue: 40
								}
							]
						}
					]
				};

				const res = FilterCriteria.filter(testData, filter);
				expect(res).toHaveLength(3);
			});

			it('should return false when field is missing and no defaultValue', () => {
				const filter: FilterCriteria.FilterInput = {
					operator: 'AND',
					rules: [
						{
							operator: 'AND',
							criteria: [
								{
									type: 'NUMBER',
									operator: 'GREATER_OR_EQUALS',
									path: ['missing'],
									value: 30
								}
							]
						}
					]
				};

				const res = FilterCriteria.filter(testData, filter);
				expect(res).toHaveLength(0);
			});
		});
	});

	describe('match', () => {
		it('should return with AND', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'jo_hn'
							},
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'john'
							}
						]
					};
				})
			};

			const res = [FilterCriteria.match(testData[0], filter, false), FilterCriteria.match(testData[0], filter, true)];

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				level: 'match',
				operator: 'AND',
				passed: true,
				reason: 'Match "AND" check PASSED',
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
								reason: 'Text "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								criteriaValue: 'john',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: true,
								reason: 'Text "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						],
						level: 'rule'
					};
				})
			});
		});

		it('should return with OR', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'OR',
				rules: _.times(2, () => {
					return {
						operator: 'OR',
						criteria: [
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'jo_hn'
							},
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								path: ['name'],
								value: 'john'
							}
						]
					};
				})
			};

			const res = [FilterCriteria.match(testData[0], filter, false), FilterCriteria.match(testData[0], filter, true)];

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				level: 'match',
				operator: 'OR',
				passed: true,
				reason: 'Match "OR" check PASSED',
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
								reason: 'Text "CONTAINS" check FAILED',
								value: 'john-doe'
							},
							{
								criteriaValue: 'john',
								level: 'criteria',
								operator: 'CONTAINS',
								passed: true,
								reason: 'Text "CONTAINS" check PASSED',
								value: 'john-doe'
							}
						],
						level: 'rule'
					};
				})
			});
		});
	});

	describe('applyRule', () => {
		it('should return', () => {
			const rule: FilterCriteria.RuleInput = {
				operator: 'OR',
				criteria: [
					{
						type: 'TEXT',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'jo_hn'
					},
					{
						type: 'TEXT',
						operator: 'CONTAINS',
						path: ['name'],
						value: 'john'
					}
				]
			};

			// @ts-expect-error
			const res = [FilterCriteria.applyRule(testData[0], rule, false), FilterCriteria.applyRule(testData[0], rule, true)];

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
						reason: 'Text "CONTAINS" check FAILED',
						value: 'John Doe'
					},
					{
						criteriaValue: 'john',
						level: 'criteria',
						operator: 'CONTAINS',
						passed: false,
						reason: 'Text "CONTAINS" check FAILED',
						value: 'John Doe'
					}
				],
				level: 'rule'
			});
		});
	});

	describe('applyCriteria', () => {
		it('should handle undefined value', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'TEXT',
				operator: 'CONTAINS',
				path: ['inexistent'],
				value: 'value'
			};

			// @ts-expect-error
			const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

		it('should handle dynamic value', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				type: 'ARRAY',
				operator: 'EXACTLY_MATCHES',
				path: ['tags'],
				value: { $path: ['tags'] }
			};

			// @ts-expect-error
			const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

			expect(res[0]).toEqual(true);
			expect(res[1]).toEqual({
				criteriaValue: ['developer', 'javascript'],
				level: 'criteria',
				operator: 'EXACTLY_MATCHES',
				passed: true,
				reason: 'Array "EXACTLY_MATCHES" check PASSED',
				value: ['developer', 'javascript']
			});
		});

		it('should handle inexistent value', () => {
			const criteria: FilterCriteria.CriteriaInput = {
				// @ts-expect-error
				type: 'INEXISTENT',
				operator: 'CONTAINS',
				path: ['name'],
				value: 'John'
			};

			// @ts-expect-error
			const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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
			it('should handle EXACTLY_MATCHES operator with normalize = true', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					normalize: true,
					operator: 'EXACTLY_MATCHES',
					path: ['tags'],
					value: ['Develóper', 'JavaScript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'EXACTLY_MATCHES',
					passed: true,
					reason: 'Array "EXACTLY_MATCHES" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle EXACTLY_MATCHES operator with normalize = false', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					normalize: false,
					operator: 'EXACTLY_MATCHES',
					path: ['tags'],
					value: ['Develóper', 'JavaScript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['Develóper', 'JavaScript'],
					level: 'criteria',
					operator: 'EXACTLY_MATCHES',
					passed: false,
					reason: 'Array "EXACTLY_MATCHES" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES_ALL operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'INCLUDES_ALL',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES_ALL',
					passed: true,
					reason: 'Array "INCLUDES_ALL" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle INCLUDES_ANY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'INCLUDES_ANY',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES_ANY',
					passed: true,
					reason: 'Array "INCLUDES_ANY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'IS_EMPTY',
					path: ['tags'],
					value: []
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS_EMPTY',
					passed: false,
					reason: 'Array "IS_EMPTY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle IS_NOT_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'IS_NOT_EMPTY',
					path: ['tags'],
					value: []
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS_NOT_EMPTY',
					passed: true,
					reason: 'Array "IS_NOT_EMPTY" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT_INCLUDES_ALL operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'NOT_INCLUDES_ALL',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT_INCLUDES_ALL',
					passed: false,
					reason: 'Array "NOT_INCLUDES_ALL" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle NOT_INCLUDES_ANY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'NOT_INCLUDES_ANY',
					path: ['tags'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT_INCLUDES_ANY',
					passed: false,
					reason: 'Array "NOT_INCLUDES_ANY" check FAILED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE_EQUALS',
					path: ['tags'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_EQUALS',
					passed: true,
					reason: 'Array "SIZE_EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE_GREATER operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE_GREATER',
					path: ['tags'],
					value: 1
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE_GREATER',
					passed: true,
					reason: 'Array "SIZE_GREATER" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE_GREATER_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE_GREATER_OR_EQUALS',
					path: ['tags'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_GREATER_OR_EQUALS',
					passed: true,
					reason: 'Array "SIZE_GREATER_OR_EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE_LESS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE_LESS',
					path: ['tags'],
					value: 3
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 3,
					level: 'criteria',
					operator: 'SIZE_LESS',
					passed: true,
					reason: 'Array "SIZE_LESS" check PASSED',
					value: ['developer', 'javascript']
				});
			});

			it('should handle SIZE_LESS_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'ARRAY',
					operator: 'SIZE_LESS_OR_EQUALS',
					path: ['tags'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_LESS_OR_EQUALS',
					passed: true,
					reason: 'Array "SIZE_LESS_OR_EQUALS" check PASSED',
					value: ['developer', 'javascript']
				});
			});
		});

		describe('boolean', () => {
			it('should handle IS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'BOOLEAN',
					operator: 'IS',
					path: ['active'],
					value: true
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle IS_NOT operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'BOOLEAN',
					operator: 'IS_NOT',
					path: ['active'],
					value: true
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: true,
					level: 'criteria',
					operator: 'IS_NOT',
					passed: false,
					reason: 'Boolean "IS_NOT" check FAILED',
					value: true
				});
			});
		});

		describe('date', () => {
			it('should handle AFTER operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'AFTER',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00+00:01'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle AFTER_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'AFTER_OR_EQUALS',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00Z'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '2023-01-01T00:00:00.000Z',
					level: 'criteria',
					operator: 'AFTER_OR_EQUALS',
					passed: true,
					reason: 'Date "AFTER_OR_EQUALS" check PASSED',
					value: '2023-01-01T00:00:00Z'
				});
			});

			it('should handle BEFORE operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BEFORE',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00-00:01'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle BEFORE_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BEFORE_OR_EQUALS',
					path: ['createdAt'],
					value: '2023-01-01T00:00:00Z'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
			});

			it('should handle BETWEEN operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'DATE',
					operator: 'BETWEEN',
					path: ['createdAt'],
					value: ['2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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
			it('should handle IN_RADIUS operator with km unit', () => {
				// From New York
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN_RADIUS',
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

				// @ts-expect-error
				const resLA = [FilterCriteria.applyCriteria(LAPoint, criteria), FilterCriteria.applyCriteria(LAPoint, criteria, true)];
				// @ts-expect-error
				const resNewark = [FilterCriteria.applyCriteria(newarkPoint, criteria), FilterCriteria.applyCriteria(newarkPoint, criteria, true)];

				expect(resLA[0]).toEqual(false);
				expect(resLA[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100,
						unit: 'km'
					},
					level: 'criteria',
					operator: 'IN_RADIUS',
					passed: false,
					reason: 'Geo "IN_RADIUS" check FAILED',
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
					operator: 'IN_RADIUS',
					passed: true,
					reason: 'Geo "IN_RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle IN_RADIUS operator with mi unit', () => {
				// From New York
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN_RADIUS',
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

				// @ts-expect-error
				const resLA = [FilterCriteria.applyCriteria(LAPoint, criteria), FilterCriteria.applyCriteria(LAPoint, criteria, true)];
				const resNewark = [
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(newarkPoint, criteria, true)
				];

				expect(resLA[0]).toEqual(false);
				expect(resLA[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 62,
						unit: 'mi'
					},
					level: 'criteria',
					operator: 'IN_RADIUS',
					passed: false,
					reason: 'Geo "IN_RADIUS" check FAILED',
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
					operator: 'IN_RADIUS',
					passed: true,
					reason: 'Geo "IN_RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});

			it('should handle NOT_IN_RADIUS operator with different units', () => {
				// From New York
				const criteriaKm: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'NOT_IN_RADIUS',
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
					operator: 'NOT_IN_RADIUS',
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

				// @ts-expect-error
				const resKm = [FilterCriteria.applyCriteria(LAPoint, criteriaKm), FilterCriteria.applyCriteria(LAPoint, criteriaKm, true)];
				// @ts-expect-error
				const resMi = [FilterCriteria.applyCriteria(LAPoint, criteriaMi), FilterCriteria.applyCriteria(LAPoint, criteriaMi, true)];

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
					operator: 'NOT_IN_RADIUS',
					passed: true,
					reason: 'Geo "NOT_IN_RADIUS" check PASSED',
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
					operator: 'NOT_IN_RADIUS',
					passed: true,
					reason: 'Geo "NOT_IN_RADIUS" check PASSED',
					value: { lat: 34.0522, lng: -118.2437 }
				});
			});

			it('should default to km when unit is not specified', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN_RADIUS',
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

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(newarkPoint, criteria), FilterCriteria.applyCriteria(newarkPoint, criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 100
					},
					level: 'criteria',
					operator: 'IN_RADIUS',
					passed: true,
					reason: 'Geo "IN_RADIUS" check PASSED',
					value: { lat: 40.7357, lng: -74.1724 }
				});
			});
		});

		describe('map', () => {
			it('should handle HAS_KEY operator with normalize = true', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					normalize: true,
					operator: 'HAS_KEY',
					path: ['map'],
					value: 'KÉY-1'
				};

				const res = [
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'key-1',
					level: 'criteria',
					operator: 'HAS_KEY',
					passed: true,
					reason: 'Map "HAS_KEY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS_KEY operator with normalize = false', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					normalize: false,
					operator: 'HAS_KEY',
					path: ['map'],
					value: 'KÉY-1'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: 'KÉY-1',
					level: 'criteria',
					operator: 'HAS_KEY',
					passed: false,
					reason: 'Map "HAS_KEY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle HAS_VALUE operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'HAS_VALUE',
					path: ['map'],
					value: 'value-1'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
			});

			it('should handle IS_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'IS_EMPTY',
					path: ['map'],
					value: ''
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: '',
					level: 'criteria',
					operator: 'IS_EMPTY',
					passed: false,
					reason: 'Map "IS_EMPTY" check FAILED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle IS_NOT_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'IS_NOT_EMPTY',
					path: ['map'],
					value: ''
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: '',
					level: 'criteria',
					operator: 'IS_NOT_EMPTY',
					passed: true,
					reason: 'Map "IS_NOT_EMPTY" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE_EQUALS',
					path: ['map'],
					value: 1
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE_EQUALS',
					passed: true,
					reason: 'Map "SIZE_EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE_GREATER operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE_GREATER',
					path: ['map'],
					value: 0
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 0,
					level: 'criteria',
					operator: 'SIZE_GREATER',
					passed: true,
					reason: 'Map "SIZE_GREATER" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE_GREATER_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE_GREATER_OR_EQUALS',
					path: ['map'],
					value: 1
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE_GREATER_OR_EQUALS',
					passed: true,
					reason: 'Map "SIZE_GREATER_OR_EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE_LESS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE_LESS',
					path: ['map'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_LESS',
					passed: true,
					reason: 'Map "SIZE_LESS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});

			it('should handle SIZE_LESS_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'MAP',
					operator: 'SIZE_LESS_OR_EQUALS',
					path: ['map'],
					value: 1
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE_LESS_OR_EQUALS',
					passed: true,
					reason: 'Map "SIZE_LESS_OR_EQUALS" check PASSED',
					value: new Map([['key-1', 'value-1']])
				});
			});
		});

		describe('number', () => {
			it('should handle BETWEEN operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'BETWEEN',
					path: ['age'],
					value: [25, 30]
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'EQUALS',
					path: ['age'],
					value: 25
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle GREATER operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 20
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle GREATER_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'GREATER_OR_EQUALS',
					path: ['age'],
					value: 25
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 25,
					level: 'criteria',
					operator: 'GREATER_OR_EQUALS',
					passed: true,
					reason: 'Number "GREATER_OR_EQUALS" check PASSED',
					value: 25
				});
			});

			it('should handle LESS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'LESS',
					path: ['age'],
					value: 30
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

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

			it('should handle LESS_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'NUMBER',
					operator: 'LESS_OR_EQUALS',
					path: ['age'],
					value: 30
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 30,
					level: 'criteria',
					operator: 'LESS_OR_EQUALS',
					passed: true,
					reason: 'Number "LESS_OR_EQUALS" check PASSED',
					value: 25
				});
			});
		});

		describe('set', () => {
			it('should handle EXACTLY_MATCHES operator with normalize = true', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					normalize: true,
					operator: 'EXACTLY_MATCHES',
					path: ['tagsSet'],
					value: ['Develóper', 'JavaScript']
				};

				const res = [
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'EXACTLY_MATCHES',
					passed: true,
					reason: 'Set "EXACTLY_MATCHES" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle EXACTLY_MATCHES operator with normalize = false', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					normalize: false,
					operator: 'EXACTLY_MATCHES',
					path: ['tagsSet'],
					value: ['Develóper', 'JavaScript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['Develóper', 'JavaScript'],
					level: 'criteria',
					operator: 'EXACTLY_MATCHES',
					passed: false,
					reason: 'Set "EXACTLY_MATCHES" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle HAS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'HAS',
					path: ['tagsSet'],
					value: 'developer'
				};

				const res = [
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria),
					// @ts-expect-error
					FilterCriteria.applyCriteria(testData[0], criteria, true)
				];

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

			it('should handle INCLUDES_ALL operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'INCLUDES_ALL',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES_ALL',
					passed: true,
					reason: 'Set "INCLUDES_ALL" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle INCLUDES_ANY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'INCLUDES_ANY',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'INCLUDES_ANY',
					passed: true,
					reason: 'Set "INCLUDES_ANY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'IS_EMPTY',
					path: ['tagsSet'],
					value: []
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS_EMPTY',
					passed: false,
					reason: 'Set "IS_EMPTY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle IS_NOT_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'IS_NOT_EMPTY',
					path: ['tagsSet'],
					value: []
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS_NOT_EMPTY',
					passed: true,
					reason: 'Set "IS_NOT_EMPTY" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT_INCLUDES_ALL operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'NOT_INCLUDES_ALL',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT_INCLUDES_ALL',
					passed: false,
					reason: 'Set "NOT_INCLUDES_ALL" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle NOT_INCLUDES_ANY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'NOT_INCLUDES_ANY',
					path: ['tagsSet'],
					value: ['developer', 'javascript']
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: ['developer', 'javascript'],
					level: 'criteria',
					operator: 'NOT_INCLUDES_ANY',
					passed: false,
					reason: 'Set "NOT_INCLUDES_ANY" check FAILED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE_EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_EQUALS',
					passed: true,
					reason: 'Set "SIZE_EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE_GREATER operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE_GREATER',
					path: ['tagsSet'],
					value: 1
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 1,
					level: 'criteria',
					operator: 'SIZE_GREATER',
					passed: true,
					reason: 'Set "SIZE_GREATER" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE_GREATER_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE_GREATER_OR_EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_GREATER_OR_EQUALS',
					passed: true,
					reason: 'Set "SIZE_GREATER_OR_EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE_LESS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE_LESS',
					path: ['tagsSet'],
					value: 3
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 3,
					level: 'criteria',
					operator: 'SIZE_LESS',
					passed: true,
					reason: 'Set "SIZE_LESS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});

			it('should handle SIZE_LESS_OR_EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'SET',
					operator: 'SIZE_LESS_OR_EQUALS',
					path: ['tagsSet'],
					value: 2
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 2,
					level: 'criteria',
					operator: 'SIZE_LESS_OR_EQUALS',
					passed: true,
					reason: 'Set "SIZE_LESS_OR_EQUALS" check PASSED',
					value: new Set(['developer', 'javascript'])
				});
			});
		});

		describe('text', () => {
			it('should handle CONTAINS operator with normalize = true', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					normalize: true,
					operator: 'CONTAINS',
					path: ['name'],
					value: 'doe'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'doe',
					level: 'criteria',
					operator: 'CONTAINS',
					passed: true,
					reason: 'Text "CONTAINS" check PASSED',
					value: 'john-doe'
				});
			});

			it('should handle CONTAINS operator with normalize = false', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					normalize: false,
					operator: 'CONTAINS',
					path: ['name'],
					value: 'doe'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: 'doe',
					level: 'criteria',
					operator: 'CONTAINS',
					passed: false,
					reason: 'Text "CONTAINS" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle ENDS_WITH operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					operator: 'ENDS_WITH',
					path: ['name'],
					value: 'Doe'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'Doe',
					level: 'criteria',
					operator: 'ENDS_WITH',
					passed: true,
					reason: 'Text "ENDS_WITH" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle EQUALS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					operator: 'EQUALS',
					path: ['name'],
					value: 'John Doe'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'John Doe',
					level: 'criteria',
					operator: 'EQUALS',
					passed: true,
					reason: 'Text "EQUALS" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle IS_EMPTY operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					operator: 'IS_EMPTY',
					path: ['name'],
					value: []
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: [],
					level: 'criteria',
					operator: 'IS_EMPTY',
					passed: false,
					reason: 'Text "IS_EMPTY" check FAILED',
					value: 'John Doe'
				});
			});

			it('should handle MATCHES_REGEX operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					operator: 'MATCHES_REGEX',
					path: ['name'],
					value: /john/i
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: /john/i,
					level: 'criteria',
					operator: 'MATCHES_REGEX',
					passed: true,
					reason: 'Text "MATCHES_REGEX" check PASSED',
					value: 'John Doe'
				});
			});

			it('should handle STARTS_WITH operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					operator: 'STARTS_WITH',
					path: ['name'],
					value: 'John'
				};

				// @ts-expect-error
				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: 'John',
					level: 'criteria',
					operator: 'STARTS_WITH',
					passed: true,
					reason: 'Text "STARTS_WITH" check PASSED',
					value: 'John Doe'
				});
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

		it('should normalize text', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalize('Develóper')).toEqual('developer');
		});

		it('should normalize undefined', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalize(undefined)).toEqual(undefined);
		});
	});

	describe('normalizeText', () => {
		it('should normalize text', () => {
			// @ts-expect-error
			expect(FilterCriteria.normalizeText('Develóper')).toEqual('developer');
			// @ts-expect-error
			expect(FilterCriteria.normalizeText('Devel  óper')).toEqual('devel-oper');
		});
	});
});
