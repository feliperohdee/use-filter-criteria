import _ from 'lodash';
import z from 'zod';
import zDefault from 'use-zod-default';
import { promiseFilter } from 'use-async-helpers';

import { isNumberArray, isStringArray, objectContainKeys, stringify } from './util';

const criteriaCustomPredicate = z
	.function()
	.args(z.any(), z.any())
	.returns(z.union([z.boolean(), z.promise(z.boolean())]));

const datetime = z.string().datetime({ offset: true });
const fn = z.function().args(z.any()).returns(z.any());
const logicalOperator = z.enum(['AND', 'OR']);
const matchValueGetter = <T extends z.ZodSchema>(schema: T) => {
	return schema.or(z.function().args(z.any()).returns(schema)).or(
		z.object({
			$path: z.array(z.string())
		})
	);
};

const normalize = z.union([z.boolean(), fn]).default(true);
const operatorsArray = z.enum([
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
]);

const operatorsBoolean = z.enum([
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
]);
const operatorsDate = z.enum(['AFTER', 'AFTER-OR-EQUALS', 'BEFORE', 'BEFORE-OR-EQUALS', 'BETWEEN']);
const operatorsGeo = z.enum(['IN-RADIUS', 'NOT-IN-RADIUS']);
const operatorsMap = z.enum([
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
]);
const operatorsNumber = z.enum(['BETWEEN', 'EQUALS', 'GREATER', 'GREATER-OR-EQUALS', 'IN', 'LESS', 'LESS-OR-EQUALS', 'NOT-EQUALS']);
const operatorsObject = z.enum([
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
]);
const operatorsSet = z.enum([
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
]);
const operatorsString = z.enum(['CONTAINS', 'ENDS-WITH', 'EQUALS', 'IN', 'IS-EMPTY', 'MATCHES-REGEX', 'STARTS-WITH']);
const operators = {
	array: operatorsArray,
	boolean: operatorsBoolean,
	date: operatorsDate,
	geo: operatorsGeo,
	map: operatorsMap,
	number: operatorsNumber,
	object: operatorsObject,
	set: operatorsSet,
	string: operatorsString
};

