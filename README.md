# use-filter-criteria

A TypeScript-based filtering engine that provides a flexible, type-safe way to filter complex data structures using declarative criteria. Perfect for building advanced search interfaces, data filtering systems, or query builders.

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://github.com/colinhacks/zod)
[![Lodash](https://img.shields.io/badge/-Lodash-3492FF?style=flat-square&logo=lodash&logoColor=white)](https://lodash.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🎯 **Type-Safe**: Built with TypeScript and Zod for runtime type validation
- 🔄 **Multiple Data Types**: Support for arrays, booleans, dates, geographic coordinates, maps, numbers, objects, sets, and strings
- 🎨 **Rich Operators**: Comprehensive set of comparison and logical operators
- 🌐 **Internationalization-Ready**: Built-in string normalization (accents, case, etc.)
- 🔍 **Complex Queries**: Support for nested AND/OR logic combinations
- 🌳 **Deep Path Resolution**: Supports searching through arrays and nested structures with automatic path resolution (e.g. `['users', 'addresses', 'location']` will search through all user addresses)
- 📍 **Geospatial**: Built-in support for geographic radius searches, with flexible coordinate formats (object or tuple notation) and array traversal support for finding coordinates in nested data structures
- 🛠️ **Criteria Mapping**: Dynamic criteria modification during evaluation through the criteriaMapper function
- ⚡ **Aliases**: Save and reuse criteria configurations with the ability to override properties when referenced
- 🎛️ **Flexible**: Customizable default values and source path resolution
- 🔄 **Dynamic Values**: Support for dynamic value resolution using `$path` and custom functions
- 📊 **Detailed Logging**: Detailed diagnostics for understanding filter results
- 🎯 **Array Matching Control**: Fine-grained control over array matching behavior with `matchInArray` option

## Installation

```bash
npm install use-filter-criteria
# or
yarn add use-filter-criteria
```

## Quick Start

```typescript
import FilterCriteria from 'use-filter-criteria';

const filter = new FilterCriteria();

// Example data
const users = [
	{
		id: 1,
		name: 'John Doe',
		age: 30,
		addresses: [
			{ type: 'home', location: { lat: 40.7128, lng: -74.006 } },
			{ type: 'work', location: { lat: 40.758, lng: -73.9855 } }
		],
		skills: new Set(['typescript', 'react']),
		roles: ['admin', 'developer'],
		active: true,
		lastLogin: '2024-01-01T00:00:00Z',
		location: { lat: 40.7128, lng: -74.006 }, // location can also be specified as tuple: [40.7128, -74.006],
		metadata: new Map([['level', 'senior']])
	}
	// ... more users
];

// Simple number comparison
const ageCriteria = FilterCriteria.criteria({
	type: 'NUMBER',
	operator: 'GREATER',
	valuePath: ['age'],
	matchValue: 25
});

// Example using path inside array
const locationCriteria = FilterCriteria.criteria({
	type: 'GEO',
	operator: 'IN-RADIUS',
	valuePath: ['addresses', 'location'], // Will check all locations in the addresses array
	matchValue: {
		lat: 40.7128,
		lng: -74.006,
		radius: 5,
		unit: 'km'
	}
});

// Example using matchInArray: true (default)
const rolesStartsWithCriteria = FilterCriteria.criteria({
	type: 'STRING',
	matchInArray: true,
	operator: 'STARTS-WITH',
	valuePath: ['roles'],
	matchValue: 'adm'
});

// Example using matchInArray: false
const rolesEqualsCriteria = FilterCriteria.criteria({
	type: 'STRING',
	matchInArray: false,
	operator: 'EQUALS',
	valuePath: ['roles'],
	matchValue: 'adm'
});

// Complex multi-criteria filter
const complexFilterGroup = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'SET',
					operator: 'INCLUDES-ANY',
					valuePath: ['skills'],
					matchValue: ['typescript', 'python']
				}),
				FilterCriteria.criteria({
					type: 'BOOLEAN',
					operator: 'EQUALS',
					valuePath: ['active'],
					matchValue: true
				})
			]
		}),
		FilterCriteria.filter({
			operator: 'OR',
			criterias: [
				FilterCriteria.criteria({
					type: 'STRING',
					operator: 'CONTAINS',
					valuePath: ['name'],
					matchValue: 'john'
				}),
				FilterCriteria.criteria({
					type: 'ARRAY',
					operator: 'INCLUDES-ANY',
					valuePath: ['roles'],
					matchValue: ['admin']
				})
			]
		})
	]
});

// Match many
const matchingUsers = await filter.matchMany(users, complexFilterGroup);
console.log(matchingUsers);

// Match many multiple
const results = await filter.matchManyMultiple(users, {
	developers: FilterCriteria.criteria({
		type: 'SET',
		operator: 'HAS',
		valuePath: ['tagsSet'],
		matchValue: 'developer'
	}),
	activeUsers: FilterCriteria.criteria({
		type: 'BOOLEAN',
		operator: 'EQUALS',
		valuePath: ['active'],
		matchValue: true
	})
});

// With detailed logging
const detailedResult = await filter.match(users[0], complexFilterGroup);
console.log(detailedResult);
```

## Input Formats

The library supports three levels of filter complexity to match your needs:

### 1. Simple Criteria Input

For basic, single-condition filtering:

```typescript
const ageCriteria = FilterCriteria.criteria({
	type: 'NUMBER',
	operator: 'GREATER',
	valuePath: ['age'],
	matchValue: 25
});

const result = await filter.match(data, ageCriteria);
```

### 2. Filter Input

For grouping multiple criteria with a logical operator:

```typescript
const userFilterCriteria = FilterCriteria.filter({
	operator: 'AND',
	criterias: [
		FilterCriteria.criteria({
			type: 'NUMBER',
			operator: 'GREATER',
			valuePath: ['age'],
			matchValue: 25
		}),
		FilterCriteria.criteria({
			type: 'STRING',
			operator: 'CONTAINS',
			valuePath: ['name'],
			matchValue: 'john'
		})
	]
});

const result = await filter.match(data, userFilterCriteria);
```

### 3. Filter Group Input

For complex filtering with multiple filters and nested logic:

```typescript
const complexFilterCriteria = FilterCriteria.filterGroup({
	operator: 'OR',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'NUMBER',
					operator: 'GREATER',
					valuePath: ['age'],
					matchValue: 25
				}),
				FilterCriteria.criteria({
					type: 'SET',
					operator: 'INCLUDES-ALL',
					valuePath: ['skills'],
					matchValue: ['typescript']
				})
			]
		}),
		FilterCriteria.filter({
			operator: 'OR',
			criterias: [
				FilterCriteria.criteria({
					type: 'STRING',
					operator: 'MATCHES-REGEX',
					valuePath: ['name'],
					matchValue: /^john/i
				})
			]
		})
	]
});

const result = await filter.match(data, complexFilterCriteria);
```

Each input format supports all the filter types and operators described in the "Supported Filter Types" section. The choice between them depends on your filtering complexity needs:

- Use **Criteria Input** for simple, single-condition checks
- Use **Filter Input** when you need to combine multiple criteria with AND/OR logic
- Use **Filter Group Input** for complex scenarios requiring multiple filters and nested logic combinations

## Detailed Logging

The `match` function returns detailed logging that provides comprehensive information about why filters passed or failed:

```typescript
const result = await filter.match(data, filter);
```

The detailed output includes:

- Filter group level information showing overall filter results
- Filter level results showing how each filter was evaluated
- Criteria level details showing:
  - The actual value found at the specified path
  - The match value being compared against
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
const stringFilterCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'STRING',
					operator: 'CONTAINS',
					valuePath: ['name'],
					matchValue: 'john'
				})
			]
		})
	]
});

