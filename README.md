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
- 🎛️ **Flexible**: Customizable default values and source path resolution
- 🔄 **Dynamic Values**: Support for dynamic value resolution using `$path` and custom functions
- 📊 **Detailed Logging**: Optional detailed diagnostics for understanding filter results
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
			criteria: [
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
			criteria: [
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

// Basic usage
const matchingUsers = await FilterCriteria.matchMany(users, complexFilterGroup);
console.log(matchingUsers);

// With detailed logging
const detailedResult = await FilterCriteria.match(users[0], complexFilterGroup, true);
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

const result = await FilterCriteria.match(data, ageCriteria);
```

### 2. Filter Input

For grouping multiple criteria with a logical operator:

```typescript
const userFilterCriteria = FilterCriteria.filter({
	operator: 'AND',
	criteria: [
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

const result = await FilterCriteria.match(data, userFilterCriteria);
```

### 3. Filter Group Input

For complex filtering with multiple filters and nested logic:

```typescript
const complexFilterCriteria = FilterCriteria.filterGroup({
	operator: 'OR',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criteria: [
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
			criteria: [
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

const result = await FilterCriteria.match(data, complexFilterCriteria);
```

Each input format supports all the filter types and operators described in the "Supported Filter Types" section. The choice between them depends on your filtering complexity needs:

- Use **Criteria Input** for simple, single-condition checks
- Use **Filter Input** when you need to combine multiple criteria with AND/OR logic
- Use **Filter Group Input** for complex scenarios requiring multiple filters and nested logic combinations

## Detailed Logging

The `match` and `matchMany` functions support detailed logging that provides comprehensive information about why filters passed or failed. Enable detailed logging by passing `true` as the third parameter to `match`:

```typescript
const result = await FilterCriteria.match(data, filter, true);
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
			criteria: [
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

const stringResult = await FilterCriteria.match(users[0], stringFilterCriteria, true);
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
			criteria: [
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

const geoResult = await FilterCriteria.match(users[0], geoFilterCriteria, true);
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
			criteria: [
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
			criteria: [
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

const nestedResult = await FilterCriteria.match(users[0], nestedFilter, true);
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
			criteria: [
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
const results = await FilterCriteria.matchMany(users, batchedCriteria, 2);
```

### 2. Inline Custom Functions

You can define custom filter functions directly in your criteria:

```typescript
const customFunctionCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criteria: [
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

### 3. Saved Custom Criteria

You can save reusable custom criteria that can be referenced by key:

```typescript
// Save a custom criteria
FilterCriteria.saveCriteria(
	'isHighValueUser',
	FilterCriteria.criteria({
		type: 'CUSTOM',
		predicate: async (item, matchValue) => {
			return item.purchases > matchValue && item.membershipLevel === 'premium';
		},
		matchValue: 1000
	})
);

// Save a string criteria with normalize option
FilterCriteria.saveCriteria(
	'containsKeyword',
	FilterCriteria.criteria({
		type: 'STRING',
		operator: 'CONTAINS',
		valuePath: ['description'],
		normalize: true,
		matchValue: 'premium'
	})
);

/* The `saveCriteria` method also accepts an optional criteriaMapper function that can modify the criteria when it's used: */

// Save criteria with a criteriaMapper function
FilterCriteria.saveCriteria(
	'dynamicDateRange',
	FilterCriteria.criteria({
		type: 'DATE',
		operator: 'BETWEEN',
		valuePath: ['timestamp'],
		matchValue: ['2024-01-01', '2024-12-31']
	}),
	criteria => {
		// criteriaMapper function can modify any aspect of the criteria
		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		return {
			...criteria,
			matchValue: [thirtyDaysAgo.toISOString(), now.toISOString()]
		};
	}
);

// Use the saved criteria by key with default values
const basicFilterCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criteria: [
				FilterCriteria.criteria({
					type: 'CRITERIA',
					key: 'isHighValueUser'
				})
			]
		})
	]
});

// Override saved criteria properties
const customFilterCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criteria: [
				FilterCriteria.criteria({
					key: 'containsKeyword',
					matchValue: 'special-offer',
					normalize: true,
					operator: 'STARTS-WITH',
					type: 'CRITERIA',
					valueMapper: (value: User) => value.name.toLowerCase(),
					valuePath: ['title']
				})
			]
		})
	]
});

// Multiple saved criteria in a single filter
const combinedFilterCriteria = FilterCriteria.filterGroup({
	operator: 'AND',
	filters: [
		FilterCriteria.filter({
			operator: 'AND',
			criteria: [
				FilterCriteria.criteria({
					type: 'CRITERIA',
					key: 'isHighValueUser',
					matchValue: 2000
				}),
				FilterCriteria.criteria({
					type: 'CRITERIA',
					key: 'containsKeyword',
					valuePath: ['tags'],
					matchValue: 'vip'
				})
			]
		})
	]
});
```

When using saved criteria, you can:

- Use them as-is by just referencing their key
- Override any of their properties (valuePath, normalize, operator, matchValue)
- Combine multiple saved criteria in a single filter
- Mix saved criteria with regular criteria in the same filter

Note: You cannot save a criteria of type "CRITERIA" (no nested saved criteria references).

Custom criteria can be:

- Synchronous or asynchronous (returning `boolean | Promise<boolean>`)
- Used for complex filtering logic that can't be expressed with standard operators
- Saved once and reused across multiple filters

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
			criteria: [
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
			criteria: [
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
			criteria: [
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
			criteria: [
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
    "isHighValueUser": {
      "type": "CUSTOM",
      "predicate": [Function],
      "matchValue": 1000
    },
    "containsKeyword": {
      "type": "STRING",
      "operator": "CONTAINS",
      "valuePath": ["description"],
      "normalize": true,
      "matchValue": "premium"
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
