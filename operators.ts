import z from 'zod';

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
const operatorsString = z.enum([
	'CONTAINS',
	'ENDS-WITH',
	'EQUALS',
	'IN',
	'IS-EMPTY',
	'MATCHES-REGEX',
	'NOT-CONTAINS',
	'NOT-ENDS-WITH',
	'NOT-EQUALS',
	'NOT-IN',
	'NOT-STARTS-WITH',
	'NOT-MATCHES-REGEX',
	'STARTS-WITH'
]);
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

export {
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
};
