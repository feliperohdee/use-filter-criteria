import _ from 'lodash';

const isStringArray = (value: any): value is string[] => {
	return _.isArray(value) && _.every(value, _.isString);
};

const isNumberArray = (value: any): value is number[] => {
	return _.isArray(value) && _.every(value, _.isNumber);
};

const objectContainKeys = (value: any, keys: string[]): value is Record<string, any> => {
	return (
		_.isPlainObject(value) &&
		_.every(keys, key => {
			return key in value;
		})
	);
};

const stringify = (value: any) => {
	if (_.isUndefined(value)) {
		return 'undefined';
	}

	if (_.isNumber(value) || _.isRegExp(value)) {
		return _.toString(value);
	}

	return _.isString(value) ? value : JSON.stringify(value);
};

export { isStringArray, isNumberArray, objectContainKeys, stringify };