const stringResult = await filter.match(users[0], stringFilterCriteria);
/* Output:
{
  operator: 'AND',
  passed: true,
  reason: 'Filter group "AND" check PASSED',
  results: [{
    operator: 'AND',
    passed: true,
    reason: 'Filter "AND" check PASSED',
    results: [{
      matchValue: 'john',
      passed: true,
      reason: 'String criteria "CONTAINS" check PASSED',
      value: 'john-doe'
    }]
  }]
}
*/

// Geographic filter with detailed logging
const geoFilterCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'GEO',
					operator: 'IN-RADIUS',
					valuePath: ['location'],
					matchValue: {
						lat: 40.7128,
						lng: -74.006,
						radius: 10,
						unit: 'km'
					}
				})
			]
		})
	]
});

const geoResult = await filter.match(users[0], geoFilterCriteria);
/* Output shows detailed radius check results:
{
  operator: 'AND',
  passed: true,
  reason: 'Filter group "AND" check PASSED',
  results: [{
    operator: 'AND',
    passed: true,
    reason: 'Filter "AND" check PASSED',
    results: [{
      matchValue: {
        lat: 40.7128,
        lng: -74.006,
        radius: 10,
        unit: 'km'
      },
      passed: true,
      reason: 'Geo criteria "IN-RADIUS" check PASSED',
      value: { lat: 40.7128, lng: -74.006 }
    }]
  }]
}
*/

