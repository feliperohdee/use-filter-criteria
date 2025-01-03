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
					source: ['age'],
					value: 20
				},
				{
					type: 'ARRAY',
					operator: 'INCLUDES_ANY',
					source: ['tags'],
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

### Array Filters

- `EXACTLY_MATCHES`: Arrays contain the same elements (order independent)
- `INCLUDES_ALL`: Contains all specified values
- `INCLUDES_ANY`: Contains at least one specified value
- `IS_EMPTY`: Array has no elements
- `IS_NOT_EMPTY`: Array has elements
- `NOT_INCLUDES_ALL`: Missing at least one specified value
- `NOT_INCLUDES_ANY`: Contains none of the specified values

### Boolean Filters

- `IS`: Exact boolean match
- `IS-NOT`: Boolean inequality

### Date Filters

- `AFTER`: Date is after specified date
- `BEFORE`: Date is before specified date
- `BETWEEN`: Date falls within range

### Geographic Filters

- `IN-RADIUS`: Point falls within specified radius
- Support for km/mi units
- Haversine formula for accurate Earth distance calculations

### Number Filters

- `BETWEEN`: Number falls within range
- `EQUALS`: Exact number match
- `GREATER`: Greater than
- `GREATER-EQUALS`: Greater than or equal
- `LESS`: Less than
- `LESS-EQUALS`: Less than or equal

### Text Filters

- `CONTAINS`: String contains substring
- `ENDS-WITH`: String ends with substring
- `EQUALS`: Exact string match
- `IS-EMPTY`: String is empty
- `MATCHES-REGEX`: String matches regular expression
- `STARTS-WITH`: String starts with substring

## Advanced Usage

### Complex Logical Combinations

```typescript
const complexFilter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'BOOLEAN',
					operator: 'IS',
					source: ['active'],
					value: true
				}
			]
		},
		{
			operator: 'OR',
			criteria: [
				{
					type: 'TEXT',
					operator: 'CONTAINS',
					source: ['name'],
					value: 'John'
				},
				{
					type: 'NUMBER',
					operator: 'LESS',
					source: ['age'],
					value: 30
				}
			]
		}
	]
};
```

### Text Normalization

```typescript
const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'TEXT',
					operator: 'CONTAINS',
					source: ['name'],
					value: 'José', // Will match 'jose', 'José', 'JOSE', etc.
					normalize: true // Default is true
				}
			]
		}
	]
};
```

### Geographic Radius Search

```typescript
const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'GEO',
					operator: 'IN-RADIUS',
					source: ['location'],
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
```

### Default Values

```typescript
const filter = {
	operator: 'AND',
	rules: [
		{
			operator: 'AND',
			criteria: [
				{
					type: 'NUMBER',
					operator: 'GREATER',
					source: ['views'],
					value: 100,
					defaultValue: 0 // Used when 'views' field is missing
				}
			]
		}
	]
};
```

## TypeScript Support

The package provides comprehensive type definitions:

```typescript
import { FilterCriteria } from 'use-filter-criteria';

type Filter = FilterCriteria.Filter;
type FilterInput = FilterCriteria.FilterInput;
type Rule = FilterCriteria.Rule;
type Criteria = FilterCriteria.Criteria;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## Author

**Felipe Rohde**

- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
