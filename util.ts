import _ from 'lodash';

const isStringArray = (value: any) => {
	return _.isArray(value) && _.every(value, _.isString);
};

const isNumberArray = (value: any) => {
	return _.isArray(value) && _.every(value, _.isNumber);
};

const objectContainKeys = (obj: any, keys: string[]) => {
	return (
		_.isPlainObject(obj) &&
		_.every(keys, key => {
			return key in obj;
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
