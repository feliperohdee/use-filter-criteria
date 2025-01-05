import _ from 'lodash';
import z from 'zod';

const filterLogicalOperator = z.enum(['AND', 'OR']);
const filterOperator = {
	array: z.enum(['EXACTLY_MATCHES', 'INCLUDES_ALL', 'INCLUDES_ANY', 'IS_EMPTY', 'IS_NOT_EMPTY', 'NOT_INCLUDES_ALL', 'NOT_INCLUDES_ANY']),
	boolean: z.enum(['IS', 'IS_NOT']),
	date: z.enum(['AFTER', 'AFTER_OR_EQUALS', 'BEFORE', 'BEFORE_OR_EQUALS', 'BETWEEN']),
	geo: z.enum(['IN_RADIUS', 'NOT_IN_RADIUS']),
	number: z.enum(['BETWEEN', 'EQUALS', 'GREATER', 'GREATER_OR_EQUALS', 'LESS', 'LESS_OR_EQUALS']),
	text: z.enum(['CONTAINS', 'ENDS_WITH', 'EQUALS', 'IS_EMPTY', 'MATCHES_REGEX', 'STARTS_WITH'])
};

const filterValue = (schema: z.ZodSchema) => {
	return z.union([schema, z.object({ $path: z.array(z.string()) })]);
};

const filterCriteria = z.discriminatedUnion('type', [
	z.object({
		defaultValue: z.array(z.unknown()).default([]),
		normalize: z.boolean().default(true),
		operator: filterOperator.array,
		path: z.array(z.string()),
		type: z.literal('ARRAY'),
		value: filterValue(z.array(z.unknown()))
	}),
	z.object({
		defaultValue: z.boolean().default(false),
		operator: filterOperator.boolean,
		path: z.array(z.string()),
		type: z.literal('BOOLEAN'),
		value: filterValue(z.boolean())
	}),
	z.object({
		defaultValue: z
			.string()
			.datetime()
			.default(() => {
				return new Date().toISOString();
			}),
		operator: filterOperator.date,
		path: z.array(z.string()),
		type: z.literal('DATE'),
		value: filterValue(z.union([z.string().datetime(), z.tuple([z.string().datetime(), z.string().datetime()])]))
	}),
	z.object({
		defaultValue: z.record(z.number()).default({ lat: 0, lng: 0 }),
		getCoordinates: z
			.function()
			.args(z.record(z.number()))
			.returns(z.tuple([z.number(), z.number()]))
			.optional(),
		operator: filterOperator.geo,
		path: z.array(z.string()),
		type: z.literal('GEO'),
		value: filterValue(
			z.object({
				lat: z.number(),
				lng: z.number(),
				radius: z.number().optional(),
				unit: z.enum(['km', 'mi']).optional()
			})
		)
	}),
	z.object({
		defaultValue: z.number().default(0),
		operator: filterOperator.number,
		path: z.array(z.string()),
		type: z.literal('NUMBER'),
		value: filterValue(z.union([z.number(), z.array(z.number())]))
	}),
	z.object({
		defaultValue: z.string().default(''),
		normalize: z.boolean().default(true),
		operator: filterOperator.text,
		path: z.array(z.string()),
		type: z.literal('TEXT'),
		value: z.union([z.string(), z.array(z.string()), z.instanceof(RegExp)])
	})
]);

const filterRule = z.object({
	criteria: z.array(filterCriteria),
	operator: filterLogicalOperator
});

const filter = z.object({
	operator: filterLogicalOperator,
	rules: z.array(filterRule)
});

namespace FilterCriteria {
	export type Criteria = z.infer<typeof filterCriteria>;
	export type CriteriaInput = z.input<typeof filterCriteria>;
	export type Filter = z.infer<typeof filter>;
	export type FilterInput = z.input<typeof filter>;
	export type FilterOperators = {
		[K in keyof typeof filterOperator]: z.infer<(typeof filterOperator)[K]>;
	};
	export type LogicalOperator = z.infer<typeof filterLogicalOperator>;
	export type Rule = z.infer<typeof filterRule>;
	export type RuleInput = z.input<typeof filterRule>;
	export type CriteriaResult = {
		criteriaValue: any;
		level: 'criteria';
		operator: string;
		passed: boolean;
		reason: string;
		value: any;
	};

	export type MatchResult = {
		level: 'match';
		operator: LogicalOperator;
		passed: boolean;
		reason: string;
		results: RuleResult[];
	};

