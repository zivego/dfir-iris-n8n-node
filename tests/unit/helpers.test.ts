import { describe, expect, it, vi } from 'vitest';

import { getTLPName } from '../../nodes/DfirIris/v1/helpers/types';
import {
	addAdditionalFields,
	enableDebug,
	fieldsRemover,
	getFlattenGroups,
	getFlattenTree,
	getFolderNested,
	getNoteGroupsNested,
	IrisLog,
} from '../../nodes/DfirIris/v1/helpers/utils';
import { createMockExecuteContext } from '../support/mockN8n';

describe('helper utilities', () => {
	it('maps TLP values back to their names', () => {
		expect(getTLPName(1)).toBe('Red');
		expect(getTLPName(5)).toBe('AmberStrict');
		expect(getTLPName(99 as never)).toBeUndefined();
	});

	it('filters fields in normal and inverse mode', () => {
		const source = [
			{ id: 1, keep: 'yes', remove: 'no' },
			{ id: 2, keep: 'still', remove: 'gone' },
		];

		expect(fieldsRemover(structuredClone(source), { fields: 'id,keep', inverseFields: false })).toEqual([
			{ id: 1, keep: 'yes' },
			{ id: 2, keep: 'still' },
		]);

		expect(fieldsRemover(structuredClone(source), { fields: 'remove', inverseFields: true })).toEqual([
			{ id: 1, keep: 'yes' },
			{ id: 2, keep: 'still' },
		]);
	});

	it('adds additional fields and parses custom attributes JSON', () => {
		const { context } = createMockExecuteContext({
			additionalFields: {
				__uiOnly: 'ignore-me',
				custom_attributes: '{"team":"qa"}',
				tag: 'blue',
			},
		});
		const body = {};

		addAdditionalFields.call(context as never, body, 0);

		expect(body).toEqual({
			custom_attributes: { team: 'qa' },
			tag: 'blue',
		});
	});

	it('throws on invalid custom attributes JSON', () => {
		const { context } = createMockExecuteContext({
			additionalFields: {
				custom_attributes: '{invalid json}',
			},
		});

		expect(() => addAdditionalFields.call(context as never, {}, 0)).toThrow(/valid JSON/i);
	});

	it('flattens folder and note trees for load options', () => {
		const logger = { info: vi.fn() };

		expect(
			getFolderNested([], {
				'd-1': {
					children: {
						'd-2': {
							children: {},
							name: 'Child',
							type: 'directory',
						},
					},
					name: 'Root',
					type: 'directory',
				},
			}),
		).toEqual([
			{ name: 'Root', value: '1' },
			{ name: 'Root - Child', value: '2' },
		]);

		const noteGroups = [
			{
				id: 1,
				name: 'Root',
				note_count: 1,
				notes: [{ id: 10, title: 'Root Note' }],
				subdirectories: [
					{
						id: 2,
						name: 'Child',
						note_count: 1,
						notes: [{ id: 11, title: 'Child Note' }],
						subdirectories: [],
					},
				],
			},
		];

		expect(getNoteGroupsNested(logger as never, noteGroups as never)).toEqual([
			{ name: 'Root', value: 1 },
			{ name: '-- Child', value: 2 },
		]);

		expect(getFlattenGroups(logger as never, noteGroups as never)).toEqual({
			1: { name: 'Root', notes: [{ id: 10, title: 'Root Note' }] },
			2: { name: 'Root/Child', notes: [{ id: 11, title: 'Child Note' }] },
		});
	});

	it('flattens datastore trees and keeps parent metadata', () => {
		expect(
			getFlattenTree({
				'd-1': {
					children: {
						'f-1': {
							added_by_user_id: 1,
							file_case_id: 1,
							file_date_added: '2026-03-21T10:00:00.000Z',
							file_description: 'QA file',
							file_id: 1,
							file_is_evidence: 'n',
							file_is_ioc: 'n',
							file_original_name: 'qa.txt',
							file_parent_id: 1,
							file_password: '',
							file_sha256: 'deadbeef',
							file_size: 42,
							file_tags: 'qa',
							file_uuid: 'uuid-file',
							modification_history: {},
							type: 'file',
						},
					},
					is_root: true,
					name: 'Root',
					type: 'directory',
				},
			}),
		).toEqual([
			expect.objectContaining({
				_key: 'f-1',
				_parentId: 'd-1',
				file_original_name: 'qa.txt',
				type: 'file',
			}),
			expect.objectContaining({
				_key: 'd-1',
				is_root: true,
				name: 'Root',
				type: 'directory',
			}),
		]);
	});

	it('writes logs only when debug is enabled', () => {
		const logger = { info: vi.fn() };
		const irisLog = new IrisLog(logger as never);

		enableDebug(false);
		irisLog.info('disabled');
		expect(logger.info).not.toHaveBeenCalled();

		enableDebug(true);
		irisLog.info('enabled', { source: 'test' });
		expect(logger.info).toHaveBeenCalledWith('enabled', { source: 'test' });

		enableDebug(false);
	});
});
