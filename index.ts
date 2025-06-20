import _ from 'lodash';
import { promiseFilter, promiseMap, promiseReduce } from 'use-async-helpers';
import z from 'zod';
import zDefault from 'use-zod-default';

import { isNumberArray, isStringArray, objectContainKeys, stringify, toArray } from './util';
import {
	operators,
	operatorsArray,
	operatorsBoolean,
	operatorsDate,
	operatorsGeo,
	operatorsMap,
	operatorsNumber,
	operatorsObject,
	operatorsSet,
	operatorsString
} from './operators';

const zDatetime = z.string().datetime({ offset: true });
const zFunction = z.custom<Function>(
	value => {
		return _.isFunction(value);
	},
	{
		message: 'Value must be a function'
	}
);

const logicalOperator = z.enum(['AND', 'OR']);
const matchValueGetter = <T extends z.ZodSchema>(schema: T) => {
	return schema.or(
		zFunction.or(
			z.object({
				$path: z.array(z.string())
			})
		)
	);
};

const criteriaCustomPredicate = z
	.function()
	.args(
		z.object({
			matchValue: z.any(),
			value: z.any()
		})
	)
	.returns(z.union([z.boolean(), z.promise(z.boolean())]))
	.nullable()
	.default(null);

const criteriaMapper = zFunction.nullable().default(null);
const criteriaArray = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.array(z.unknown()).default([]),
	heavy: z.boolean().default(false),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsArray.default('EXACTLY-MATCHES'),
	type: z.literal('ARRAY'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaBoolean = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.any().default(undefined),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	operator: operatorsBoolean.default('EQUALS'),
	type: z.literal('BOOLEAN'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaCustom = z.object({
	alias: z.string().default(''),
	matchValue: z.any().default(null),
	predicate: criteriaCustomPredicate,
	heavy: z.boolean().default(false),
	type: z.literal('CUSTOM')
});

const criteriaDate = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.string().default(''),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([zDatetime, z.tuple([zDatetime, zDatetime])])),
	operator: operatorsDate.default('AFTER'),
	type: z.literal('DATE'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaGeo = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.record(z.number()).default({ lat: 0, lng: 0 }),
	heavy: z.boolean().default(false),
	matchValue: matchValueGetter(
		z.object({
			lat: z.number(),
			lng: z.number(),
			radius: z.number().optional(),
			unit: z.enum(['km', 'mi']).optional()
		})
	),
	operator: operatorsGeo.default('IN-RADIUS'),
	type: z.literal('GEO'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaMap = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.map(z.unknown(), z.unknown()).default(new Map()),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsMap.default('CONTAINS'),
	type: z.literal('MAP'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaNumber = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.number().default(0),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.number(), z.array(z.number())]))
		.nullable()
		.default(null),
	operator: operatorsNumber.default('EQUALS'),
	type: z.literal('NUMBER'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaObject = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.record(z.unknown()).default({}),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.any()).default(null),
	normalize: z.boolean().default(true),
	operator: operatorsObject.default('CONTAINS'),
	type: z.literal('OBJECT'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaSet = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.set(z.unknown()).default(new Set()),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.array(z.unknown()), z.number(), z.string()]))
		.nullable()
		.default(null),
	normalize: z.boolean().default(true),
	operator: operatorsSet.default('EXACTLY-MATCHES'),
	type: z.literal('SET'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteriaString = z.object({
	alias: z.string().default(''),
	criteriaMapper,
	defaultValue: z.string().default(''),
	heavy: z.boolean().default(false),
	matchInArray: z.boolean().default(true),
	matchValue: matchValueGetter(z.union([z.string(), z.array(z.string()), z.instanceof(RegExp)]))
		.nullable()
		.default(null),
	normalize: z.boolean().default(true),
	operator: operatorsString.default('EQUALS'),
	type: z.literal('STRING'),
	valueMapper: criteriaMapper,
	valuePath: z.array(z.string()).default([])
});

const criteria = z.discriminatedUnion('type', [
	criteriaArray,
	criteriaBoolean,
	criteriaCustom,
	criteriaDate,
	criteriaGeo,
	criteriaMap,
	criteriaNumber,
	criteriaObject,
	criteriaSet,
	criteriaString
]);

const filter = z.object({
	criterias: z.array(criteria),
	operator: logicalOperator
});

const filterGroup = z.object({
	filters: z.array(filter),
	operator: logicalOperator
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const matchManyInput = filterGroup;
const matchInput = z.union([criteria, filter, filterGroup]);

const schema = {
	criteria,
	criteriaCustomPredicate,
	filter,
	filterGroup,
	matchInput
};

namespace FilterCriteria {
	export type CriteriaArray = z.infer<typeof criteriaArray>;
	export type CriteriaArrayInput = z.input<typeof criteriaArray>;
	export type CriteriaBoolean = z.infer<typeof criteriaBoolean>;
	export type CriteriaBooleanInput = z.input<typeof criteriaBoolean>;
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
	export type CriteriaCustomPredicate = z.infer<typeof criteriaCustomPredicate>;
	export type CriteriaInput = z.input<typeof criteria>;
	export type CriteriaMapper = z.infer<typeof criteriaMapper>;
	export type CriteriaResult = {
		matchValue: string;
		passed: boolean;
		reason: string;
		value: any;
	};

	export type LogicalOperator = z.infer<typeof logicalOperator>;
	export type MatchInput = z.input<typeof matchInput>;
	export type MatchManyInput = z.input<typeof matchManyInput>;
	export type MatchResult = CriteriaResult | FilterResult | FilterGroupResult;

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

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

const criteriaAliasFactory = <T extends FilterCriteria.Criteria = FilterCriteria.Criteria>(
	alias: string,
	input?: DistributiveOmit<FilterCriteria.CriteriaInput, 'criteriaMapper' | 'valueMapper'> & {
		criteriaMapper?: (input: { context: Map<string, any>; criteria: T; value: any }) => any;
		valueMapper?: (input: { context: Map<string, any>; criteria: T; value: any }) => any;
	}
): T => {
	const source = { ...input, alias };
	// @ts-expect-error
	const res: Record<string, any> = zDefault(criteria, source);

	// nullify inexistent keys on source
	for (const key in res) {
		if (!(key in source)) {
			res[key] = null;
		}
	}

	return res as T;
};

const criteriaFactory = <T extends FilterCriteria.Criteria = FilterCriteria.Criteria>(
	input: DistributiveOmit<FilterCriteria.CriteriaInput, 'criteriaMapper' | 'valueMapper'> & {
		criteriaMapper?: (input: { context: Map<string, any>; criteria: T; value: any }) => any;
		valueMapper?: (input: { context: Map<string, any>; criteria: T; value: any }) => any;
	}
): T => {
	// @ts-expect-error
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
	private savedCriteria: Map<string, { criteria: FilterCriteria.Criteria }> = new Map();

	static alias = criteriaAliasFactory;
	static criteria = criteriaFactory;
	static filter = filterFactory;
	static filterGroup = filterGroupFactory;
	static schema = schema;

	async count(input: FilterCriteria.MatchInput): Promise<number> {
		const converted = this.translateToFilterGroupInput(input, false);
		const args = await filterGroup.parseAsync(converted.input);

		return _.size(
			_.filter(args.filters, f => {
				return _.size(f.criterias) > 0;
			})
		);
	}

	async empty(input: FilterCriteria.MatchInput): Promise<boolean> {
		const converted = this.translateToFilterGroupInput(input, false);

		return this.$empty(converted.input);
	}

	$empty(input: FilterCriteria.FilterGroupInput): boolean {
		return (
			_.size(input.filters) === 0 ||
			_.every(input.filters, f => {
				return _.size(f.criterias) === 0;
			})
		);
	}

	async match(value: any, input: FilterCriteria.MatchInput): Promise<FilterCriteria.MatchResult> {
		const converted = this.translateToFilterGroupInput(input);
		const args = await filterGroup.parseAsync(converted.input);

		// filter out filters with no criterias
		args.filters = _.filter(args.filters, filter => {
			return _.size(filter.criterias) > 0;
		});

		// Optimization for AND filter groups with more than one filter - process one filter at a time and short-circuit if any fails
		if (args.operator === 'AND' && _.size(args.filters) > 1) {
			let filtersResults: FilterCriteria.FilterResult[] = [];

			for (const filter of args.filters) {
				const filterResult = await this.applyFilter(value, filter);

				// If any filter fails in an AND group, we can stop evaluating
				if (!filterResult.passed) {
					return {
						operator: args.operator,
						passed: false,
						reason: `Filter group "${args.operator}" check FAILED (short-circuited)`,
						results: filtersResults as FilterCriteria.FilterResult[]
					};
				}

				filtersResults = [...filtersResults, filterResult];
			}

			return {
				operator: args.operator,
				passed: true,
				reason: `Filter group "${args.operator}" check PASSED`,
				results: filtersResults as FilterCriteria.FilterResult[]
			};
		}

		// Default behavior for OR operator or when no optimization is possible
		const filtersResults = await Promise.all(
			_.map(args.filters, filter => {
				return this.applyFilter(value, filter);
			})
		);

		// when filters are empty, return as passed
		if (_.size(filtersResults) === 0) {
			if (converted.level === 'filter') {
				const filter = converted.input.filters[0];

				return {
					operator: filter.operator,
					passed: true,
					reason: `Filter "${filter.operator}" check PASSED`,
					results: []
				};
			}

			return {
				operator: args.operator,
				passed: true,
				reason: `Filter group "${args.operator}" check PASSED`,
				results: []
			};
		}

		if (converted.level === 'criteria') {
			return (filtersResults[0] as FilterCriteria.FilterResult).results[0];
		}

		if (converted.level === 'filter') {
			return filtersResults[0] as FilterCriteria.FilterResult;
		}

		const passed = _.some(filtersResults, r => {
			return r.passed;
		});

		return {
			operator: args.operator,
			passed,
			reason: `Filter group "${args.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
			results: filtersResults as FilterCriteria.FilterResult[]
		};
	}

	async matchMany<T = any>(value: T[], input: FilterCriteria.MatchInput, concurrency: number = Infinity): Promise<T[]> {
		const converted = this.translateToFilterGroupInput(input);
		const args = await filterGroup.parseAsync(converted.input);

		// when filter is empty, return all items
		if (this.$empty(converted.input)) {
			return value;
		}

		// filter out filters with no criterias
		args.filters = _.filter(args.filters, f => {
			return _.size(f.criterias) > 0;
		});

		return promiseFilter(
			value,
			async item => {
				try {
					// For AND operator, process one filter at a time and short-circuit when one fails
					if (args.operator === 'AND') {
						for (const filter of args.filters) {
							const filterResult = await this.applyFilter(item, filter);
							if (!filterResult.passed) {
								return false; // Short-circuit on first filter failure
							}
						}
						return true; // All filters passed
					} else {
						// For OR operator, process filters in parallel and short-circuit when one passes
						const filtersResults = await promiseMap(args.filters, filter => {
							return this.applyFilter(item, filter);
						});

						return _.some(filtersResults, r => {
							return r.passed;
						});
					}
				} catch {
					return false;
				}
			},
			concurrency
		);
	}

	async matchManyMultiple<T = any>(
		value: T[],
		input: Record<string, FilterCriteria.MatchInput>,
		concurrency: number = Infinity
	): Promise<Record<string, T[]>> {
		const multiArgs = _.mapValues(input, filter => {
			const converted = this.translateToFilterGroupInput(filter);

			return filterGroup.parse(converted.input);
		});

		const results = await promiseReduce<any, Record<string, any>>(
			value,
			async (reduction, item) => {
				for (const key in multiArgs) {
					if (!reduction[key]) {
						reduction[key] = [];
					}

					const args = multiArgs[key];

					// when filter is empty, return all items
					if (this.$empty(args)) {
						reduction[key].push(item);
						continue;
					}

					// filter out filters with no criterias
					args.filters = _.filter(args.filters, f => {
						return _.size(f.criterias) > 0;
					});

					try {
						let passed = false;

						if (args.operator === 'AND') {
							// For AND, process filters sequentially and short-circuit on first failure
							passed = true;
							for (const filter of args.filters) {
								const filterResult = await this.applyFilter(item, filter);
								if (!filterResult.passed) {
									passed = false;
									break; // Short-circuit on first filter failure
								}
							}
						} else {
							// For OR, process filters in parallel and short-circuit on first success
							const filtersResults = await promiseMap(args.filters, filter => {
								return this.applyFilter(item, filter);
							});

							passed = _.some(filtersResults, r => {
								return r.passed;
							});
						}

						if (passed) {
							reduction[key].push(item);
						}
					} catch {
						// ignore
					}
				}

				return reduction;
			},
			{},
			concurrency
		);

		// Ensure all keys from multiArgs are present in the results
		return _.mapValues(multiArgs, (value, key) => {
			return results[key] || [];
		});
	}

	private async applyCriteria(
		value: any,
		criteria: FilterCriteria.CriteriaInput,
		context: Map<string, any> = new Map()
	): Promise<FilterCriteria.CriteriaResult> {
		// ensure immutable
		criteria = { ...criteria };

		// dynamic match value
		if (
			_.isPlainObject(criteria.matchValue) &&
			'$path' in criteria.matchValue &&
			_.isArray(criteria.matchValue.$path) &&
			(_.isArray(value) || _.isPlainObject(value))
		) {
			criteria.matchValue = _.get(value, criteria.matchValue.$path);
		} else if (_.isFunction(criteria.matchValue)) {
			// custom match value
			criteria.matchValue = criteria.matchValue({ context, criteria, value });
		}

		try {
			if (criteria.type === 'CUSTOM') {
				const passed = criteria.predicate ? await this.applyCustomCriteria(value, criteria.predicate, criteria.matchValue) : false;

				return {
					matchValue: stringify(criteria.matchValue),
					passed,
					reason: `CUSTOM predicate check ${passed ? 'PASSED' : 'FAILED'}`,
					value
				};
			}

			let passed = false;
			let arrayBranching = false;

			if ('normalize' in criteria && criteria.normalize) {
				criteria.matchValue = this.normalize(criteria.matchValue);
			}

			if ('criteriaMapper' in criteria && _.isFunction(criteria.criteriaMapper)) {
				criteria = await criteria.criteriaMapper({ context, criteria, value });

				if (criteria.type === 'CUSTOM') {
					return this.applyCriteria(value, criteria, context);
				}
			}

			if ('valueMapper' in criteria && _.isFunction(criteria.valueMapper)) {
				value = await criteria.valueMapper({ context, criteria, value });
			}

			if ('valuePath' in criteria && _.isArray(criteria.valuePath) && _.size(criteria.valuePath) > 0) {
				const found = this.findByPath(value, criteria.valuePath, criteria.defaultValue);

				value = found.value;
				arrayBranching = found.arrayBranching;
			}

			if ('normalize' in criteria && criteria.normalize) {
				value = this.normalize(value);
			}

			if (arrayBranching) {
				passed = _.some(value, v => {
					return this.evaluateCriteria(v, criteria);
				});
			} else {
				passed = this.evaluateCriteria(value, criteria);
			}

			return {
				matchValue: stringify(criteria.matchValue),
				passed,
				reason: `${criteria.type} criteria "${criteria.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
				value
			};
		} catch (err) {
			return {
				matchValue: stringify(criteria.matchValue),
				passed: false,
				reason: (err as Error).message,
				value
			};
		}
	}

	private async applyFilter(value: any, filter: FilterCriteria.FilterInput): Promise<FilterCriteria.FilterResult> {
		// Optimization for AND filter - process one filter at a time and short-circuit if any fails
		if (filter.operator === 'AND' && _.size(filter.criterias) > 1) {
			// First check if we have any heavy criteria
			const someHeavyCriteria = _.some(filter.criterias, criteria => {
				return 'heavy' in criteria && criteria.heavy;
			});

			if (someHeavyCriteria) {
				// First evaluate all non-heavy criteria
				const nonHeavyCriterias = _.filter(filter.criterias, criteria => {
					return !('heavy' in criteria) || !criteria.heavy;
				});

				if (_.size(nonHeavyCriterias) > 0) {
					const nonHeavyResults = await Promise.all(
						_.map(nonHeavyCriterias, criteria => {
							return this.applyCriteria(value, criteria);
						})
					);

					// If any non-heavy criteria fails, we can skip the heavy ones
					const allNonHeavyPassed = _.every(nonHeavyResults, r => {
						return r.passed;
					});

					if (!allNonHeavyPassed) {
						// Short-circuit and return early with failure
						return {
							operator: filter.operator,
							passed: false,
							reason: `Filter "${filter.operator}" check FAILED (short-circuited)`,
							results: nonHeavyResults as FilterCriteria.CriteriaResult[]
						};
					}

					// If all non-heavy passed, continue with heavy criteria
					const heavyCriterias = _.filter(filter.criterias, criteria => {
						return 'heavy' in criteria && criteria.heavy;
					});

					const heavyResults = await Promise.all(
						_.map(heavyCriterias, criteria => {
							return this.applyCriteria(value, criteria as FilterCriteria.CriteriaInput);
						})
					);

					// Combine results in the original order
					let allResults: FilterCriteria.CriteriaResult[] = [];
					let heavyIndex = 0;
					let nonHeavyIndex = 0;

					for (const criteria of filter.criterias) {
						if ('heavy' in criteria && criteria.heavy) {
							allResults = [...allResults, heavyResults[heavyIndex++]];
						} else {
							allResults = [...allResults, nonHeavyResults[nonHeavyIndex++]];
						}
					}

					const passed = _.every(allResults, r => {
						return r.passed;
					});

					return {
						operator: filter.operator,
						passed,
						reason: `Filter "${filter.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
						results: allResults
					};
				}
			}
		}

		// Default behavior for OR operator or when no optimization is possible
		const criteriaResults = await Promise.all(
			_.map(filter.criterias, criteria => {
				return this.applyCriteria(value, criteria);
			})
		);

		const passed =
			filter.operator === 'AND'
				? _.every(criteriaResults, r => {
						return r.passed;
					})
				: _.some(criteriaResults, r => {
						return r.passed;
					});

		return {
			operator: filter.operator,
			passed,
			reason: `Filter "${filter.operator}" check ${passed ? 'PASSED' : 'FAILED'}`,
			results: criteriaResults as FilterCriteria.CriteriaResult[]
		};
	}

	private evaluateCriteria(value: any, criteria: FilterCriteria.CriteriaInput): boolean {
		if ('matchInArray' in criteria && criteria.matchInArray && _.isArray(value)) {
			return _.some(value, item => {
				return this.evaluateSingleCriteria(item, criteria);
			});
		}

		return this.evaluateSingleCriteria(value, criteria);
	}

	private evaluateSingleCriteria(value: any, criteria: FilterCriteria.CriteriaInput): boolean {
		if (!('operator' in criteria) || !criteria.operator) {
			throw new Error('Unknown criteria operator');
		}

		switch (criteria.type) {
			case 'ARRAY':
				return this.applyArrayCriteria(value, criteria.operator, criteria.matchValue);
			case 'BOOLEAN':
				return this.applyBooleanCriteria(value, criteria.operator, criteria.matchValue);
			case 'DATE':
				return this.applyDateCriteria(value, criteria.operator, criteria.matchValue);
			case 'GEO':
				return this.applyGeoCriteria(value, criteria.operator, criteria.matchValue);
			case 'MAP':
				return this.applyMapCriteria(value, criteria.operator, criteria.matchValue);
			case 'NUMBER':
				return this.applyNumberCriteria(value, criteria.operator, criteria.matchValue);
			case 'OBJECT':
				return this.applyObjectCriteria(value, criteria.operator, criteria.matchValue);
			case 'SET':
				return this.applySetCriteria(value, criteria.operator, criteria.matchValue);
			case 'STRING':
				return this.applyStringCriteria(value, criteria.operator, criteria.matchValue);
			default:
				throw new Error('Unknown criteria type');
		}
	}

	private applyArrayCriteria(value: any[], operator: FilterCriteria.Operators['array'], matchValue: any): boolean {
		const validValue = _.isArray(value);

		if (!validValue) {
			return false;
		}

		const containsDeepEqual = (value: any[], matchValue: any) => {
			return _.some(value, v => {
				return _.isEqual(v, matchValue);
			});
		};

		switch (operator) {
			case 'EXACTLY-MATCHES': {
				matchValue = toArray(matchValue);

				return _.isEqual(_.sortBy(value), _.sortBy(matchValue));
			}

			case 'HAS': {
				return _.some(value, v => {
					return _.isEqual(v, matchValue);
				});
			}

			case 'INCLUDES-ALL': {
				matchValue = toArray(matchValue);

				return _.every(matchValue, v => {
					return containsDeepEqual(value, v);
				});
			}

			case 'INCLUDES-ANY': {
				matchValue = toArray(matchValue);

				return _.some(matchValue, v => {
					return containsDeepEqual(value, v);
				});
			}

			case 'IS-EMPTY': {
				return _.size(value) === 0;
			}

			case 'NOT-EMPTY': {
				return _.size(value) > 0;
			}

			case 'NOT-INCLUDES-ALL': {
				matchValue = toArray(matchValue);

				return !_.every(matchValue, v => {
					return containsDeepEqual(value, v);
				});
			}

			case 'NOT-INCLUDES-ANY': {
				if (!_.isArray(matchValue)) {
					return false;
				}

				return !_.some(matchValue, v => {
					return containsDeepEqual(value, v);
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

	private applyBooleanCriteria(value: any, operator: FilterCriteria.Operators['boolean'], matchValue: any): boolean {
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

	private applyCustomCriteria(value: any, predicate: FilterCriteria.CriteriaCustomPredicate, matchValue: any): boolean | Promise<boolean> {
		return predicate ? predicate({ matchValue, value }) : false;
	}

	private applyDateCriteria(value: string, operator: FilterCriteria.Operators['date'], matchValue: any): boolean {
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

	private applyGeoCriteria(
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

	private applyMapCriteria(value: Map<any, any>, operator: FilterCriteria.Operators['map'], matchValue: any): boolean {
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

	private applyNumberCriteria(value: number, operator: FilterCriteria.Operators['number'], matchValue: any): boolean {
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

	private applyObjectCriteria(value: any, operator: FilterCriteria.Operators['object'], matchValue: any): boolean {
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

	private applySetCriteria(value: Set<any>, operator: FilterCriteria.Operators['set'], matchValue: any): boolean {
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

	private applyStringCriteria(value: string, operator: FilterCriteria.Operators['string'], matchValue: any): boolean {
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

			case 'NOT-CONTAINS': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return !_.includes(value, matchValue);
			}

			case 'NOT-ENDS-WITH': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return !_.endsWith(value, matchValue);
			}

			case 'NOT-EQUALS': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return value !== matchValue;
			}

			case 'NOT-IN': {
				if (!isStringArray(matchValue)) {
					return false;
				}

				return !matchValue.includes(value);
			}

			case 'NOT-STARTS-WITH': {
				if (!_.isString(matchValue)) {
					return false;
				}

				return !_.startsWith(value, matchValue);
			}

			case 'NOT-MATCHES-REGEX': {
				if (!_.isString(matchValue) && !_.isRegExp(matchValue)) {
					return false;
				}

				return !new RegExp(matchValue).test(value);
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

	private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }, unit: 'km' | 'mi' = 'km'): number {
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

	/*
		findByPath function is designed to traverse nested data structures using 
		a path array and track whether it encounters many possible paths during traversal.
	*/
	private findByPath(
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

	inspect(): string {
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

	normalize(value: any): any {
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

	private normalizeString = _.memoize((value: string): string => {
		value = _.trim(value);
		value = _.toLower(value);
		value = _.deburr(value);
		value = value.replace(/([a-z])([A-Z])/g, '$1-$2');
		value = value.replace(/\s+/g, '-');
		value = value.replace(/\-+/g, '-');
		value = _.trim(value, '-');

		return value;
	});

	private objectContaining(obj: any, subObject: any): boolean {
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

	saveCriteria<T extends FilterCriteria.Criteria>(criteria: T): this {
		if (!criteria.alias) {
			throw new Error('Alias is required');
		}

		this.savedCriteria.set(criteria.alias, {
			criteria
		});

		return this;
	}

	private toRad(value: number): number {
		return (value * Math.PI) / 180;
	}

	private translateCriteriaAlias(criteria: FilterCriteria.CriteriaInput & { alias: string }) {
		const saved = this.savedCriteria.get(criteria.alias);

		if (!saved) {
			throw new Error(`Criteria "${criteria.alias}" not found`);
		}

		// ensure immutable
		let savedCriteria = { ...saved.criteria };

		if ('criteriaMapper' in criteria && !_.isNil(criteria.criteriaMapper) && 'criteriaMapper' in savedCriteria) {
			savedCriteria.criteriaMapper = criteria.criteriaMapper;
		}

		if ('matchInArray' in criteria && !_.isNil(criteria.matchInArray) && 'matchInArray' in savedCriteria) {
			savedCriteria.matchInArray = criteria.matchInArray;
		}

		if ('matchValue' in criteria && !_.isNil(criteria.matchValue) && 'matchValue' in savedCriteria) {
			savedCriteria.matchValue = criteria.matchValue;
		}

		if ('normalize' in criteria && !_.isNil(criteria.normalize) && 'normalize' in savedCriteria) {
			savedCriteria.normalize = criteria.normalize;
		}

		if ('operator' in criteria && !_.isNil(criteria.operator) && 'operator' in savedCriteria) {
			savedCriteria.operator = criteria.operator;
		}

		if ('valueMapper' in criteria && !_.isNil(criteria.valueMapper) && 'valueMapper' in savedCriteria) {
			savedCriteria.valueMapper = criteria.valueMapper;
		}

		if ('valuePath' in criteria && !_.isNil(criteria.valuePath) && _.size(criteria.valuePath) > 0 && 'valuePath' in savedCriteria) {
			savedCriteria.valuePath = criteria.valuePath;
		}

		if ('type' in criteria && !_.isNil(criteria.type) && 'type' in savedCriteria) {
			savedCriteria.type = criteria.type;

			if ('defaultValue' in savedCriteria) {
				const matchedSchema = schema.criteria.optionsMap.get(savedCriteria.type);
				const newDefaultValue = matchedSchema?.shape?.defaultValue?._def?.defaultValue();

				savedCriteria.defaultValue = newDefaultValue;
			}

			// revalidate schema
			savedCriteria = schema.criteria.parse(savedCriteria);
		}

		return savedCriteria;
	}

	private translateToFilterGroupInput(
		input: FilterCriteria.MatchInput,
		translateCriteriaAlias: boolean = true
	): {
		input: FilterCriteria.FilterGroupInput;
		level: 'filter-group' | 'filter' | 'criteria';
	} {
		let result: {
			input: FilterCriteria.FilterGroupInput;
			level: 'filter-group' | 'filter' | 'criteria';
		};

		if ('filters' in input) {
			// Handle FilterGroupInput
			result = {
				input,
				level: 'filter-group'
			};
		} else if ('criterias' in input) {
			// Handle FilterInput
			result = {
				input: {
					filters: [input],
					operator: 'AND'
				},
				level: 'filter'
			};
		} else {
			// Handle CriteriaInput
			result = {
				input: {
					filters: [
						{
							operator: 'AND',
							criterias: [input]
						}
					],
					operator: 'AND'
				},
				level: 'criteria'
			};
		}

		return {
			...result,
			input: {
				...result.input,
				filters: _.map(result.input.filters, filter => {
					return {
						...filter,
						criterias: _.map(filter.criterias, criteria => {
							if (criteria.alias && translateCriteriaAlias) {
								return this.translateCriteriaAlias(criteria as FilterCriteria.CriteriaInput & { alias: string });
							}

							return criteria;
						})
					};
				})
			}
		};
	}

	async validate(input: FilterCriteria.MatchInput): Promise<{ valid: boolean; error: Error | null }> {
		try {
			const converted = this.translateToFilterGroupInput(input);
			await filterGroup.parseAsync(converted.input);

			return { valid: true, error: null };
		} catch (err) {
			return { valid: false, error: err as Error };
		}
	}
}

export default FilterCriteria;