// Complex nested filter with detailed logging
const nestedFilterCriteria = FilterCriteria.filterGroup({
	operator: 'OR',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'NUMBER',
					operator: 'GREATER',
					valuePath: ['age'],
					matchValue: 25
				}),
				FilterCriteria.criteria({
					type: 'SET',
					operator: 'INCLUDES-ALL',
					valuePath: ['skills'],
					matchValue: ['typescript']
				})
			]
		}),
		FilterCriteria.filter({
			operator: 'OR',
			criterias: [
				FilterCriteria.criteria({
					type: 'STRING',
					operator: 'MATCHES-REGEX',
					valuePath: ['name'],
					matchValue: /^john/i
				})
			]
		})
	]
});

const nestedResult = await filter.match(users[0], nestedFilter);
/* Output shows the complete evaluation tree:
{
  operator: 'OR',
  passed: true,
  reason: 'Filter group "OR" check PASSED',
  results: [
    {
      operator: 'AND',
      passed: true,
      reason: 'Filter "AND" check PASSED',
      results: [
        {
          matchValue: 25,
          passed: true,
          reason: 'Number criteria "GREATER" check PASSED',
          value: 30
        },
        {
          matchValue: ['typescript'],
          passed: true,
          reason: 'Set criteria "INCLUDES-ALL" check PASSED',
          value: Set(['typescript', 'react'])
        }
      ]
    },
    {
      operator: 'OR',
      passed: true,
      reason: 'Filter "OR" check PASSED',
      results: [
        {
          matchValue: /^john/i,
          passed: true,
          reason: 'String criteria "MATCHES-REGEX" check PASSED',
          value: 'John Doe'
        }
      ]
    }
  ]
}
*/
```

## Multiple Simultaneous Filters with matchManyMultiple

The `matchManyMultiple` function allows you to apply multiple different filters to the same dataset simultaneously, returning matched items for each filter in a single operation. This is particularly useful when you need to categorize data into multiple groups based on different criteria.

```typescript
const filters = {
	developers: FilterCriteria.criteria({
		type: 'SET',
		operator: 'HAS',
		valuePath: ['tagsSet'],
		matchValue: 'developer'
	}),
	activeUsers: FilterCriteria.criteria({
		type: 'BOOLEAN',
		operator: 'EQUALS',
		valuePath: ['active'],
		matchValue: true
	}),
	usPhones: FilterCriteria.criteria({
		type: 'STRING',
		operator: 'EQUALS',
		valuePath: ['phones', 'country'],
		matchValue: 'us'
	})
};

// Apply all filters simultaneously
const results = await filter.matchManyMultiple(users, filters);