const criteriaArray = z.object({
	defaultValue: z.array(z.unknown()).default([]),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize,
	operator: operatorsArray,
	type: z.literal('ARRAY'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaBoolean = z.object({
	defaultValue: z.any().default(undefined),
	matchValue: matchValueGetter(z.any()).default(null),
	operator: operatorsBoolean,
	type: z.literal('BOOLEAN'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaCustom = z.object({
	matchValue: z.any().default(null),
	predicate: criteriaCustomPredicate,
	type: z.literal('CUSTOM')
});

const criteriaCriteria = z.object({
	matchValue: z.any().default(null),
	normalize: normalize.nullable().default(null),
	operator: z
		.union([
			operatorsArray,
			operatorsBoolean,
			operatorsDate,
			operatorsGeo,
			operatorsMap,
			operatorsNumber,
			operatorsObject,
			operatorsSet,
			operatorsString
		])
		.nullable()
		.default(null),
	valuePath: z.array(z.string()).default([]),
	key: z.string(),
	type: z.literal('CRITERIA')
});

const criteriaDate = z.object({
	defaultValue: z.string().default(''),
	matchValue: matchValueGetter(z.union([datetime, z.tuple([datetime, datetime])])),
	operator: operatorsDate,
	type: z.literal('DATE'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaGeo = z.object({
	defaultValue: z.record(z.number()).default({ lat: 0, lng: 0 }),
	getCoordinates: z
		.object({
			lat: z.array(z.string()),
			lng: z.array(z.string())
		})
		.nullable()
		.default(null),
	matchValue: matchValueGetter(
		z.object({
			lat: z.number(),
			lng: z.number(),
			radius: z.number().optional(),
			unit: z.enum(['km', 'mi']).optional()
		})
	),
	operator: operatorsGeo,
	type: z.literal('GEO'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaMap = z.object({
	defaultValue: z.map(z.unknown(), z.unknown()).default(new Map()),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize,
	operator: operatorsMap,
	type: z.literal('MAP'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaNumber = z.object({
	defaultValue: z.number().default(0),
	matchValue: matchValueGetter(z.union([z.number(), z.array(z.number())])),
	operator: operatorsNumber,
	type: z.literal('NUMBER'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaObject = z.object({
	defaultValue: z.record(z.unknown()).default({}),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize,
	operator: operatorsObject,
	type: z.literal('OBJECT'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaSet = z.object({
	defaultValue: z.set(z.unknown()).default(new Set()),
	matchValue: matchValueGetter(z.union([z.array(z.unknown()), z.number(), z.string()]))
		.nullable()
		.default(null),
	normalize,
	operator: operatorsSet,
	type: z.literal('SET'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteriaString = z.object({
	defaultValue: z.string().default(''),
	matchValue: matchValueGetter(z.union([z.string(), z.array(z.string()), z.instanceof(RegExp)]))
		.nullable()
		.default(null),
	normalize,
	operator: operatorsString,
	type: z.literal('STRING'),
	valuePath: z.array(z.string()),
	valueTransformer: fn.nullable().default(null)
});

const criteria = z.discriminatedUnion('type', [
	criteriaArray,
	criteriaBoolean,
	criteriaCustom,
	criteriaCriteria,
	criteriaDate,
	criteriaGeo,
	criteriaMap,
	criteriaNumber,
	criteriaObject,
	criteriaSet,
	criteriaString
]);

const filter = z.object({
	criteria: z.array(criteria),
	operator: logicalOperator
});

const filterGroup = z.object({
	filters: z.array(filter),
	operator: logicalOperator
});

const matchManyInput = filterGroup;
const matchInput = z.union([criteria, filter, filterGroup]);

const schema = {
	criteria,
	criteriaCustomPredicate,
	filter,
	filterGroup,
	logicalOperator,
	matchInput
};

namespace FilterCriteria {
	export type Criteria = z.infer<typeof criteria>;
	export type CriteriaInput = z.input<typeof criteria>;
	export type CriteriaCustomPredicate = z.infer<typeof criteriaCustomPredicate>;
	export type CriteriaResult = {
		matchValue: string;
		passed: boolean;
		reason: string;
		value: any;
	};

	export type LogicalOperator = z.infer<typeof logicalOperator>;
	export type MatchInput = z.input<typeof matchInput>;
	export type MatchManyInput = z.input<typeof matchManyInput>;
	export type MatchDetailedResult = CriteriaResult | FilterResult | FilterGroupResult;

	export type Operators = {
		[K in keyof typeof operators]: z.infer<(typeof operators)[K]>;
	};

	export type Filter = z.infer<typeof filter>;
	export type FilterInput = z.input<typeof filter>;
	export type FilterResult = {
		operator: LogicalOperator;
		passed: boolean;
		reason: string;
		results: CriteriaResult[];
	};

	export type FilterGroup = z.infer<typeof filterGroup>;
	export type FilterGroupInput = z.input<typeof filterGroup>;
	export type FilterGroupResult = {
		operator: LogicalOperator;
		passed: boolean;
		reason: string;
		results: FilterResult[];
	};
}

const criteriaFactory = (input: FilterCriteria.CriteriaInput): FilterCriteria.Criteria => {
	return zDefault(criteria, input);
};

const filterFactory = (input: FilterCriteria.FilterInput): FilterCriteria.Filter => {
	return zDefault(filter, input);
};

const filterGroupFactory = (input: FilterCriteria.FilterGroupInput): FilterCriteria.FilterGroup => {
	return zDefault(filterGroup, input);
};

class FilterCriteria {
	static savedCriteria: Map<string, FilterCriteria.Criteria> = new Map();
	static schema = schema;

	static criteria = criteriaFactory;
	static filter = filterFactory;
	static filterGroup = filterGroupFactory;

	static async match(
		value: any,
		input: FilterCriteria.MatchInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.MatchDetailedResult> {
		const converted = this.convertToFilterGroupInput(input);
		const args = filterGroup.parse(converted.input);
		const filtersResults = await Promise.all(
			_.map(args.filters, filter => {
				return this.applyFilter(value, filter, detailed);
			})
		);

		const passed =
			args.operator === 'AND'
				? _.every(filtersResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					})
				: _.some(filtersResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					});

		if (detailed) {
			if (converted.level === 'criteria') {
				return (filtersResults[0] as FilterCriteria.FilterResult).results[0];
			}

			if (converted.level === 'filter') {
				return filtersResults[0] as FilterCriteria.FilterResult;
			}

			return {
				operator: args.operator,
				passed,
				reason: `Filter group "${args.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
				results: filtersResults as FilterCriteria.FilterResult[]
			};
		}

		return passed;
	}

	static async matchMany(value: any[], input: FilterCriteria.MatchInput, concurrency: number = Infinity): Promise<any[]> {
		const converted = this.convertToFilterGroupInput(input);
		const args = filterGroup.parse(converted.input);

		return promiseFilter(
			value,
			async item => {
				try {
					const filtersResults = await Promise.all(
						_.map(args.filters, filter => {
							return this.applyFilter(item, filter);
						}) as Promise<boolean>[]
					);

					return args.operator === 'AND' ? _.every(filtersResults, Boolean) : _.some(filtersResults, Boolean);
				} catch {
					return false;
				}
			},
			concurrency
		);
	}

	private static async applyCriteria(
		value: any,
		criteria: FilterCriteria.CriteriaInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.CriteriaResult> {
		if (criteria.type === 'CRITERIA') {
			return this.$applyCriteria(value, criteria, detailed);
		}

		let { matchValue } = criteria;

		// dynamic match value
		if (_.isObject(matchValue) && '$path' in matchValue && _.isArray(matchValue.$path) && (_.isArray(value) || _.isPlainObject(value))) {
			matchValue = _.get(value, matchValue.$path);
		} else if (_.isFunction(matchValue)) {
			// custom match value
			matchValue = matchValue(value);
		}

		if (criteria.type === 'CUSTOM') {
			const passed = await this.applyCustomCriteria(value, criteria.predicate, matchValue);

			return detailed
				? {
						matchValue: stringify(matchValue),
						passed,
						reason: `Custom predicate check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					}
				: passed;
		}

		if (_.isArray(criteria.valuePath) && _.size(criteria.valuePath) > 0) {
			value = _.get(value, criteria.valuePath, criteria.defaultValue);
		}

		if (_.isFunction(criteria.valueTransformer)) {
			value = criteria.valueTransformer(value);
		}

		if ('normalize' in criteria) {
			if (_.isFunction(criteria.normalize)) {
				matchValue = criteria.normalize(matchValue);
				value = criteria.normalize(value);
			} else if (criteria.normalize) {
				matchValue = this.normalize(matchValue);
				value = this.normalize(value);
			}
		}

		switch (criteria.type) {
			case 'ARRAY': {
				const passed = this.applyArrayCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Array criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'BOOLEAN': {
				const passed = this.applyBooleanCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Boolean criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'DATE': {
				const passed = this.applyDateCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Date criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'GEO': {
				const [lat, lng] = criteria.getCoordinates
					? [_.get(value, criteria.getCoordinates.lat, 0), _.get(value, criteria.getCoordinates.lng, 0)]
					: [value.lat, value.lng];
				const passed = this.applyGeoCriteria({ lat, lng }, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Geo criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value: { lat, lng }
					};
				}

				return passed;
			}

			case 'MAP': {
				const passed = this.applyMapCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Map criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'NUMBER': {
				const passed = this.applyNumberCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Number criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'OBJECT': {
				const passed = this.applyObjectCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Object criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'SET': {
				const passed = this.applySetCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `Set criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			case 'STRING': {
				const passed = this.applyStringCriteria(value, criteria.operator, matchValue);

				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed,
						reason: `String criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						value
					};
				}

				return passed;
			}

			default: {
				if (detailed) {
					return {
						matchValue: stringify(matchValue),
						passed: false,
						reason: 'Unknown criteria type',
						value
					};
				}

				return false;
			}
		}
	}

	static async $applyCriteria(value: any, criteria: FilterCriteria.CriteriaInput & { type: 'CRITERIA' }, detailed: boolean = false) {
		const savedCriteria = this.savedCriteria.get(criteria.key);

		if (!savedCriteria) {
			return detailed
				? {
						matchValue: stringify(criteria.matchValue),
						passed: false,
						reason: `Criteria "${criteria.key}" not found`,
						value: null
					}
				: false;
		}

		const newCriteria = { ...savedCriteria };

		if (!_.isNil(criteria.normalize) && 'normalize' in newCriteria) {
			newCriteria.normalize = criteria.normalize;
		}

		if (criteria.operator && 'operator' in newCriteria) {
			newCriteria.operator = criteria.operator;
		}

		if (criteria.matchValue) {
			newCriteria.matchValue = criteria.matchValue;
		}

		if (criteria.valuePath && _.size(criteria.valuePath) > 0 && 'valuePath' in newCriteria) {
			newCriteria.valuePath = criteria.valuePath;
		}

		return this.applyCriteria(value, newCriteria, detailed);
	}

	private static async applyFilter(
		value: any,
		filter: FilterCriteria.FilterInput,
		detailed: boolean = false
	): Promise<boolean | FilterCriteria.FilterResult> {
		const criteriaResults = await Promise.all(
			_.map(filter.criteria, criteria => {
				return this.applyCriteria(value, criteria, detailed);
			})
		);

		const passed =
			filter.operator === 'AND'
				? _.every(criteriaResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					})
				: _.some(criteriaResults, r => {
						return _.isBoolean(r) ? r : r.passed;
					});

		if (detailed) {
			return {
				operator: filter.operator,
				passed,
				reason: `Filter "${filter.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
				results: criteriaResults as FilterCriteria.CriteriaResult[]
			};
		}

		return passed;
	}

	private static applyArrayCriteria(value: any[], operator: FilterCriteria.Operators['array'], matchValue: any): boolean {
		const validValue = _.isArray(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'EXACTLY-MATCHES': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return _.isEqual(_.sortBy(value), _.sortBy(matchValue));
			}

			case 'HAS': {
				return _.some(value, v => {
					return _.isEqual(v, matchValue);
				});
			}

			case 'INCLUDES-ALL': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return _.every(matchValue, v => {
					return _.includes(value, v);
				});
			}

			case 'INCLUDES-ANY': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return _.some(matchValue, v => {
					return _.includes(value, v);
				});
			}

			case 'IS-EMPTY': {
				return _.size(value) === 0;
			}

			case 'NOT-EMPTY': {
				return _.size(value) > 0;
			}

			case 'NOT-INCLUDES-ALL': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return !_.every(matchValue, v => {
					return _.includes(value, v);
				});
			}

			case 'NOT-INCLUDES-ANY': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return !_.some(matchValue, v => {
					return _.includes(value, v);
				});
			}

			case 'SIZE-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) === matchValue;
			}

			case 'SIZE-GREATER': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) > matchValue;
			}

			case 'SIZE-GREATER-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) >= matchValue;
			}

			case 'SIZE-LESS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) < matchValue;
			}

			case 'SIZE-LESS-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) <= matchValue;
			}

			default:
				return false;
		}
	}

	private static applyBooleanCriteria(value: any, operator: FilterCriteria.Operators['boolean'], matchValue: any): boolean {
		switch (operator) {
			case 'EQUALS': {
				return _.isEqual(value, matchValue);
			}

			case 'IS-FALSE': {
				return value === false;
			}

			case 'IS-FALSY': {
				return Boolean(!value);
			}

			case 'IS-NIL': {
				return _.isNil(value);
			}

			case 'IS-NULL': {
				return _.isNull(value);
			}

			case 'IS-TRUE': {
				return value === true;
			}

			case 'IS-TRUTHY': {
				return Boolean(value);
			}

			case 'IS-UNDEFINED': {
				return _.isUndefined(value);
			}

			case 'NOT-EQUALS': {
				return !_.isEqual(value, matchValue);
			}

			case 'NOT-NIL': {
				return !_.isNil(value);
			}

			case 'NOT-NULL': {
				return !_.isNull(value);
			}

			case 'NOT-UNDEFINED': {
				return !_.isUndefined(value);
			}

			case 'STRICT-EQUAL': {
				return value === matchValue;
			}

			case 'STRICT-NOT-EQUAL': {
				return value !== matchValue;
			}

			default:
				return false;
		}
	}

	private static applyCustomCriteria(
		value: any,
		predicate: FilterCriteria.CriteriaCustomPredicate,
		matchValue: any
	): boolean | Promise<boolean> {
		return predicate(value, matchValue);
	}

	private static applyDateCriteria(value: string, operator: FilterCriteria.Operators['date'], matchValue: any): boolean {
		const validValue = _.isString(value);
		const validMatchValue = _.isString(matchValue) || isStringArray(matchValue);

		if (!validValue || !validMatchValue) {
			return false;
		}

		const date = new Date(value);

		if (_.isString(matchValue)) {
			matchValue = [matchValue, new Date().toISOString()];
		}

		const [start, end] = _.map(matchValue, d => {
			return new Date(d);
		});

		switch (operator) {
			case 'AFTER': {
				return date > start;
			}

			case 'AFTER-OR-EQUALS': {
				return date >= start;
			}

			case 'BEFORE': {
				return date < start;
			}

			case 'BEFORE-OR-EQUALS': {
				return date <= start;
			}

			case 'BETWEEN': {
				return date >= start && date <= end;
			}

			default:
				return false;
		}
	}

	private static applyGeoCriteria(
		value: { lat: number; lng: number },
		operator: FilterCriteria.Operators['geo'],
		matchValue: any
	): boolean {
		const validValue = objectContainKeys(value, ['lat', 'lng']) && _.isNumber(value.lat) && _.isNumber(value.lng);
		const validMatchValue = objectContainKeys(matchValue, ['lat', 'lng']) && _.isNumber(matchValue.lat) && _.isNumber(matchValue.lng);

		if (!validValue || !validMatchValue) {
			return false;
		}

		switch (operator) {
			case 'IN-RADIUS': {
				return (
					this.calculateDistance(
						value,
						{
							lat: matchValue.lat,
							lng: matchValue.lng
						},
						matchValue.unit
					) <= (matchValue.radius || 0)
				);
			}

			case 'NOT-IN-RADIUS': {
				return (
					this.calculateDistance(
						value,
						{
							lat: matchValue.lat,
							lng: matchValue.lng
						},
						matchValue.unit
					) > (matchValue.radius || 0)
				);
			}

			default:
				return false;
		}
	}

	private static applyMapCriteria(value: Map<any, any>, operator: FilterCriteria.Operators['map'], matchValue: any): boolean {
		const validValue = _.isMap(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'CONTAINS': {
				return this.applyObjectCriteria(Object.fromEntries(value), 'CONTAINS', matchValue);
			}

			case 'HAS-KEY': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return value.has(matchValue);
			}

			case 'HAS-VALUE': {
				return _.some(Array.from(value.values()), v => {
					return _.isEqual(v, matchValue);
				});
			}

			case 'IS-EMPTY': {
				return value.size === 0;
			}

			case 'NOT-EMPTY': {
				return value.size > 0;
			}

			case 'SIZE-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size === matchValue;
			}

			case 'SIZE-GREATER': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size > matchValue;
			}

			case 'SIZE-GREATER-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size >= matchValue;
			}

			case 'SIZE-LESS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size < matchValue;
			}

			case 'SIZE-LESS-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size <= matchValue;
			}

			default:
				return false;
		}
	}

	private static applyNumberCriteria(value: number, operator: FilterCriteria.Operators['number'], matchValue: any): boolean {
		const validValue = _.isNumber(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'BETWEEN': {
				if (!isNumberArray(matchValue)) {
					return false;
				}

				const [min, max] = matchValue;
				return value >= min && value <= max;
			}

			case 'EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value === matchValue;
			}

			case 'GREATER': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value > matchValue;
			}

			case 'GREATER-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value >= matchValue;
			}

			case 'IN': {
				if (!isNumberArray(matchValue)) {
					return false;
				}

				return matchValue.includes(value);
			}

			case 'LESS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value < matchValue;
			}

			case 'LESS-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value <= matchValue;
			}

			case 'NOT-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value !== matchValue;
			}

			default:
				return false;
		}
	}

	private static applyObjectCriteria(value: any, operator: FilterCriteria.Operators['object'], matchValue: any): boolean {
		const validValue = _.isPlainObject(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'CONTAINS': {
				if (!_.isPlainObject(matchValue)) {
					return false;
				}

				return this.objectContaining(value, matchValue);
			}

			case 'HAS-KEY': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return _.has(value, matchValue);
			}

			case 'HAS-VALUE': {
				return _.some(value, v => {
					return _.isEqual(v, matchValue);
				});
			}

			case 'IS-EMPTY': {
				return _.isEmpty(value);
			}

			case 'NOT-EMPTY': {
				return !_.isEmpty(value);
			}

			case 'SIZE-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) === matchValue;
			}

			case 'SIZE-GREATER': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) > matchValue;
			}

			case 'SIZE-GREATER-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) >= matchValue;
			}

			case 'SIZE-LESS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) < matchValue;
			}

			case 'SIZE-LESS-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return _.size(value) <= matchValue;
			}

			default:
				return false;
		}
	}

	private static applySetCriteria(value: Set<any>, operator: FilterCriteria.Operators['set'], matchValue: any): boolean {
		const validValue = _.isSet(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'EXACTLY-MATCHES': {
				return this.applyArrayCriteria(Array.from(value), 'EXACTLY-MATCHES', matchValue);
			}

			case 'HAS': {
				return value.has(matchValue);
			}

			case 'INCLUDES-ALL': {
				return this.applyArrayCriteria(Array.from(value), 'INCLUDES-ALL', matchValue);
			}

			case 'INCLUDES-ANY': {
				return this.applyArrayCriteria(Array.from(value), 'INCLUDES-ANY', matchValue);
			}

			case 'IS-EMPTY': {
				return value.size === 0;
			}

			case 'NOT-EMPTY': {
				return value.size > 0;
			}

			case 'NOT-INCLUDES-ALL': {
				return this.applyArrayCriteria(Array.from(value), 'NOT-INCLUDES-ALL', matchValue);
			}

			case 'NOT-INCLUDES-ANY': {
				return this.applyArrayCriteria(Array.from(value), 'NOT-INCLUDES-ANY', matchValue);
			}

			case 'SIZE-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size === matchValue;
			}

			case 'SIZE-GREATER': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size > matchValue;
			}

			case 'SIZE-GREATER-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size >= matchValue;
			}

			case 'SIZE-LESS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size < matchValue;
			}

			case 'SIZE-LESS-OR-EQUALS': {
				if (!_.isNumber(matchValue)) {
					return false;
				}

				return value.size <= matchValue;
			}

			default:
				return false;
		}
	}

	private static applyStringCriteria(value: string, operator: FilterCriteria.Operators['string'], matchValue: any): boolean {
		const validValue = _.isString(value);

		if (!validValue) {
			return false;
		}

		switch (operator) {
			case 'CONTAINS': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return _.includes(value, matchValue);
			}

			case 'EQUALS': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return value === matchValue;
			}

			case 'ENDS-WITH': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return _.endsWith(value, matchValue);
			}

			case 'IN': {
				if (!isStringArray(matchValue)) {
					return false;
				}

				return matchValue.includes(value);
			}

			case 'IS-EMPTY': {
				return _.isEmpty(value);
			}

			case 'MATCHES-REGEX': {
				if (!_.isString(matchValue) && !_.isRegExp(matchValue)) {
					return false;
				}

				return new RegExp(matchValue).test(value);
			}

			case 'STARTS-WITH': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return _.startsWith(value, matchValue);
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

	private static convertToFilterGroupInput(input: FilterCriteria.MatchInput): {
		input: FilterCriteria.FilterGroupInput;
		level: 'filter-group' | 'filter' | 'criteria';
	} {
		let result: {
			input: FilterCriteria.FilterGroupInput;
			level: 'filter-group' | 'filter' | 'criteria';
		};

		if ('type' in input) {
			// Handle CriteriaInput
			result = {
				input: {
					filters: [
						{
							operator: 'AND',
							criteria: [input]
						}
					],
					operator: 'AND'
				},
				level: 'criteria'
			};
		} else if ('criteria' in input) {
			// Handle FilterInput
			result = {
				input: {
					filters: [input],
					operator: 'AND'
				},
				level: 'filter'
			};
		} else {
			// Handle FilterGroupInput
			result = {
				input,
				level: 'filter-group'
			};
		}

		return result;
	}

	static normalize(value: any): any {
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
	}

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

	static objectContaining(obj: any, subObject: any): boolean {
		if (_.isNil(obj) || _.isNil(subObject)) {
			return false;
		}

		if (!_.isObject(subObject)) {
			return _.isEqual(obj, subObject);
		}

		if (_.isArray(subObject)) {
			if (!_.isArray(obj)) {
				return false;
			}

			return _.every(subObject, subItem =>
				_.some(obj, item => {
					return this.objectContaining(item, subItem);
				})
			);
		}

		if (!_.isObject(obj)) {
			return false;
		}

		return _.isMatch(obj, subObject);
	}

	static saveCriteria(key: string, criteria: FilterCriteria.Criteria): void {
		if (criteria.type === 'CRITERIA') {
			throw new Error('Cannot save criteria with type "CRITERIA"');
		}

		this.savedCriteria.set(key, criteria);
	}

	private static toRad(value: number): number {
		return (value * Math.PI) / 180;
	}
}

export default FilterCriteria;
