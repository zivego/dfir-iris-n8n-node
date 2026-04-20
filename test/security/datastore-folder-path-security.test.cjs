const test = require('node:test');
const assert = require('node:assert/strict');

const {
	sanitizeSinglePathSegmentValue,
} = require('../../dist/nodes/DfirIris/v1/helpers/utils.js');

test('datastore folder ID validation rejects traversal and fragment values', () => {
	assert.throws(
		() => sanitizeSinglePathSegmentValue('../user/list', 'Folder ID'),
		/Invalid Folder ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('123#', 'Folder ID'),
		/Invalid Folder ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('123/comments/add', 'Folder ID'),
		/Invalid Folder ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('%2e%2e', 'Folder ID'),
		/Invalid Folder ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('%2f55', 'Folder ID'),
		/Invalid Folder ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('..', 'Destination Folder ID'),
		/Invalid Destination Folder ID/,
	);
});

test('datastore folder ID validation accepts safe folder identifiers', () => {
	assert.equal(sanitizeSinglePathSegmentValue('123', 'Folder ID'), '123');
	assert.equal(sanitizeSinglePathSegmentValue('00123', 'Folder ID'), '00123');
	assert.equal(sanitizeSinglePathSegmentValue('abc-123', 'Folder ID'), 'abc-123');
});

test('encoded safe identifiers remain valid after sanitization', () => {
	assert.equal(sanitizeSinglePathSegmentValue('abc%20def', 'Folder ID'), 'abc%20def');
});
