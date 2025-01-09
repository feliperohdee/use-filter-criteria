# use-filter-criteria

A TypeScript-based filtering engine that provides a flexible, type-safe way to filter complex data structures using declarative criteria. Perfect for building advanced search interfaces, data filtering systems, or query builders.

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://github.com/colinhacks/zod)
[![Lodash](https://img.shields.io/badge/-Lodash-3492FF?style=flat-square&logo=lodash&logoColor=white)](https://lodash.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🎯 **Type-Safe**: Built with TypeScript and Zod for runtime type validation
- 🔄 **Multiple Data Types**: Support for arrays, booleans, dates, geographic coordinates, maps, numbers, sets, and strings
- 🎨 **Rich Operators**: Comprehensive set of comparison and logical operators
- 🌐 **Internationalization-Ready**: Built-in string normalization (accents, case, etc.)
- 🔍 **Complex Queries**: Support for nested AND/OR logic combinations
- 📍 **Geospatial**: Built-in support for geographic radius searches
- 🎛️ **Flexible**: Customizable default values and source path resolution
- 🔄 **Dynamic Values**: Support for dynamic value resolution using `$path`
- 📊 **Detailed Logging**: Optional detailed diagnostics for understanding filter results

## Installation

```bash
npm install use-filter-criteria
# or
yarn add use-filter-criteria
```

## Quick Start

```typescript
import FilterCriteria from 'use-filter-criteria';

// Example data
const users = [
	{
		id: 1,
		name: 'John Doe',
		age: 30,
		skills: new Set(['typescript', 'react']),
		roles: ['admin', 'developer'],
		active: true,
		lastLogin: '2024-01-01T00:00:00Z',
		location: { lat: 40.7128, lng: -74.006 },
		metadata: new Map([['level', 'senior']])
	}
	// ... more users
];

// Simple number comparison
const ageFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 25
				}
			]
		}
	]
};

// Complex multi-criteria filter
const complexFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'SET',
					operator: 'INCLUDES_ANY',
					path: ['skills'],
					value: ['typescript', 'python']
				},
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
					type: 'STRING',
					operator: 'CONTAINS',
					path: ['name'],
					value: 'john'
				},
				{
					type: 'ARRAY',
					operator: 'INCLUDES_ANY',
					path: ['roles'],
					value: ['admin']
				}
			]
		}
	]
};

// Basic usage
const matchingUsers = await FilterCriteria.matchMany(users, complexFilter);
console.log(matchingUsers);

// With detailed logging
const detailedResult = await FilterCriteria.match(users[0], complexFilter, true);
console.log(detailedResult);
```

## Input Formats

The library supports three levels of filter complexity to match your needs:

### 1. Simple Criteria Input

For basic, single-condition filtering:

```typescript
const simpleCriteria = {
	type: 'NUMBER',
	operator: 'GREATER',
	path: ['age'],
	value: 25
};

const result = await FilterCriteria.matchCriteria(data, simpleCriteria);
```

### 2. Rule Input

For grouping multiple criteria with a logical operator:

```typescript
const ruleInput = {
	operator: 'AND',
	criteria: [
		{
			type: 'NUMBER',
			operator: 'GREATER',
			path: ['age'],
			value: 25
		},
		{
			type: 'STRING',
			operator: 'CONTAINS',
			path: ['name'],
			value: 'john'
		}
	]
};

const result = await FilterCriteria.matchRule(data, ruleInput);
```

### 3. Complete Filter Input

For complex filtering with multiple rules and nested logic:

```typescript
const filterInput = {
	operator: 'OR',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 25
				},
				{
					type: 'SET',
					operator: 'INCLUDES_ALL',
					path: ['skills'],
					value: ['typescript']
				}
			]
		},
		{
			operator: 'OR',
			criteria: [
				{
					type: 'STRING',
					operator: 'MATCHES_REGEX',
					path: ['name'],
					value: /^john/i
				}
			]
		}
	]
};

const result = await FilterCriteria.match(data, filterInput);
```

Each input format supports all the filter types and operators described in the "Supported Filter Types" section. The choice between them depends on your filtering complexity needs:

- Use **Criteria Input** for simple, single-condition checks
- Use **Rule Input** when you need to combine multiple criteria with AND/OR logic
- Use **Filter Input** for complex scenarios requiring multiple rules and nested logic combinations

## Detailed Logging

The `match` and `matchMany` functions support detailed logging that provides comprehensive information about why filters passed or failed. Enable detailed logging by passing `true` as the third parameter to `match`:

```typescript
const result = await FilterCriteria.match(data, filter, true);
```

The detailed output includes:

- Match level information showing overall filter results
- Rule level results showing how each rule was evaluated
- Criteria level details showing:
  - The actual value found at the specified path
  - The criteria value being compared against
  - The operator used
  - Whether the check passed or failed
  - A human-readable reason for the result

This detailed output is invaluable for:

- Debugging complex filters
- Understanding why certain records were included/excluded
- Validating filter logic
- Troubleshooting unexpected results

### Detailed Logging Examples

Here are examples showing how to use detailed logging with different filter types:

```typescript
// String filter with detailed logging
const stringFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'STRING',
					operator: 'CONTAINS',
					path: ['name'],
					value: 'john'
				}
			]
		}
	]
};

const stringResult = await FilterCriteria.match(users[0], stringFilter, true);
/* Output:
{
  level: 'match',
  operator: 'AND',
  passed: true,
  reason: 'Match "AND" check PASSED',
  results: [{
    level: 'rule',
    operator: 'AND',
    passed: true,
    reason: 'Rule "AND" check PASSED',
    results: [{
      criteriaValue: 'john',
      level: 'criteria',
      operator: 'CONTAINS',
      passed: true,
      reason: 'String "CONTAINS" check PASSED',
      value: 'john-doe'
    }]
  }]
}
*/

// Geographic filter with detailed logging
const geoFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'GEO',
					operator: 'IN_RADIUS',
					path: ['location'],
					value: {
						lat: 40.7128,
						lng: -74.006,
						radius: 10,
						unit: 'km'
					}
				}
			]
		}
	]
};

const geoResult = await FilterCriteria.match(users[0], geoFilter, true);
/* Output shows detailed radius check results:
{
  level: 'match',
  operator: 'AND',
  passed: true,
  reason: 'Match "AND" check PASSED',
  results: [{
    level: 'rule',
    operator: 'AND',
    passed: true,
    reason: 'Rule "AND" check PASSED',
    results: [{
      criteriaValue: {
        lat: 40.7128,
        lng: -74.006,
        radius: 10,
        unit: 'km'
      },
      level: 'criteria',
      operator: 'IN_RADIUS',
      passed: true,
      reason: 'Geo "IN_RADIUS" check PASSED',
      value: { lat: 40.7128, lng: -74.006 }
    }]
  }]
}
*/

// Complex nested filter with detailed logging
const nestedFilter = {
	operator: 'OR',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'NUMBER',
					operator: 'GREATER',
					path: ['age'],
					value: 25
				},
				{
					type: 'SET',
					operator: 'INCLUDES_ALL',
					path: ['skills'],
					value: ['typescript']
				}
			]
		},
		{
			operator: 'OR',
			criteria: [
				{
					type: 'STRING',
					operator: 'MATCHES_REGEX',
					path: ['name'],
					value: /^john/i
				}
			]
		}
	]
};

const nestedResult = await FilterCriteria.match(users[0], nestedFilter, true);
/* Output shows the complete evaluation tree:
{
  level: 'match',
  operator: 'OR',
  passed: true,
  reason: 'Match "OR" check PASSED',
  results: [
    {
      level: 'rule',
      operator: 'AND',
      passed: true,
      reason: 'Rule "AND" check PASSED',
      results: [
        {
          criteriaValue: 25,
          level: 'criteria',
          operator: 'GREATER',
          passed: true,
          reason: 'Number "GREATER" check PASSED',
          value: 30
        },
        {
          criteriaValue: ['typescript'],
          level: 'criteria',
          operator: 'INCLUDES_ALL',
          passed: true,
          reason: 'Set "INCLUDES_ALL" check PASSED',
          value: Set(['typescript', 'react'])
        }
      ]
    },
    {
      level: 'rule',
      operator: 'OR',
      passed: true,
      reason: 'Rule "OR" check PASSED',
      results: [
        {
          criteriaValue: /^john/i,
          level: 'criteria',
          operator: 'MATCHES_REGEX',
          passed: true,
          reason: 'String "MATCHES_REGEX" check PASSED',
          value: 'John Doe'
        }
      ]
    }
  ]
}
*/
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
- `SIZE_EQUALS`: Array size equals the filter value
- `SIZE_GREATER`: Array size is greater than the filter value
- `SIZE_GREATER_OR_EQUALS`: Array size is greater than or equal to the filter value
- `SIZE_LESS`: Array size is less than the filter value
- `SIZE_LESS_OR_EQUALS`: Array size is less than or equal to the filter value

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

### Map Operators

- `HAS_KEY`: Map contains the specified key
- `HAS_VALUE`: Map contains the specified value
- `IS_EMPTY`: Map is empty
- `IS_NOT_EMPTY`: Map is not empty
- `SIZE_EQUALS`: Map size equals the filter value
- `SIZE_GREATER`: Map size is greater than the filter value
- `SIZE_GREATER_OR_EQUALS`: Map size is greater than or equal to the filter value
- `SIZE_LESS`: Map size is less than the filter value
- `SIZE_LESS_OR_EQUALS`: Map size is less than or equal to the filter value

### Number Operators

- `BETWEEN`: Number is between two values (inclusive)
- `EQUALS`: Number equals the filter value
- `GREATER`: Number is greater than the filter value
- `GREATER_OR_EQUALS`: Number is greater than or equal to the filter value
- `LESS`: Number is less than the filter value
- `LESS_OR_EQUALS`: Number is less than or equal to the filter value

### Set Operators

- `EXACTLY_MATCHES`: Set contains the exact same elements
- `HAS`: Set contains the specific element
- `INCLUDES_ALL`: Set contains ALL filter values
- `INCLUDES_ANY`: Set contains AT LEAST ONE filter value
- `IS_EMPTY`: Set is empty
- `IS_NOT_EMPTY`: Set is not empty
- `NOT_INCLUDES_ALL`: Set is missing AT LEAST ONE filter value
- `NOT_INCLUDES_ANY`: Set contains NONE of the filter values
- `SIZE_EQUALS`: Set size equals the filter value
- `SIZE_GREATER`: Set size is greater than the filter value
- `SIZE_GREATER_OR_EQUALS`: Set size is greater than or equal to the filter value
- `SIZE_LESS`: Set size is less than the filter value
- `SIZE_LESS_OR_EQUALS`: Set size is less than or equal to the filter value

### String Operators

- `CONTAINS`: String contains the filter value
- `ENDS_WITH`: String ends with the filter value
- `EQUALS`: String equals the filter value
- `IS_EMPTY`: String is empty
- `MATCHES_REGEX`: String matches the regular expression pattern
- `STARTS_WITH`: String starts with the filter value

### Custom Operators

There are two ways to use custom criteria: inline functions and registered criteria.

#### 1. Inline Custom Functions

You can define custom filter functions directly in your criteria:

```typescript
const customFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'CUSTOM',
					value: async item => {
						// Your custom logic here
						return item.someProperty > 10;
					}
				}
			]
		}
	]
};
```

#### 2. Registered Custom Criteria

You can register reusable custom criteria that can be referenced by name:

```typescript
// Register a custom criteria
FilterCriteria.registerCustomCriteria('isHighValueUser', async item => {
	return item.purchases > 1000 && item.membershipLevel === 'premium';
});

