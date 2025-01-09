import _ from 'lodash';
import z from 'zod';

const filterLogicalOperator = z.enum(['AND', 'OR']);
const filterOperatorArrayOrSet: [string, ...string[]] = [
	'EXACTLY_MATCHES',
	'INCLUDES_ALL',
	'INCLUDES_ANY',
	'IS_EMPTY',
	'IS_NOT_EMPTY',
	'NOT_INCLUDES_ALL',
	'NOT_INCLUDES_ANY',
	'SIZE_EQUALS',
	'SIZE_GREATER',
	'SIZE_GREATER_OR_EQUALS',
	'SIZE_LESS',
	'SIZE_LESS_OR_EQUALS'
];
const filterOperator = {
	array: z.enum(filterOperatorArrayOrSet),
	boolean: z.enum(['IS', 'IS_NOT']),
	date: z.enum(['AFTER', 'AFTER_OR_EQUALS', 'BEFORE', 'BEFORE_OR_EQUALS', 'BETWEEN']),
	geo: z.enum(['IN_RADIUS', 'NOT_IN_RADIUS']),
	map: z.enum([
		'HAS_KEY',
		'HAS_VALUE',
		'IS_EMPTY',
		'IS_NOT_EMPTY',
		'SIZE_EQUALS',
		'SIZE_GREATER',
		'SIZE_GREATER_OR_EQUALS',
		'SIZE_LESS',
		'SIZE_LESS_OR_EQUALS'
	]),
	number: z.enum(['BETWEEN', 'EQUALS', 'GREATER', 'GREATER_OR_EQUALS', 'LESS', 'LESS_OR_EQUALS']),
	set: z.enum([...filterOperatorArrayOrSet, 'HAS']),
	string: z.enum(['CONTAINS', 'ENDS_WITH', 'EQUALS', 'IS_EMPTY', 'MATCHES_REGEX', 'STARTS_WITH'])
};

const filterValue = (...schemas: [z.ZodTypeAny, ...z.ZodTypeAny[]]) => {
	const schemasWith = [
		z.object({
			$path: z.array(z.string())
		}),
		schemas[0],
		...schemas.slice(1)
	] as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]];

	return z.union(schemasWith);
};

const filterCriteriaCustomFunction = z
	.function()
	.args(z.any())
	.returns(z.union([z.boolean(), z.promise(z.boolean())]));