// Results contains an object with the same keys as the filters
console.log(results.developers); // Users with 'developer' tag
console.log(results.activeUsers); // Active users
console.log(results.usPhones); // Users with US phone numbers
```

Key features of matchManyMultiple:

- Process multiple filters in a single pass through the data
- Return separate result sets for each filter
- Support for concurrency control via the optional concurrency parameter
- Each filter can use any supported criteria type and complexity level
- Results maintain the original filter keys for easy access

This is more efficient than running multiple separate matchMany operations when you need to apply multiple filters to the same dataset.

## Supported Filter Types

### Array Operators

- `EXACTLY-MATCHES`: Arrays contain the same elements (order independent)
- `HAS`: Array has the specified element
- `INCLUDES-ALL`: Array contains ALL filter values
- `INCLUDES-ANY`: Array contains AT LEAST ONE filter value
- `IS-EMPTY`: Array is empty
- `NOT-EMPTY`: Array is not empty
- `NOT-INCLUDES-ALL`: Array is missing AT LEAST ONE filter value
- `NOT-INCLUDES-ANY`: Array contains NONE of the filter values
- `SIZE-EQUALS`: Array size equals the filter value
- `SIZE-GREATER`: Array size is greater than the filter value
- `SIZE-GREATER-OR-EQUALS`: Array size is greater than or equal to the filter value
- `SIZE-LESS`: Array size is less than the filter value
- `SIZE-LESS-OR-EQUALS`: Array size is less than or equal to the filter value

### Boolean Operators

- `EQUALS`: Value equals the filter value
- `IS-FALSE`: Value is `false`
- `IS-FALSY`: Value is falsy
- `IS-NIL`: Value is `null` or `undefined`
- `IS-NULL`: Value is `null`
- `IS-TRUE`: Value is `true`
- `IS-TRUTHY`: Value is truthy
- `IS-UNDEFINED`: Value is `undefined`
- `NOT-EQUALS`: Value does not equal the filter value
- `NOT-NIL`: Value is not `null` or `undefined`
- `NOT-NULL`: Value is not `null`
- `NOT-UNDEFINED`: Value is not `undefined`
- `STRICT-EQUAL`: Value is strictly equal to the filter value
- `STRICT-NOT-EQUAL`: Value is not strictly equal to the filter value

### Date Operators

- `AFTER`: Date is after the filter value
- `AFTER-OR-EQUALS`: Date is after or equal to the filter value
- `BEFORE`: Date is before the filter value
- `BEFORE-OR-EQUALS`: Date is before or equal to the filter value
- `BETWEEN`: Date is between two filter values (inclusive)

### Geographic Operators

- `IN-RADIUS`: Point is within the specified radius
- `NOT-IN-RADIUS`: Point is outside the specified radius

### Map Operators

- `CONTAINS`: Map's values object contains the specified value (using deep object comparison)
- `HAS-KEY`: Map contains the specified key
- `HAS-VALUE`: Map contains the specified value
- `IS-EMPTY`: Map is empty
- `NOT-EMPTY`: Map is not empty
- `SIZE-EQUALS`: Map size equals the filter value
- `SIZE-GREATER`: Map size is greater than the filter value
- `SIZE-GREATER-OR-EQUALS`: Map size is greater than or equal to the filter value
- `SIZE-LESS`: Map size is less than the filter value
- `SIZE-LESS-OR-EQUALS`: Map size is less than or equal to the filter value

### Number Operators

- `BETWEEN`: Number is between two values (inclusive)
- `EQUALS`: Number equals the filter value
- `GREATER`: Number is greater than the filter value
- `GREATER-OR-EQUALS`: Number is greater than or equal to the filter value
- `IN`: Number is in the filter values
- `LESS`: Number is less than the filter value
- `LESS-OR-EQUALS`: Number is less than or equal to the filter value
- `NOT-EQUALS`: Number does not equal the filter value

### Object Operators

- `CONTAINS`: Object contains the specified value (using deep object comparison)
- `HAS-KEY`: Object contains the specified key
- `HAS-VALUE`: Object contains the specified value
- `IS-EMPTY`: Object is empty
- `NOT-EMPTY`: Object is not empty
- `SIZE-EQUALS`: Object size equals the filter value
- `SIZE-GREATER`: Object size is greater than the filter value
- `SIZE-GREATER-OR-EQUALS`: Object size is greater than or equal to the filter value
- `SIZE-LESS`: Object size is less than the filter value
- `SIZE-LESS-OR-EQUALS`: Object size is less than or equal to the filter value

### Set Operators

- `EXACTLY-MATCHES`: Set contains the exact same elements (order independent)
- `HAS`: Set contains the specific element
- `INCLUDES-ALL`: Set contains ALL filter values
- `INCLUDES-ANY`: Set contains AT LEAST ONE filter value
- `IS-EMPTY`: Set is empty
- `NOT-EMPTY`: Set is not empty
- `NOT-INCLUDES-ALL`: Set is missing AT LEAST ONE filter value
- `NOT-INCLUDES-ANY`: Set contains NONE of the filter values
- `SIZE-EQUALS`: Set size equals the filter value
- `SIZE-GREATER`: Set size is greater than the filter value
- `SIZE-GREATER-OR-EQUALS`: Set size is greater than or equal to the filter value
- `SIZE-LESS`: Set size is less than the filter value
- `SIZE-LESS-OR-EQUALS`: Set size is less than or equal to the filter value

### String Operators

- `CONTAINS`: String contains the filter value
- `ENDS-WITH`: String ends with the filter value
- `EQUALS`: String equals the filter value
- `IN`: String is in the filter values
- `IS-EMPTY`: String is empty
- `MATCHES-REGEX`: String matches the regular expression pattern
- `STARTS-WITH`: String starts with the filter value

### Custom Operators

There are several ways to use custom criteria with support for batching and concurrency optimization:

#### 1. Using DataLoader for Efficient Batching

You can use DataLoader to batch multiple criteria checks efficiently:

```typescript
import DataLoader from 'use-data-loader';