// Use the registered criteria by name
const registeredFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'CUSTOM',
					value: 'isHighValueUser' // Reference the registered criteria by name
				}
			]
		}
	]
};

// Remove a custom criteria when no longer needed
FilterCriteria.unregisterCustomCriteria('isHighValueUser');
```

Custom criteria can be:

- Synchronous or asynchronous (returning `boolean | Promise<boolean>`)
- Used for complex filtering logic that can't be expressed with standard operators
- Registered once and reused across multiple filters
- Managed with `registerCustomCriteria` and `unregisterCustomCriteria` methods

## Advanced Usage

### Working with Sets and Maps

```typescript
const data = [
	{
		id: 1,
		skills: new Set(['typescript', 'react']),
		metadata: new Map([
			['level', 'senior'],
			['department', 'engineering']
		])
	}
];

// Filter by Set contents
const setFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'SET',
					operator: 'INCLUDES_ALL',
					path: ['skills'],
					value: ['typescript', 'react'],
					normalize: true // Optional: normalize string values
				}
			]
		}
	]
};

// Filter by Map contents
const mapFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'MAP',
					operator: 'HAS_KEY',
					path: ['metadata'],
					value: 'level'
				}
			]
		}
	]
};
```

### Dynamic Values Using $path

```typescript
const data = [
	{
		id: 1,
		requiredSkills: new Set(['typescript', 'react']),
		actualSkills: new Set(['typescript', 'react', 'node'])
	}
];

const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'SET',
					operator: 'INCLUDES_ALL',
					path: ['actualSkills'],
					value: { $path: ['requiredSkills'] } // Compare actualSkills with requiredSkills
				}
			]
		}
	]
};
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
