# use-filter-criteria

A TypeScript-based filtering engine that provides a flexible, type-safe way to filter complex data structures using declarative criteria. Perfect for building advanced search interfaces, data filtering systems, or query builders.

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://github.com/colinhacks/zod)
[![Lodash](https://img.shields.io/badge/-Lodash-3492FF?style=flat-square&logo=lodash&logoColor=white)](https://lodash.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🎯 **Type-Safe**: Built with TypeScript and Zod for runtime type validation
- 🔄 **Multiple Data Types**: Support for arrays, booleans, dates, geographic coordinates, numbers, and text
- 🎨 **Rich Operators**: Comprehensive set of comparison and logical operators
- 🌐 **Internationalization-Ready**: Built-in text normalization (accents, case, etc.)
- 🔍 **Complex Queries**: Support for nested AND/OR logic combinations
- 📍 **Geospatial**: Built-in support for geographic radius searches
- 🎛️ **Flexible**: Customizable default values and source path resolution
- 🔄 **Dynamic Values**: Support for dynamic value resolution using `$path`

## Installation

```bash
npm install use-filter-criteria
# or
yarn add use-filter-criteria
```

## Quick Start

```typescript
import FilterCriteria from 'use-filter-criteria';

const data = [
	{
		active: true,
		age: 25,
		name: 'John Doe',
		tags: ['developer', 'javascript']
	}
	// ... more items
];

// Create a filter
const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 20
				},
				{
					type: 'ARRAY',
					operator: 'INCLUDES_ANY',
					path: ['tags'],
					value: ['developer']
				}
			]
		}
	]
};

// Apply the filter
const results = FilterCriteria.apply(data, filter);
```

## Supported Filter Types

### Array Operators

- `EXACTLY_MATCHES`: Arrays contain the same elements (order independent)
- `INCLUDES_ALL`: Array contains ALL filter values
- `INCLUDES_ANY`: Array contains AT LEAST ONE filter value
- `IS_EMPTY`: Array is empty
- `IS_NOT_EMPTY`: Array is not empty
- `NOT_INCLUDES_ALL`: Array is missing AT LEAST ONE filter value
- `NOT_INCLUDES_ANY`: Array contains NONE of the filter values

### Boolean Operators

- `IS`: Value equals the filter value
- `IS_NOT`: Value does not equal the filter value

### Date Operators

- `AFTER`: Date is after the filter value
- `AFTER_OR_EQUALS`: Date is after or equal to the filter value
- `BEFORE`: Date is before the filter value
- `BEFORE_OR_EQUALS`: Date is before or equal to the filter value
- `BETWEEN`: Date is between two filter values

### Geographic Operators

- `IN_RADIUS`: Point is within the specified radius
- `NOT_IN_RADIUS`: Point is outside the specified radius

### Number Operators

- `BETWEEN`: Number is between two values (inclusive)
- `EQUALS`: Number equals the filter value
- `GREATER`: Number is greater than the filter value
- `GREATER_OR_EQUALS`: Number is greater than or equal to the filter value
- `LESS`: Number is less than the filter value
- `LESS_OR_EQUALS`: Number is less than or equal to the filter value

### Text Operators

- `CONTAINS`: Text contains the filter value
- `ENDS_WITH`: Text ends with the filter value
- `EQUALS`: Text equals the filter value
- `IS_EMPTY`: Text is empty
- `MATCHES_REGEX`: Text matches the regular expression pattern
- `STARTS_WITH`: Text starts with the filter value

## Advanced Usage

### Dynamic Values Using $path

You can use dynamic values in your filters by referencing other fields in the same object using the `$path` syntax:

```typescript
const data = [
	{
		id: 1,
		tags: ['developer', 'javascript'],
		requiredTags: ['developer', 'javascript']
	},
	{
		id: 2,
		tags: ['developer', 'python'],
		requiredTags: ['developer', 'javascript']
	}
];

const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'ARRAY',
					operator: 'EXACTLY_MATCHES',
					path: ['tags'],
					value: { $path: ['requiredTags'] } // Compare tags with requiredTags
				}
			]
		}
	]
};

// Will return only items where tags exactly match requiredTags
const results = FilterCriteria.apply(data, filter);
```

This feature is particularly useful when you need to:

- Compare fields within the same object
- Build dynamic filters based on object properties
- Create relative comparisons between fields

## Detailed API Reference

### Basic Filter Application

```typescript
FilterCriteria.apply(data: any[], filter: FilterCriteria.FilterInput): any[]
```

Applies the filter to an array of data and returns filtered results.

### Match Operations

#### Simple Match

```typescript
FilterCriteria.applyMatch(
  data: any,
  filter: FilterCriteria.FilterInput,
  detailed: false
): boolean
```

Returns a boolean indicating if the data matches the filter criteria.

#### Detailed Match

```typescript
FilterCriteria.applyMatch(
  data: any,
  filter: FilterCriteria.FilterInput,
  detailed: true
): FilterCriteria.MatchResult
```

Returns a detailed result object with the following structure:

```typescript
type MatchResult = {
	level: 'match';
	operator: LogicalOperator; // 'AND' | 'OR'
	passed: boolean;
	reason: string;
	results: RuleResult[];
};

type RuleResult = {
	level: 'rule';
	operator: LogicalOperator;
	passed: boolean;
	reason: string;
	results: CriteriaResult[];
};

type CriteriaResult = {
	criteriaValue: any;
	level: 'criteria';
	operator: string;
	passed: boolean;
	reason: string;
	value: any;
};
```

Example usage:

```typescript
// Simple match
const isMatch = FilterCriteria.applyMatch(item, filter);
console.log(isMatch); // true/false

// Detailed match
const detailedResult = FilterCriteria.applyMatch(item, filter, true);
console.log(detailedResult);
/* Output example:
{
  level: 'match',
  operator: 'AND',
  passed: true,
  reason: 'Match "AND" check PASSED',
  results: [
    {
      level: 'rule',
      operator: 'OR',
      passed: true,
      reason: 'Rule "OR" check PASSED',
      results: [
        {
          criteriaValue: 'john',
          level: 'criteria',
          operator: 'CONTAINS',
          passed: true,
          reason: 'Text "CONTAINS" check PASSED',
          value: 'john-doe'
        }
      ]
    }
  ]
}
*/
```

## TypeScript Support

Full TypeScript support is provided out of the box. The library exports all necessary types and interfaces:

```typescript
import FilterCriteria, { FilterCriteriaTypes } from 'use-filter-criteria';

type FilterInput = FilterCriteriaTypes.FilterInput;
type Filter = FilterCriteriaTypes.Filter;
type Rule = FilterCriteriaTypes.Rule;
type Criteria = FilterCriteriaTypes.Criteria;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## Author

**Felipe Rohde**

- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