// Create a loader that batches user checks
const userLoader = new DataLoader(async userIds => {
	// Batch process multiple users at once
	return userIds.map(() => true); // Your batch logic here
});

// Create a filter using the loader
const batchedCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'CUSTOM',
					predicate: async user => userLoader.load(user.id)
				}),
				FilterCriteria.criteria({
					type: 'CUSTOM',
					predicate: async user => userLoader.load(user.id)
				})
			]
		})
	]
});

// Apply the filter with concurrency control
const results = await filter.matchMany(users, batchedCriteria, 2);
```

### 2. Inline Custom Functions

You can define custom filter functions directly in your criteria:

```typescript
const customFunctionCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'CUSTOM',
					predicate: async (item, matchValue) => {
						// Your custom logic here
						return item.someProperty > matchValue;
					},
					matchValue: 10
				})
			]
		})
	]
});
```

### 3. Saved Criteria

You can save reusable criteria that can be referenced later by alias. This is useful for common filtering patterns that you want to reuse across your application:

```typescript
// Save a criteria for high-value users
FilterCriteria.saveCriteria(
	FilterCriteria.criteria({
		alias: 'isHighValueUser',
		type: 'CUSTOM',
		predicate: async ({ value, matchValue }) => {
			return value.purchases > matchValue && value.membershipLevel === 'premium';
		},
		matchValue: 1000
	})
);

// Save a string criteria with normalize option
FilterCriteria.saveCriteria(
	FilterCriteria.criteria({
		alias: 'containsKeyword',
		type: 'STRING',
		operator: 'CONTAINS',
		valuePath: ['description'],
		normalize: true,
		matchValue: 'premium'
	})
);

// Reference saved criteria using an alias
const filterCriteria = FilterCriteria.alias('isHighValueUser');

// Override properties when using saved criteria
const customizedCriteria = FilterCriteria.alias('containsKeyword', {
	type: 'STRING',
	matchValue: 'special-offer', // Override the default matchValue
	normalize: true,
	operator: 'STARTS-WITH', // Override the default operator
	valueMapper: ({ value }) => value.name.toLowerCase(),
	valuePath: ['title'] // Override the default path
});

// You can combine multiple criteria in a filter
const combinedFilter = FilterCriteria.filter({
	operator: 'AND',
	criterias: [
		FilterCriteria.alias('isHighValueUser', {
			type: 'CUSTOM',
			matchValue: 2000 // Override matchValue for this instance
		}),
		FilterCriteria.alias('containsKeyword', {
			type: 'STRING',
			valuePath: ['tags'],
			matchValue: 'vip'
		})
	]
});
```

When using saved criteria, you can:

- Reference saved criteria by providing its alias
- Override any of their properties (valuePath, normalize, operator, matchValue, etc.)
- Combine multiple saved criteria in a single filter
- Mix saved criteria with regular criteria in the same filter

The saved criteria system provides a way to:

- Create reusable filtering patterns
- Maintain consistent filtering logic across your application
- Reduce code duplication
- Easily modify common filtering patterns in one place

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
const setFilter = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'SET',
					operator: 'INCLUDES-ALL',
					valuePath: ['skills'],
					matchValue: ['typescript', 'react'],
					normalize: true // Optional: normalize string values
				})
			]
		})
	]
});

// Filter by Map contents
const mapFilter = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'MAP',
					operator: 'HAS-KEY',
					valuePath: ['metadata'],
					matchValue: 'level'
				})
			]
		})
	]
});
```

### Using Criteria Mappers

The library supports criteria mapping through the `criteriaMapper` option. This allows you to dynamically modify criteria during evaluation:

```typescript
const filter = FilterCriteria.criteria({
	type: 'STRING',
	operator: 'CONTAINS',
	valuePath: ['name'],
	matchValue: 'john',
	criteriaMapper: ({ criteria, value }) => {
		// You can return a modified criteria based on the current value
		return {
			...criteria,
			normalize: value.shouldNormalize || false,
			matchValue: value.searchTerm || criteria.matchValue
		};
	}
});
```

