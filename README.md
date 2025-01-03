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

[Previous filter types section remains the same...]

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
					source: ['tags'],
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

[Rest of the previous sections remain the same...]

## TypeScript Support

[Previous TypeScript section remains the same...]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## Author

**Felipe Rohde**

- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
