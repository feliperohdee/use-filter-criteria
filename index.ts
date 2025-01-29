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
const logicalOperator = z.enum(['AND', 'OR']);
const matchValueGetter = <T extends z.ZodSchema>(schema: T) => {
	return schema.or(z.function().args(z.any()).returns(schema)).or(
		z.object({
			$path: z.array(z.string())
		})
	);
};

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

const criteriaValueMapper = z.function().args(z.any(), z.any()).returns(z.any()).nullable().default(null);
const criteriaArray = z.object({
	defaultValue: z.array(z.unknown()).default([]),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsArray,
	type: z.literal('ARRAY'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaBoolean = z.object({
	defaultValue: z.any().default(undefined),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	operator: operatorsBoolean,
	type: z.literal('BOOLEAN'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaCustom = z.object({
	matchValue: z.any().default(null),
	predicate: criteriaCustomPredicate,
	type: z.literal('CUSTOM')
});

const criteriaCriteria = z.object({
	matchInArray: z.boolean().default(true),
	matchValue: z.any().default(null),
	normalize: z.boolean().default(true),
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
	key: z.string(),
	type: z.literal('CRITERIA'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaDate = z.object({
	defaultValue: z.string().default(''),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([datetime, z.tuple([datetime, datetime])])),
	operator: operatorsDate,
	type: z.literal('DATE'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaGeo = z.object({
	defaultValue: z.record(z.number()).default({ lat: 0, lng: 0 }),
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
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaMap = z.object({
	defaultValue: z.map(z.unknown(), z.unknown()).default(new Map()),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsMap,
	type: z.literal('MAP'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaNumber = z.object({
	defaultValue: z.number().default(0),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.number(), z.array(z.number())]))
		.nullable()
		.default(null),
	operator: operatorsNumber,
	type: z.literal('NUMBER'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaObject = z.object({
	defaultValue: z.record(z.unknown()).default({}),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsObject,
	type: z.literal('OBJECT'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaSet = z.object({
	defaultValue: z.set(z.unknown()).default(new Set()),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.array(z.unknown()), z.number(), z.string()]))
		.nullable()
		.default(null),
	normalize: z.boolean().default(true),
	operator: operatorsSet,
	type: z.literal('SET'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
});

const criteriaString = z.object({
	defaultValue: z.string().default(''),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.string(), z.array(z.string()), z.instanceof(RegExp)]))
		.nullable()
		.default(null),
	normalize: z.boolean().default(true),
	operator: operatorsString,
	type: z.literal('STRING'),
	valueMapper: criteriaValueMapper,
	valuePath: z.array(z.string())
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
	export type CriteriaArray = z.infer<typeof criteriaArray>;
	export type CriteriaArrayInput = z.input<typeof criteriaArray>;
	export type CriteriaBoolean = z.infer<typeof criteriaBoolean>;
	export type CriteriaBooleanInput = z.input<typeof criteriaBoolean>;
	export type CriteriaCriteria = z.infer<typeof criteriaCriteria>;
	export type CriteriaCriteriaInput = z.input<typeof criteriaCriteria>;
	export type CriteriaCustom = z.infer<typeof criteriaCustom>;
	export type CriteriaCustomInput = z.input<typeof criteriaCustom>;
	export type CriteriaDate = z.infer<typeof criteriaDate>;
	export type CriteriaDateInput = z.input<typeof criteriaDate>;
	export type CriteriaGeo = z.infer<typeof criteriaGeo>;
	export type CriteriaGeoInput = z.input<typeof criteriaGeo>;
	export type CriteriaMap = z.infer<typeof criteriaMap>;
	export type CriteriaMapInput = z.input<typeof criteriaMap>;
	export type CriteriaNumber = z.infer<typeof criteriaNumber>;
	export type CriteriaNumberInput = z.input<typeof criteriaNumber>;
	export type CriteriaObject = z.infer<typeof criteriaObject>;
	export type CriteriaObjectInput = z.input<typeof criteriaObject>;
	export type CriteriaSet = z.infer<typeof criteriaSet>;
	export type CriteriaSetInput = z.input<typeof criteriaSet>;
	export type CriteriaString = z.infer<typeof criteriaString>;
	export type CriteriaStringInput = z.input<typeof criteriaString>;

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

const criteriaFactory = <T extends FilterCriteria.Criteria = FilterCriteria.Criteria>(input: FilterCriteria.CriteriaInput): T => {
	return zDefault(criteria, input) as T;
};

const filterFactory = <T extends FilterCriteria.Filter = FilterCriteria.Filter>(input: FilterCriteria.FilterInput): T => {
	return zDefault(filter, input) as T;
};

const filterGroupFactory = <T extends FilterCriteria.FilterGroup = FilterCriteria.FilterGroup>(
	input: FilterCriteria.FilterGroupInput
): T => {
	return zDefault(filterGroup, input) as T;
};

class FilterCriteria {
	private static savedCriteria: Map<
		string,
		{
			criteria: FilterCriteria.Criteria;
			criteriaMapper: ((criteria: FilterCriteria.Criteria) => FilterCriteria.Criteria) | null;
		}
	> = new Map();

	static criteria = criteriaFactory;
	static filter = filterFactory;
	static filterGroup = filterGroupFactory;
	static schema = schema;

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
		if (
			_.isPlainObject(matchValue) &&
			'$path' in matchValue &&
			_.isArray(matchValue.$path) &&
			(_.isArray(value) || _.isPlainObject(value))
		) {
			matchValue = _.get(value, matchValue.$path);
		} else if (_.isFunction(matchValue)) {
			// custom match value
			matchValue = matchValue(value);
		}

		if ('normalize' in criteria && criteria.normalize) {
			matchValue = this.normalize(matchValue);
		}

		try {
			if (criteria.type === 'CUSTOM') {
				const passed = await this.applyCustomCriteria(value, criteria.predicate, matchValue);

				return detailed
					? {
							matchValue: stringify(matchValue),
							passed,
							reason: `CUSTOM predicate check ${passed ? 'PASSED' : 'FAILED'}`,
							value
						}
					: passed;
			}

			let passed = false;
			let arrayBranching = false;

			// value mapper
			if ('valueMapper' in criteria && _.isFunction(criteria.valueMapper)) {
				value = criteria.valueMapper(value, criteria);
			}

			if (_.isArray(criteria.valuePath) && _.size(criteria.valuePath) > 0) {
				const found = this.findByPath(value, criteria.valuePath, criteria.defaultValue);

				value = found.value;
				arrayBranching = found.arrayBranching;
			}

			if ('normalize' in criteria && criteria.normalize) {
				value = this.normalize(value);
			}

			if (arrayBranching) {
				passed = _.some(value, v => {
					return this.evaluateCriteria(v, criteria, matchValue);
				});
			} else {
				passed = this.evaluateCriteria(value, criteria, matchValue);
			}

			if (detailed) {
				return {
					matchValue: stringify(matchValue),
					passed,
					reason: `${criteria.type} criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
					value
				};
			}

			return passed;
		} catch (err) {
			if (detailed) {
				return {
					matchValue: stringify(matchValue),
					passed: false,
					reason: (err as Error).message,
					value
				};
			}

			return false;
		}
	}

	private static async $applyCriteria(value: any, criteria: FilterCriteria.CriteriaCriteriaInput, detailed: boolean) {
		const saved = this.savedCriteria.get(criteria.key);

		if (!saved) {
			return detailed
				? {
						matchValue: stringify(criteria.matchValue),
						passed: false,
						reason: `Criteria "${criteria.key}" not found`,
						value: null
					}
				: false;
		}

		let newCriteria = { ...saved.criteria };

		if (!_.isNil(criteria.normalize) && 'normalize' in newCriteria) {
			newCriteria.normalize = criteria.normalize;
		}

		if (criteria.operator && 'operator' in newCriteria) {
			newCriteria.operator = criteria.operator;
		}

		if (_.isBoolean(criteria.matchInArray) && 'matchInArray' in newCriteria) {
			newCriteria.matchInArray = criteria.matchInArray;
		}

		if (criteria.matchValue) {
			newCriteria.matchValue = criteria.matchValue;
		}

		if (criteria.valuePath && _.size(criteria.valuePath) > 0 && 'valuePath' in newCriteria) {
			newCriteria.valuePath = criteria.valuePath;
		}

		if (criteria.valueMapper && 'valueMapper' in newCriteria) {
			newCriteria.valueMapper = criteria.valueMapper;
		}

		if (saved.criteriaMapper && _.isFunction(saved.criteriaMapper)) {
			newCriteria = saved.criteriaMapper(newCriteria);
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

	private static evaluateCriteria(value: any, criteria: FilterCriteria.CriteriaInput, matchValue: any): boolean {
		if ('matchInArray' in criteria && criteria.matchInArray && _.isArray(value)) {
			return _.some(value, item => {
				return this.evaluateSingleCriteria(item, criteria, matchValue);
			});
		}

		return this.evaluateSingleCriteria(value, criteria, matchValue);
	}

	private static evaluateSingleCriteria(value: any, criteria: FilterCriteria.CriteriaInput, matchValue: any): boolean {
		switch (criteria.type) {
			case 'ARRAY':
				return this.applyArrayCriteria(value, criteria.operator, matchValue);
			case 'BOOLEAN':
				return this.applyBooleanCriteria(value, criteria.operator, matchValue);
			case 'DATE':
				return this.applyDateCriteria(value, criteria.operator, matchValue);
			case 'GEO':
				return this.applyGeoCriteria(value, criteria.operator, matchValue);
			case 'MAP':
				return this.applyMapCriteria(value, criteria.operator, matchValue);
			case 'NUMBER':
				return this.applyNumberCriteria(value, criteria.operator, matchValue);
			case 'OBJECT':
				return this.applyObjectCriteria(value, criteria.operator, matchValue);
			case 'SET':
				return this.applySetCriteria(value, criteria.operator, matchValue);
			case 'STRING':
				return this.applyStringCriteria(value, criteria.operator, matchValue);
			default:
				throw new Error('Unknown criteria type');
		}
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
		value: [number, number] | { lat: number; lng: number },
		operator: FilterCriteria.Operators['geo'],
		matchValue: any
	): boolean {
		const validValue = isNumberArray(value) || (objectContainKeys(value, ['lat', 'lng']) && _.isNumber(value.lat) && _.isNumber(value.lng));
		const validMatchValue = objectContainKeys(matchValue, ['lat', 'lng']) && _.isNumber(matchValue.lat) && _.isNumber(matchValue.lng);

		if (!validValue || !validMatchValue) {
			return false;
		}

		const [lat, lng] = isNumberArray(value) ? value : [value.lat, value.lng];

		switch (operator) {
			case 'IN-RADIUS': {
				return (
					this.calculateDistance(
						{ lat, lng },
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
						{ lat, lng },
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
		value = stringify(value);

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

	/*
		findByPath function is designed to traverse nested data structures using 
		a path array and track whether it encounters many possible paths during traversal.
	*/
	private static findByPath(
		value: any,
		path: string[],
		defaultValue?: any
	): {
		arrayBranching: boolean;
		value: any[];
	} {
		let arrayBranching = false;

		const iterate = (value: any, path: string[]): any | any[] => {
			if (_.size(path) === 0) {
				return value;
			}

			if (_.isArray(value)) {
				return _.flatMap(value, item => {
					return iterate(item, path);
				});
			}

			const [currentSegment, ...remainingPath] = path;
			const mappedValue = _.get(value, currentSegment, defaultValue);

			// If the current segment is an array and there are more segments in the path, looks like we have many possible traversal paths
			if (_.isArray(mappedValue) && _.size(remainingPath) > 0) {
				arrayBranching = true;
			}

			if (_.isUndefined(mappedValue)) {
				return arrayBranching ? [] : defaultValue;
			}

			return iterate(mappedValue, remainingPath);
		};

		const newValue = iterate(value, path);

		return {
			arrayBranching,
			value: newValue
		};
	}

	static inspect(): string {
		const builtInOperators = {
			array: _.keys(operatorsArray.enum),
			boolean: _.keys(operatorsBoolean.enum),
			date: _.keys(operatorsDate.enum),
			geo: _.keys(operatorsGeo.enum),
			map: _.keys(operatorsMap.enum),
			number: _.keys(operatorsNumber.enum),
			object: _.keys(operatorsObject.enum),
			set: _.keys(operatorsSet.enum),
			string: _.keys(operatorsString.enum)
		};

		const savedCriteriaMap = Array.from(this.savedCriteria.entries()).reduce(
			(acc, [key, { criteria }]) => {
				acc[key] = criteria;
				return acc;
			},
			{} as Record<string, FilterCriteria.Criteria>
		);

		const result = {
			operators: builtInOperators,
			savedCriteria: savedCriteriaMap
		};

		return JSON.stringify(result, null, 2);
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

	private static objectContaining(obj: any, subObject: any): boolean {
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

	static saveCriteria<T extends FilterCriteria.Criteria>(
		key: string,
		criteria: T,
		criteriaMapper: ((criteria: T) => FilterCriteria.Criteria) | null = null
	): void {
		if (criteria.type === 'CRITERIA') {
			throw new Error('Cannot save criteria with type "CRITERIA"');
		}

		this.savedCriteria.set(key, {
			criteria,
			criteriaMapper: criteriaMapper as ((criteria: FilterCriteria.Criteria) => FilterCriteria.Criteria) | null
		});
	}

	private static toRad(value: number): number {
		return (value * Math.PI) / 180;
	}
}

export default FilterCriteria;