The `criteriaMapper` function receives:

- The current criteria configuration
- The value being evaluated
- Must return a modified criteria object

This is useful for:

- Dynamically adjusting criteria based on the data being evaluated
- Implementing complex filtering logic
- Creating adaptive filters that change behavior based on context

Note: The `criteriaMapper` function can return any valid criteria type, including changing the criteria type entirely.

### Dynamic Values Using $path

```typescript
const data = [
	{
		id: 1,
		requiredSkills: new Set(['typescript', 'react']),
		actualSkills: new Set(['typescript', 'react', 'node'])
	}
];

const filter = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'SET',
					operator: 'INCLUDES-ALL',
					valuePath: ['actualSkills'],
					matchValue: { $path: ['requiredSkills'] } // Compare actualSkills with requiredSkills
				})
			]
		})
	]
});
```

### Dynamic Values Using Custom Functions

```typescript
const data = [
	{
		id: 1,
		name: 'John Doe',
		createdAt: '2024-01-01T00:00:00Z'
	}
];

const filter = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criterias: [
				FilterCriteria.criteria({
					type: 'DATE',
					operator: 'BETWEEN',
					valuePath: ['createdAt'],
					matchValue: item => {
						// Calculate the date range dynamically based on the item
						const oneMonthAgo = new Date(item.createdAt);
						oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
						return [oneMonthAgo.toISOString(), item.createdAt];
					}
				})
			]
		})
	]
});
```

## TypeScript Support

Full TypeScript support is provided out of the box. The library exports all necessary types and interfaces:

```typescript
import FilterCriteria, { FilterCriteria } from 'use-filter-criteria';

type Criteria = FilterCriteria.Criteria;
type Filter = FilterCriteria.Filter;
type FilterGroup = FilterCriteria.FilterGroup;
```

## Inspect Functionality

The `FilterCriteria.inspect()` method provides a way to introspect the current state of the filter criteria system:

1. All available operators for each data type
2. All currently saved criteria

### Usage

```typescript
// Get information about available operators and saved criteria
const info = FilterCriteria.inspect();
console.log(info);

/* Example output:
{
  "operators": {
    "array": [
      "EXACTLY-MATCHES",
      "INCLUDES-ALL",
      "INCLUDES-ANY",
      "HAS",
      "IS-EMPTY",
      "NOT-EMPTY",
      "NOT-INCLUDES-ALL",
      "NOT-INCLUDES-ANY",
      "SIZE-EQUALS",
      "SIZE-GREATER",
      "SIZE-GREATER-OR-EQUALS",
      "SIZE-LESS",
      "SIZE-LESS-OR-EQUALS"
    ],
    "boolean": [
      "EQUALS",
      "IS-FALSE",
      "IS-FALSY",
      "IS-NIL",
      "IS-NULL",
      "IS-TRUE",
      "IS-TRUTHY",
      "IS-UNDEFINED",
      "NOT-EQUALS",
      "NOT-NIL",
      "NOT-NULL",
      "NOT-UNDEFINED",
      "STRICT-EQUAL",
      "STRICT-NOT-EQUAL"
    ],
    // ... other operator types
  },
  "savedCriteria": {
    "isHighValueUser / CUSTOM": {
      "type": "CUSTOM",
      "predicate": [Function],
      "matchValue": 1000,
      "alias": "isHighValueUser"
    },
    "containsKeyword / STRING": {
      "type": "STRING",
      "operator": "CONTAINS",
      "valuePath": ["description"],
      "normalize": true,
      "matchValue": "premium",
      "alias": "containsKeyword"
    }
  }
}
*/
```

### Use Cases

The inspect functionality is particularly useful for:

1. **Debugging**: Understanding what operators are available for each data type
2. **Documentation**: Generating dynamic documentation of available operators
3. **UI Building**: Creating dynamic filter builders that show available options
4. **Validation**: Verifying that saved criteria are properly registered
5. **Development**: Exploring the current state of the filtering system

### Output Structure

The returned JSON object contains two main sections:

1. `operators`: An object where each key is a data type (array, boolean, date, etc.) and the value is an array of available operators for that type.

2. `savedCriteria`: An object containing all criteria that have been saved using `FilterCriteria.saveCriteria()`. Each key is the criteria name, and the value is the criteria configuration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## Author

**Felipe Rohde**

- Twitter: [@felipe_rohde](https://twitter.com/felipe_rohde)
- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
