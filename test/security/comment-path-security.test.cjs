const test = require('node:test');
const assert = require('node:assert/strict');

const {
	sanitizeSinglePathSegmentValue,
} = require('../../dist/nodes/DfirIris/v1/helpers/utils.js');
const {
	sanitizeRelativeEndpoint,
} = require('../../dist/nodes/DfirIris/v1/transport/index.js');

test('comment path segment validation rejects traversal and fragment values', () => {
	assert.throws(
		() => sanitizeSinglePathSegmentValue('../ioc/999', 'Object ID'),
		/Invalid Object ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('123#', 'Object ID'),
		/Invalid Object ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('123/comments/add', 'Object ID'),
		/Invalid Object ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('..', 'Comment ID'),
		/Invalid Comment ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('%2e%2e', 'Comment ID'),
		/Invalid Comment ID/,
	);
	assert.throws(
		() => sanitizeSinglePathSegmentValue('%2f55', 'Comment ID'),
		/Invalid Comment ID/,
	);
});

test('comment path segment validation accepts safe string identifiers', () => {
	assert.equal(sanitizeSinglePathSegmentValue('123', 'Object ID'), '123');
	assert.equal(sanitizeSinglePathSegmentValue('00123', 'Object ID'), '00123');
	assert.equal(sanitizeSinglePathSegmentValue('abc-123', 'Object ID'), 'abc-123');
});

test('transport rejects rewritten or truncated endpoints', () => {
	assert.throws(
		() => sanitizeRelativeEndpoint('case/tasks/../ioc/999/comments/add'),
		/Invalid API path/,
	);
	assert.throws(
		() => sanitizeRelativeEndpoint('case/tasks/123#/comments/add'),
		/Invalid API path/,
	);
	assert.throws(
		() => sanitizeRelativeEndpoint('case/tasks/123?x=1'),
		/Invalid API path/,
	);
});

test('transport keeps legitimate comment endpoints intact', () => {
	assert.equal(
		sanitizeRelativeEndpoint('case/tasks/123/comments/add'),
		'case/tasks/123/comments/add',
	);
	assert.equal(
		sanitizeRelativeEndpoint('case/tasks/123/comments/55/edit'),
		'case/tasks/123/comments/55/edit',
	);
	assert.equal(
		sanitizeRelativeEndpoint('case/tasks/123/comments/55/delete'),
		'case/tasks/123/comments/55/delete',
	);
});