	export type RuleResult = {
		level: 'rule';
		operator: LogicalOperator;
		passed: boolean;
		reason: string;
		results: CriteriaResult[];
	};
}

class FilterCriteria {
	static apply(data: any[], input: FilterCriteria.FilterInput): any[] {
		input = filter.parse(input);

		return _.filter(data, item => {
			const ruleResults = _.map(input.rules, rule => {
				return this.applyRule(item, rule);
			}) as boolean[];

			return input.operator === 'AND' ? _.every(ruleResults, Boolean) : _.some(ruleResults, Boolean);
		});
	}

	static applyMatch(data: any, input: FilterCriteria.FilterInput, detailed: boolean = false): boolean | FilterCriteria.MatchResult {
		input = filter.parse(input);

		const ruleResults = _.map(input.rules, rule => {
			return this.applyRule(data, rule, detailed);
		});

		const passed =
			input.operator === 'AND'
				? _.every(ruleResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					})
				: _.some(ruleResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					});

		if (detailed) {
			return {
				level: 'match',
				operator: input.operator,
				passed,
				reason: `Match "${input.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
				results: ruleResults as FilterCriteria.RuleResult[]
			};
		}

		return passed;
	}

	static applyRule(item: any, rule: FilterCriteria.RuleInput, detailed: boolean = false): boolean | FilterCriteria.RuleResult {
		const criteriaResults = _.map(rule.criteria, criteria => {
			return this.applyCriteria(item, criteria, detailed);
		});

		const passed =
			rule.operator === 'AND'
				? _.every(criteriaResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					})
				: _.some(criteriaResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					});

		if (detailed) {
			return {
				operator: rule.operator,
				passed,
				reason: `Rule "${rule.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
				results: criteriaResults as FilterCriteria.CriteriaResult[],
				level: 'rule'
			};
		}

		return passed;
	}

	static applyCriteria(
		item: any,
		criteria: FilterCriteria.CriteriaInput,
		detailed: boolean = false
	): boolean | FilterCriteria.CriteriaResult {
		let value = _.get(item, criteria.path, criteria.defaultValue);

		if (_.isUndefined(value)) {
			return detailed
				? {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: false,
						reason: 'Value not found in path',
						value: null
					}
				: false;
		}

		if (_.isPlainObject(criteria.value) && _.isArray(criteria.value.$path)) {
			criteria.value = _.get(item, criteria.value.$path, criteria.defaultValue);
		}

		if ('normalize' in criteria && criteria.normalize) {
			criteria.value = this.normalize(criteria.value);
			value = this.normalize(value);
		}

		switch (criteria.type) {
			case 'ARRAY': {
				const result = this.applyArrayFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Array "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			case 'BOOLEAN': {
				const result = this.applyBooleanFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Boolean "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			case 'DATE': {
				const result = this.applyDateFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: _.isString(criteria.value)
							? new Date(criteria.value).toISOString()
							: _.map(criteria.value, v => {
									return new Date(v).toISOString();
								}),
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Date "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			case 'GEO': {
				const [lat, lng] = criteria.getCoordinates?.(value) || [value.lat, value.lng];
				const result = this.applyGeoFilter({ lat, lng }, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Geo "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value: { lat, lng }
					};
				}

				return result;
			}

			case 'NUMBER': {
				const result = this.applyNumberFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Number "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			case 'TEXT': {
				const result = this.applyTextFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Text "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			default: {
				if (detailed) {
					return {
						criteriaValue: null,
						level: 'criteria',
						operator: '',
						passed: false,
						reason: 'Unknown filter type',
						value
					};
				}

				return false;
			}
		}
	}

	static applyArrayFilter(value: any[], operator: FilterCriteria.FilterOperators['array'], filterValue: unknown[]): boolean {
		switch (operator) {
			case 'EXACTLY_MATCHES': {
				// Returns true if arrays contain the same elements (order independent)
				return _.isEqual(_.sortBy(value), _.sortBy(filterValue));
			}

			case 'INCLUDES_ALL': {
				// Returns true if array contains ALL filter values
				return _.every(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'INCLUDES_ANY': {
				// Returns true if array contains AT LEAST ONE filter value
				return _.some(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'IS_EMPTY': {
				// Returns true if array is empty
				return _.size(value) === 0;
			}

			case 'IS_NOT_EMPTY': {
				// Returns true if array is not empty
				return _.size(value) > 0;
			}

			case 'NOT_INCLUDES_ALL': {
				// Returns true if array is missing AT LEAST ONE filter value
				return !_.every(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'NOT_INCLUDES_ANY': {
				// Returns true if array contains NONE of the filter values
				return !_.some(filterValue, v => {
					return _.includes(value, v);
				});
			}

			default:
				return false;
		}
	}

	static applyBooleanFilter(value: boolean, operator: FilterCriteria.FilterOperators['boolean'], filterValue: boolean): boolean {
		switch (operator) {
			case 'IS': {
				return value === filterValue;
			}

			case 'IS_NOT': {
				return value !== filterValue;
			}

			default:
				return false;
		}
	}

	static applyDateFilter(value: string, operator: FilterCriteria.FilterOperators['date'], filterValue: string | [string, string]): boolean {
		const date = new Date(value);

		if (_.isString(filterValue)) {
			filterValue = [filterValue, new Date().toISOString()];
		}

		const [start, end] = _.map(filterValue, d => {
			return new Date(d);
		});

		switch (operator) {
			case 'AFTER': {
				return date > start;
			}

			case 'AFTER_OR_EQUALS': {
				return date >= start;
			}

			case 'BEFORE': {
				return date < start;
			}

			case 'BEFORE_OR_EQUALS': {
				return date <= start;
			}

			case 'BETWEEN': {
				return date >= start && date <= end;
			}

			default:
				return false;
		}
	}

	static applyGeoFilter(
		value: { lat: number; lng: number },
		operator: FilterCriteria.FilterOperators['geo'],
		filterValue: { lat: number; lng: number; radius?: number; unit?: 'km' | 'mi' }
	): boolean {
		switch (operator) {
			case 'IN_RADIUS': {
				return this.calculateDistance(value, filterValue) <= (filterValue.radius || 0);
			}

			case 'NOT_IN_RADIUS': {
				return this.calculateDistance(value, filterValue) > (filterValue.radius || 0);
			}

			default:
				return false;
		}
	}

	static applyNumberFilter(value: number, operator: FilterCriteria.FilterOperators['number'], filterValue: number | number[]): boolean {
		switch (operator) {
			case 'EQUALS': {
				return value === filterValue;
			}

			case 'GREATER': {
				return value > (filterValue as number);
			}

			case 'GREATER_OR_EQUALS': {
				return value >= (filterValue as number);
			}

			case 'LESS': {
				return value < (filterValue as number);
			}

			case 'LESS_OR_EQUALS': {
				return value <= (filterValue as number);
			}

			case 'BETWEEN': {
				const [min, max] = filterValue as number[];
				return value >= min && value <= max;
			}

			default:
				return false;
		}
	}

	static applyTextFilter(
		value: string,
		operator: FilterCriteria.FilterOperators['text'],
		filterValue: string | string[] | RegExp
	): boolean {
		switch (operator) {
			case 'CONTAINS': {
				return _.includes(value, filterValue as string);
			}

			case 'EQUALS': {
				return value === filterValue;
			}

			case 'ENDS_WITH': {
				return _.endsWith(value, filterValue as string);
			}

			case 'IS_EMPTY': {
				return _.isEmpty(value);
			}

			case 'MATCHES_REGEX': {
				return new RegExp(filterValue as string).test(value);
			}

			case 'STARTS_WITH': {
				return _.startsWith(value, filterValue as string);
			}

			default:
				return false;
		}
	}

	static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
		// Haversine formula implementation
		const R = 6371; // Earth's radius in kilometers
		const dLat = this.toRad(point2.lat - point1.lat);
		const dLon = this.toRad(point2.lng - point1.lng);
		const lat1 = this.toRad(point1.lat);
		const lat2 = this.toRad(point2.lat);

		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	static normalize = _.memoize((value: any): any => {
		if (_.isArray(value)) {
			return _.map(value, v => {
				return this.normalize(v);
			});
		}

		if (_.isPlainObject(value)) {
			return _.mapValues(value, v => {
				return this.normalize(v);
			});
		}

		if (_.isString(value)) {
			return this.normalizeText(value);
		}

		return value;
	});

	static normalizeText = _.memoize((value: string): string => {
		value = _.trim(value);
		value = _.toLower(value);
		value = _.deburr(value);
		value = value.replace(/([a-z])([A-Z])/g, '$1-$2');
		value = value.replace(/\s+/g, '-');
		value = value.replace(/\-+/g, '-');
		value = _.trim(value, '-');

		return value;
	});

	static toRad(value: number): number {
		return (value * Math.PI) / 180;
	}
}

export default FilterCriteria;
