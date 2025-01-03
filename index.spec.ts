import _ from 'lodash';
import { describe, expect, it, should } from 'vitest';

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
									source: ['active'],
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
									source: ['name'],
									value: 'John'
								},
								{
									type: 'NUMBER',
									operator: 'LESS',
									source: ['age'],
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
									source: ['active'],
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
									source: ['name'],
									value: 'John'
								},
								{
									type: 'NUMBER',
									operator: 'LESS',
									source: ['age'],
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
									operator: 'GREATER-EQUALS',
									source: ['missing'],
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
									operator: 'GREATER-EQUALS',
									source: ['missing'],
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

	describe('array filters', () => {
		it('should handle EXACTLY_MATCHES operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'EXACTLY_MATCHES',
								source: ['tags'],
								value: ['Develóper', 'JavaScript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([1]);
		});

		it('should handle EXACTLY_MATCHES operator without normalize', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'EXACTLY_MATCHES',
								normalize: false,
								source: ['tags'],
								value: ['Develóper', 'JavaScript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(0);
		});

		it('should handle INCLUDES_ALL operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'INCLUDES_ALL',
								source: ['tags'],
								value: ['developer', 'javascript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);

			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([1]);
		});

		it('should handle INCLUDES_ANY operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'INCLUDES_ANY',
								source: ['tags'],
								value: ['developer', 'javascript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([1, 3]);
		});

		it('should handle IS_EMPTY operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'IS_EMPTY',
								source: ['tags'],
								value: []
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(0);
		});

		it('should handle IS_NOT_EMPTY operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'IS_NOT_EMPTY',
								source: ['tags'],
								value: []
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(3);
			expect(_.map(res, 'id').sort()).toEqual([1, 2, 3]);
		});

		it('should handle NOT_INCLUDES_ALL operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'NOT_INCLUDES_ALL',
								source: ['tags'],
								value: ['developer', 'javascript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([2, 3]);
		});

		it('should handle NOT_INCLUDES_ANY operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'ARRAY',
								operator: 'NOT_INCLUDES_ANY',
								source: ['tags'],
								value: ['developer', 'javascript']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([2]);
		});
	});

	describe('boolean filters', () => {
		it('should filter by IS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'BOOLEAN',
								operator: 'IS',
								source: ['active'],
								value: true
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([1, 3]);
		});

		it('should filter by IS-NOT operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'BOOLEAN',
								operator: 'IS-NOT',
								source: ['active'],
								value: true
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([2]);
		});
	});

	describe('date filters', () => {
		it('should filter by AFTER operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'DATE',
								operator: 'AFTER',
								source: ['createdAt'],
								value: '2023-01-01T12:00:00Z'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([2, 3]);
		});

		it('should filter by BEFORE operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'DATE',
								operator: 'BEFORE',
								source: ['createdAt'],
								value: '2023-01-01T12:00:00Z'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([1]);
		});

		it('should filter by BETWEEN operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'DATE',
								operator: 'BETWEEN',
								source: ['createdAt'],
								value: ['2023-01-01T12:00:00Z', '2023-03-01T00:00:00Z']
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([2]);
		});
	});

	describe('geo filters', () => {
		it('should filter by IN-RADIUS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'GEO',
								operator: 'IN-RADIUS',
								source: ['location'],
								value: { lat: 40.7128, lng: -74.006 }
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([1]);
		});
	});

	describe('number filters', () => {
		it('should filter by BETWEEN operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'BETWEEN',
								source: ['age'],
								value: [25, 30]
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([1, 2]);
		});

		it('should filter by EQUALS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'EQUALS',
								source: ['age'],
								value: 30
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([2]);
		});

		it('should filter by GREATER operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'GREATER',
								source: ['age'],
								value: 30
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([3]);
		});

		it('should filter by GREATER-EQUALS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'GREATER-EQUALS',
								source: ['age'],
								value: 30
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([2, 3]);
		});

		it('should filter by LESS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'LESS',
								source: ['age'],
								value: 30
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([1]);
		});

		it('should filter by LESS-EQUALS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'NUMBER',
								operator: 'LESS-EQUALS',
								source: ['age'],
								value: 30
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([1, 2]);
		});
	});

	describe('text filters', () => {
		it('should filter by CONTAINS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								source: ['name'],
								value: 'smith'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([2, 3]);
		});

		it('should filter by CONTAINS operator without normalize', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'CONTAINS',
								normalize: false,
								source: ['name'],
								value: 'SMÍTH'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(0);
		});

		it('should filter by ENDS-WITH operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'ENDS-WITH',
								source: ['name'],
								value: 'Smith'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([2, 3]);
		});

		it('should filter by EQUALS operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'EQUALS',
								source: ['name'],
								value: 'John Smith'
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(1);
			expect(_.map(res, 'id').sort()).toEqual([3]);
		});

		it('should filter by IS-EMPTY operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'IS-EMPTY',
								source: ['name'],
								value: []
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(0);
		});

		it('should filter by MATCHES-REGEX operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'MATCHES-REGEX',
								source: ['name'],
								value: /john/i
							}
						]
					}
				]
			};

			const res = FilterCriteria.apply(testData, filter);
			expect(res).toHaveLength(2);
			expect(_.map(res, 'id').sort()).toEqual([1, 3]);
		});

		it('should filter by STARTS-WITH operator', () => {
			const filter: FilterCriteria.FilterInput = {
				operator: 'AND',
				rules: [
					{
						operator: 'AND',
						criteria: [
							{
								type: 'TEXT',
								operator: 'STARTS-WITH',
								source: ['name'],
								value: 'John'
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