const filterCriteria = z.discriminatedUnion('type', [
	z.object({
		defaultValue: z.array(z.unknown()).default([]),
		normalize: z.boolean().default(true),
		operator: filterOperator.array,
		path: z.array(z.string()),
		type: z.literal('ARRAY'),
		value: filterValue(z.array(z.unknown()), z.number())
	}),
	z.object({
		defaultValue: z.boolean().default(false),
		operator: filterOperator.boolean,
		path: z.array(z.string()),
		type: z.literal('BOOLEAN'),
		value: filterValue(z.boolean())
	}),
	z.object({
		operator: z.string().optional(),
		type: z.literal('CUSTOM'),
		value: z.union([z.string(), filterCriteriaCustomFunction])
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
		value: filterValue(z.string().datetime(), z.tuple([z.string().datetime(), z.string().datetime()]))
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
		defaultValue: z.map(z.unknown(), z.unknown()).default(new Map()),
		normalize: z.boolean().default(true),
		operator: filterOperator.map,
		path: z.array(z.string()),
		type: z.literal('MAP'),
		value: filterValue(z.number(), z.string(), z.map(z.unknown(), z.unknown()))
	}),
	z.object({
		defaultValue: z.number().default(0),
		operator: filterOperator.number,
		path: z.array(z.string()),
		type: z.literal('NUMBER'),
		value: filterValue(z.union([z.number(), z.array(z.number())]))
	}),
	z.object({
		defaultValue: z.set(z.unknown()).default(new Set()),
		normalize: z.boolean().default(true),
		operator: filterOperator.set,
		path: z.array(z.string()),
		type: z.literal('SET'),
		value: filterValue(z.number(), z.string(), z.set(z.unknown()))
	}),
	z.object({
		defaultValue: z.string().default(''),
		normalize: z.boolean().default(true),
		operator: filterOperator.string,
		path: z.array(z.string()),
		type: z.literal('STRING'),
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

const schema = {
	filter,
	filterCriteria,
	filterCriteriaCustomFunction,
	filterLogicalOperator,
	filterRule
};

namespace FilterCriteria {
	export type Criteria = z.infer<typeof filterCriteria>;
	export type CriteriaInput = z.input<typeof filterCriteria>;
	export type CriteriaCustomFunction = z.infer<typeof filterCriteriaCustomFunction>;
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
	static customCriteria: Map<string, FilterCriteria.CriteriaCustomFunction> = new Map();
	static schema = schema;

	static async match(
		data: any,
		input: FilterCriteria.FilterInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.MatchResult> {
		input = filter.parse(input);

		const ruleResults = await Promise.all(
			_.map(input.rules, rule => {
				return this.applyRule(data, rule, detailed);
			})
		);

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

	static async matchMany(data: any[], input: FilterCriteria.FilterInput): Promise<any[]> {
		input = filter.parse(input);

		let results: any[] = [];

		for await (const item of data) {
			const ruleResults = await Promise.all(
				_.map(input.rules, rule => {
					return this.applyRule(item, rule);
				}) as Promise<boolean>[]
			);

			if (input.operator === 'AND' ? _.every(ruleResults, Boolean) : _.some(ruleResults, Boolean)) {
				results = [...results, item];
			}
		}

		return results;
	}

	private static async applyRule(
		item: any,
		rule: FilterCriteria.RuleInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.RuleResult> {
		const criteriaResults = await Promise.all(
			_.map(rule.criteria, criteria => {
				return this.applyCriteria(item, criteria, detailed);
			})
		);

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

	private static async applyCriteria(
		item: any,
		criteria: FilterCriteria.CriteriaInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.CriteriaResult> {
		if (criteria.type === 'CUSTOM') {
			const fn = _.isString(criteria.value) ? this.customCriteria.get(criteria.value) : criteria.value;

			if (!fn) {
				return detailed
					? {
							criteriaValue: _.isString(criteria.value) ? criteria.value : 'Custom Criteria Function',
							level: 'criteria',
							operator: 'Custom Criteria Operator',
							passed: false,
							reason: 'Custom criteria not found',
							value: item
						}
					: false;
			}

			const result = await fn(item);

			return detailed
				? {
						criteriaValue: _.isString(criteria.value) ? criteria.value : 'Custom Criteria Function',
						level: 'criteria',
						operator: 'Custom Criteria Operator',
						passed: result,
						reason: _.isString(criteria.value)
							? `Custom "${criteria.value}" check ${result ? 'PASSED' : 'FAILED'}`
							: `Custom check ${result ? 'PASSED' : 'FAILED'}`,
						value: item
					}
				: result;
		}

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

			case 'MAP': {
				const result = this.applyMapFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Map "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
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

			case 'SET': {
				const result = this.applySetFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `Set "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return result;
			}

			case 'STRING': {
				const result = this.applyStringFilter(value, criteria.operator, criteria.value);

				if (detailed) {
					return {
						criteriaValue: criteria.value,
						level: 'criteria',
						operator: criteria.operator,
						passed: result,
						reason: `String "${criteria.operator}" check ${result ? 'PASSED' : 'FAILED'}`,
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

	private static applyArrayFilter(value: any[], operator: FilterCriteria.FilterOperators['array'], filterValue: any): boolean {
		switch (operator) {
			case 'EXACTLY_MATCHES': {
				return _.isEqual(_.sortBy(value), _.sortBy(filterValue));
			}

			case 'INCLUDES_ALL': {
				return _.every(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'INCLUDES_ANY': {
				return _.some(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'IS_EMPTY': {
				return _.size(value) === 0;
			}

			case 'IS_NOT_EMPTY': {
				return _.size(value) > 0;
			}

			case 'NOT_INCLUDES_ALL': {
				return !_.every(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'NOT_INCLUDES_ANY': {
				return !_.some(filterValue, v => {
					return _.includes(value, v);
				});
			}

			case 'SIZE_EQUALS': {
				return _.size(value) === filterValue;
			}

			case 'SIZE_GREATER': {
				return _.size(value) > filterValue;
			}

			case 'SIZE_GREATER_OR_EQUALS': {
				return _.size(value) >= filterValue;
			}

			case 'SIZE_LESS': {
				return _.size(value) < filterValue;
			}

			case 'SIZE_LESS_OR_EQUALS': {
				return _.size(value) <= filterValue;
			}

			default:
				return false;
		}
	}

	private static applyBooleanFilter(value: boolean, operator: FilterCriteria.FilterOperators['boolean'], filterValue: boolean): boolean {
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

	private static applyDateFilter(
		value: string,
		operator: FilterCriteria.FilterOperators['date'],
		filterValue: string | [string, string]
	): boolean {
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

	private static applyGeoFilter(
		value: { lat: number; lng: number },
		operator: FilterCriteria.FilterOperators['geo'],
		filterValue: { lat: number; lng: number; radius?: number; unit?: 'km' | 'mi' }
	): boolean {
		switch (operator) {
			case 'IN_RADIUS': {
				return (
					this.calculateDistance(
						value,
						{
							lat: filterValue.lat,
							lng: filterValue.lng
						},
						filterValue.unit
					) <= (filterValue.radius || 0)
				);
			}

			case 'NOT_IN_RADIUS': {
				return (
					this.calculateDistance(
						value,
						{
							lat: filterValue.lat,
							lng: filterValue.lng
						},
						filterValue.unit
					) > (filterValue.radius || 0)
				);
			}

			default:
				return false;
		}
	}

	private static applyMapFilter(value: Map<any, any>, operator: FilterCriteria.FilterOperators['map'], filterValue: any): boolean {
		switch (operator) {
			case 'HAS_KEY': {
				return value.has(filterValue);
			}

			case 'HAS_VALUE': {
				return Array.from(value.values()).includes(filterValue);
			}

			case 'IS_EMPTY': {
				return value.size === 0;
			}

			case 'IS_NOT_EMPTY': {
				return value.size > 0;
			}

			case 'SIZE_EQUALS': {
				return value.size === filterValue;
			}

			case 'SIZE_GREATER': {
				return value.size > filterValue;
			}

			case 'SIZE_GREATER_OR_EQUALS': {
				return value.size >= filterValue;
			}

			case 'SIZE_LESS': {
				return value.size < filterValue;
			}

			case 'SIZE_LESS_OR_EQUALS': {
				return value.size <= filterValue;
			}

			default:
				return false;
		}
	}

	private static applyNumberFilter(value: number, operator: FilterCriteria.FilterOperators['number'], filterValue: any): boolean {
		switch (operator) {
			case 'EQUALS': {
				return value === filterValue;
			}

			case 'GREATER': {
				return value > filterValue;
			}

			case 'GREATER_OR_EQUALS': {
				return value >= filterValue;
			}

			case 'LESS': {
				return value < filterValue;
			}

			case 'LESS_OR_EQUALS': {
				return value <= filterValue;
			}

			case 'BETWEEN': {
				const [min, max] = filterValue;
				return value >= min && value <= max;
			}

			default:
				return false;
		}
	}

	private static applySetFilter(value: Set<any>, operator: FilterCriteria.FilterOperators['set'], filterValue: any): boolean {
		switch (operator) {
			case 'EXACTLY_MATCHES': {
				return this.applyArrayFilter(Array.from(value), 'EXACTLY_MATCHES', filterValue);
			}

			case 'HAS': {
				return value.has(filterValue);
			}

			case 'INCLUDES_ALL': {
				return this.applyArrayFilter(Array.from(value), 'INCLUDES_ALL', filterValue);
			}

			case 'INCLUDES_ANY': {
				return this.applyArrayFilter(Array.from(value), 'INCLUDES_ANY', filterValue);
			}

			case 'IS_EMPTY': {
				return value.size === 0;
			}

			case 'IS_NOT_EMPTY': {
				return value.size > 0;
			}

			case 'NOT_INCLUDES_ALL': {
				return this.applyArrayFilter(Array.from(value), 'NOT_INCLUDES_ALL', filterValue);
			}

			case 'NOT_INCLUDES_ANY': {
				return this.applyArrayFilter(Array.from(value), 'NOT_INCLUDES_ANY', filterValue);
			}

			case 'SIZE_EQUALS': {
				return value.size === filterValue;
			}

			case 'SIZE_GREATER': {
				return value.size > filterValue;
			}

			case 'SIZE_GREATER_OR_EQUALS': {
				return value.size >= filterValue;
			}

			case 'SIZE_LESS': {
				return value.size < filterValue;
			}

			case 'SIZE_LESS_OR_EQUALS': {
				return value.size <= filterValue;
			}

			default:
				return false;
		}
	}

	private static applyStringFilter(value: string, operator: FilterCriteria.FilterOperators['string'], filterValue: any): boolean {
		switch (operator) {
			case 'CONTAINS': {
				return _.includes(value, filterValue);
			}

			case 'EQUALS': {
				return value === filterValue;
			}

			case 'ENDS_WITH': {
				return _.endsWith(value, filterValue);
			}

			case 'IS_EMPTY': {
				return _.isEmpty(value);
			}

			case 'MATCHES_REGEX': {
				return new RegExp(filterValue).test(value);
			}

			case 'STARTS_WITH': {
				return _.startsWith(value, filterValue);
			}

			default:
				return false;
		}
	}

	private static calculateDistance(
		point1: { lat: number; lng: number },
		point2: { lat: number; lng: number },
		unit: 'km' | 'mi' = 'km'
	): number {
		// Haversine formula implementation
		const R = unit === 'km' ? 6371 : 3959;
		const dLat = this.toRad(point2.lat - point1.lat);
		const dLon = this.toRad(point2.lng - point1.lng);
		const lat1 = this.toRad(point1.lat);
		const lat2 = this.toRad(point2.lat);

		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	private static normalize = _.memoize((value: any): any => {
		if (_.isArray(value)) {
			return _.map(value, v => {
				return this.normalize(v);
			});
		}

		if (_.isMap(value)) {
			return new Map(
				Array.from(value).map(([k, v]) => {
					return [k, this.normalize(v)];
				})
			);
		}

		if (_.isSet(value)) {
			return new Set(
				Array.from(value).map(v => {
					return this.normalize(v);
				})
			);
		}

		if (_.isPlainObject(value)) {
			return _.mapValues(value, v => {
				return this.normalize(v);
			});
		}

		if (_.isString(value)) {
			return this.normalizeString(value);
		}

		return value;
	});

	private static normalizeString = _.memoize((value: string): string => {
		value = _.trim(value);
		value = _.toLower(value);
		value = _.deburr(value);
		value = value.replace(/([a-z])([A-Z])/g, '$1-$2');
		value = value.replace(/\s+/g, '-');
		value = value.replace(/\-+/g, '-');
		value = _.trim(value, '-');

		return value;
	});

	static registerCustomCriteria(name: string, fn: FilterCriteria.CriteriaCustomFunction): void {
		this.customCriteria.set(name, fn);
	}

	static unregisterCustomCriteria(name: string): void {
		this.customCriteria.delete(name);
	}

	private static toRad(value: number): number {
		return (value * Math.PI) / 180;
	}
}

export default FilterCriteria;
