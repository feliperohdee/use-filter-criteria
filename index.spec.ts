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
		name: 'John Doe',
		tags: ['developer', 'javascript']
	},
	{
		active: false,
		age: 30,
		createdAt: '2023-03-01T00:00:00Z',
		id: 2,
		location: { lat: 34.0522, lng: -118.2437 },
		name: 'Jane Smith',
		tags: ['designer', 'ui/ux']
	},
	{
		active: true,
		age: 35,
		createdAt: '2023-06-01T00:00:00Z',
		id: 3,
		location: { lat: 51.5074, lng: -0.1278 },
		name: 'John Smith',
		tags: ['developer', 'python']
	}
];

describe('/index', () => {
	describe('apply', () => {
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

				const res = FilterCriteria.apply(testData, filter);
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

				const res = FilterCriteria.apply(testData, filter);
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

				const res = FilterCriteria.apply(testData, filter);
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

				const res = FilterCriteria.apply(testData, filter);
				expect(res).toHaveLength(0);
			});
		});
	});

	describe('applyMatch', () => {
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

			const res = [FilterCriteria.applyMatch(testData[0], filter, false), FilterCriteria.applyMatch(testData[0], filter, true)];

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

			const res = [FilterCriteria.applyMatch(testData[0], filter, false), FilterCriteria.applyMatch(testData[0], filter, true)];

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
		});

		describe('boolean', () => {
			it('should handle IS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'BOOLEAN',
					operator: 'IS',
					path: ['active'],
					value: true
				};

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
			it('should handle IN_RADIUS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'IN_RADIUS',
					path: ['location'],
					value: { lat: 40.7128, lng: -74.006 }
				};

				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: { lat: 40.7128, lng: -74.006 },
					level: 'criteria',
					operator: 'IN_RADIUS',
					passed: true,
					reason: 'Geo "IN_RADIUS" check PASSED',
					value: { lat: 40.7128, lng: -74.006 }
				});
			});

			it('should handle IN_RADIUS operator with getCoordinates', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					getCoordinates: (item: any) => {
						return [item.lat, item.lng];
					},
					operator: 'IN_RADIUS',
					path: ['location'],
					value: { lat: 40.7128, lng: -74.006 }
				};

				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(true);
				expect(res[1]).toEqual({
					criteriaValue: { lat: 40.7128, lng: -74.006 },
					level: 'criteria',
					operator: 'IN_RADIUS',
					passed: true,
					reason: 'Geo "IN_RADIUS" check PASSED',
					value: { lat: 40.7128, lng: -74.006 }
				});
			});

			it('should handle NOT_IN_RADIUS operator', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'GEO',
					operator: 'NOT_IN_RADIUS',
					path: ['location'],
					value: { lat: 40.7128, lng: -74.006 }
				};

				const res = [FilterCriteria.applyCriteria(testData[0], criteria), FilterCriteria.applyCriteria(testData[0], criteria, true)];

				expect(res[0]).toEqual(false);
				expect(res[1]).toEqual({
					criteriaValue: { lat: 40.7128, lng: -74.006 },
					level: 'criteria',
					operator: 'NOT_IN_RADIUS',
					passed: false,
					reason: 'Geo "NOT_IN_RADIUS" check FAILED',
					value: { lat: 40.7128, lng: -74.006 }
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

		describe('text', () => {
			it('should handle CONTAINS operator with normalize = true', () => {
				const criteria: FilterCriteria.CriteriaInput = {
					type: 'TEXT',
					normalize: true,
					operator: 'CONTAINS',
					path: ['name'],
					value: 'doe'
				};

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
			expect(FilterCriteria.normalize([1, 'Develóper', 3])).toEqual([1, 'developer', 3]);
		});

		it('should normalize boolean', () => {
			expect(FilterCriteria.normalize(true)).toEqual(true);
			expect(FilterCriteria.normalize(false)).toEqual(false);
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

		it('should normalize text', () => {
			expect(FilterCriteria.normalize('Develóper')).toEqual('developer');
		});

		it('should normalize undefined', () => {
			expect(FilterCriteria.normalize(undefined)).toEqual(undefined);
		});
	});

	describe('normalizeText', () => {
		it('should normalize text', () => {
			expect(FilterCriteria.normalizeText('Develóper')).toEqual('developer');
			expect(FilterCriteria.normalizeText('Devel  óper')).toEqual('devel-oper');
		});
	});
});
