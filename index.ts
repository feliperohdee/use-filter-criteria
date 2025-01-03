import _ from 'lodash';
import z from 'zod';

const filterLogicalOperator = z.enum(['AND', 'OR']);
const filterOperator = {
	array: z.enum(['EXACTLY_MATCHES', 'INCLUDES_ALL', 'INCLUDES_ANY', 'IS_EMPTY', 'IS_NOT_EMPTY', 'NOT_INCLUDES_ALL', 'NOT_INCLUDES_ANY']),
	boolean: z.enum(['IS', 'IS-NOT']),
	date: z.enum(['AFTER', 'BEFORE', 'BETWEEN']),
	geo: z.enum(['IN-RADIUS']),
	number: z.enum(['BETWEEN', 'EQUALS', 'GREATER', 'GREATER-EQUALS', 'LESS', 'LESS-EQUALS']),
	text: z.enum(['CONTAINS', 'ENDS-WITH', 'EQUALS', 'IS-EMPTY', 'MATCHES-REGEX', 'STARTS-WITH'])
};

const filterCriteria = z.discriminatedUnion('type', [
	z.object({
		defaultValue: z.array(z.unknown()).default([]),
		normalize: z.boolean().default(true),
		operator: filterOperator.array,
		source: z.array(z.string()),
		type: z.literal('ARRAY'),
		value: z.array(z.unknown())
	}),
	z.object({
		defaultValue: z.boolean().default(false),
		operator: filterOperator.boolean,
		source: z.array(z.string()),
		type: z.literal('BOOLEAN'),
		value: z.boolean()
	}),
	z.object({
		defaultValue: z
			.string()
			.datetime()
			.default(() => {
				return new Date().toISOString();
			}),
		operator: filterOperator.date,
		source: z.array(z.string()),
		type: z.literal('DATE'),
		value: z.union([z.string().datetime(), z.tuple([z.string().datetime(), z.string().datetime()])])
	}),
	z.object({
		defaultValue: z.record(z.number()).default({ lat: 0, lng: 0 }),
		getCoordinates: z
			.function()
			.args(z.record(z.number()))
			.returns(z.tuple([z.number(), z.number()]))
			.optional(),
		operator: filterOperator.geo,
		source: z.array(z.string()),
		type: z.literal('GEO'),
		value: z.object({
			lat: z.number(),
			lng: z.number(),
			radius: z.number().optional(),
			unit: z.enum(['km', 'mi']).optional()
		})
	}),
	z.object({
		defaultValue: z.number().default(0),
		operator: filterOperator.number,
		source: z.array(z.string()),
		type: z.literal('NUMBER'),
		value: z.union([z.number(), z.array(z.number())])
	}),
	z.object({
		defaultValue: z.string().default(''),
		normalize: z.boolean().default(true),
		operator: filterOperator.text,
		source: z.array(z.string()),
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
}

class FilterCriteria {
	static apply(data: any[], input: FilterCriteria.FilterInput): any[] {
		input = filter.parse(input);

		return _.filter(data, item => {
			const results = _.map(input.rules, rule => {
				return this.applyRule(item, rule);
			});

			return input.operator === 'AND' ? _.every(results, Boolean) : _.some(results, Boolean);
		});
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

			case 'IS-NOT': {
				return value !== filterValue;
			}

			default:
				return false;
		}
	}

	static applyCriteria(item: any, criteria: FilterCriteria.CriteriaInput): boolean {
		let value = this.getValue(item, criteria.source, criteria.defaultValue);

		if (_.isUndefined(value)) {
			return false;
		}

		if ('normalize' in criteria && criteria.normalize) {
			criteria.value = this.normalize(criteria.value);
			value = this.normalize(value);
		}

		switch (criteria.type) {
			case 'ARRAY': {
				return this.applyArrayFilter(value, criteria.operator, criteria.value);
			}

			case 'BOOLEAN': {
				return this.applyBooleanFilter(value, criteria.operator, criteria.value);
			}

			case 'DATE': {
				return this.applyDateFilter(value, criteria.operator, criteria.value);
			}

			case 'GEO': {
				const [lat, lng] = criteria.getCoordinates?.(value) || [value.lat, value.lng];

				return this.applyGeoFilter({ lat, lng }, criteria.operator, criteria.value);
			}

			case 'NUMBER': {
				return this.applyNumberFilter(value, criteria.operator, criteria.value);
			}

			case 'TEXT': {
				return this.applyTextFilter(value, criteria.operator, criteria.value);
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
			case 'BEFORE': {
				return date < start;
			}

			case 'AFTER': {
				return date > start;
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
			case 'IN-RADIUS': {
				return this.calculateDistance(value, filterValue) <= (filterValue.radius || 0);
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

			case 'GREATER-EQUALS': {
				return value >= (filterValue as number);
			}

			case 'LESS': {
				return value < (filterValue as number);
			}

			case 'LESS-EQUALS': {
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

	static applyRule(item: any, rule: FilterCriteria.RuleInput): boolean {
		const results = _.map(rule.criteria, criteria => {
			return this.applyCriteria(item, criteria);
		});

		return rule.operator === 'AND' ? _.every(results, Boolean) : _.some(results, Boolean);
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

			case 'ENDS-WITH': {
				return _.endsWith(value, filterValue as string);
			}

			case 'IS-EMPTY': {
				return _.isEmpty(value);
			}

			case 'MATCHES-REGEX': {
				return new RegExp(filterValue as string).test(value);
			}

			case 'STARTS-WITH': {
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

	static getValue(obj: any, path: string[], defaultValue?: any): any {
		return _.get(obj, path, defaultValue);
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
