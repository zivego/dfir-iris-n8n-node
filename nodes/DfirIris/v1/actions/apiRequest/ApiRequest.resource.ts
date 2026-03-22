import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INode,
	INodeProperties,
	IBinaryKeyData,
} from 'n8n-workflow';

import { NodeOperationError, updateDisplayOptions } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import { apiRequest } from '../../transport';
import { types } from '../../helpers';

function parseJsonParameter(
	value: unknown,
	label: string,
	node: INode,
	itemIndex: number,
	defaultValue: unknown,
) {
	if (value === undefined || value === null || value === '') {
		return defaultValue;
	}

	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch {
			throw new NodeOperationError(node, `${label} must be valid JSON`, { itemIndex });
		}
	}

	return value;
}

function parseJsonObjectParameter(
	value: unknown,
	label: string,
	node: INode,
	itemIndex: number,
): IDataObject {
	const parsed = parseJsonParameter(value, label, node, itemIndex, {});

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new NodeOperationError(node, `${label} must be a JSON object`, { itemIndex });
	}

	return parsed as IDataObject;
}

function normalizePath(path: string): string {
	return path.replace(/^\/+/, '');
}

function getResponseFileName(headers: IDataObject, path: string): string {
	const contentDisposition = headers['content-disposition'];

	if (typeof contentDisposition === 'string') {
		const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
		if (fileNameMatch?.[1]) {
			return decodeURIComponent(fileNameMatch[1].replace(/"$/, ''));
		}
	}

	const fallback = path.split('/').filter(Boolean).at(-1);
	return fallback || 'dfir-iris-response.bin';
}

const properties: INodeProperties[] = [
	buildOperationProperty('apiRequest', 'send'),
	{
		displayName: 'Method',
		name: 'requestMethod',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		options: [
			{ name: 'DELETE', value: 'DELETE' },
			{ name: 'GET', value: 'GET' },
			{ name: 'PATCH', value: 'PATCH' },
			{ name: 'POST', value: 'POST' },
			{ name: 'PUT', value: 'PUT' },
		],
		default: 'GET',
	},
	{
		displayName: 'Path',
		name: 'requestPath',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		default: 'api/ping',
		placeholder: 'case/export',
		description:
			'API path without the host. Stable examples: `case/export`, `manage/users/list`. Next examples: `api/v2/cases`, `api/v2/cases/1/assets`',
	},
	{
		displayName: 'Query',
		name: 'requestQuery',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		default: '{}',
		description: 'JSON object of query string parameters',
	},
	{
		displayName: 'Headers',
		name: 'requestHeaders',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		default: '{}',
		description: 'JSON object of extra headers. Authorization is added from the credential automatically.',
	},
	{
		displayName: 'Body',
		name: 'requestBody',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
			hide: {
				sendBinary: [true],
			},
		},
		default: '{}',
		description: 'JSON payload to send as the request body',
	},
	{
		displayName: 'Send Binary',
		name: 'sendBinary',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		default: false,
		description: 'Whether to send a binary property as multipart/form-data',
	},
	{
		displayName: 'Binary Property Name',
		name: 'binaryPropertyName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
				sendBinary: [true],
			},
		},
		default: 'data',
		description: 'Binary property from the input item to upload',
	},
	{
		displayName: 'Binary Form Field Name',
		name: 'binaryFieldName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
				sendBinary: [true],
			},
		},
		default: 'file_content',
		description: 'Multipart field name for the uploaded file',
	},
	{
		displayName: 'Multipart Fields',
		name: 'multipartFields',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
				sendBinary: [true],
			},
		},
		default: '{}',
		description: 'JSON object of additional multipart fields to include alongside the uploaded file',
	},
	{
		displayName: 'Download Response',
		name: 'downloadResponse',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		default: false,
		description: 'Whether to return the response body as a binary file',
	},
	{
		displayName: 'Output Binary Field',
		name: 'outputBinaryField',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
				downloadResponse: [true],
			},
		},
		default: 'data',
		description: 'Binary field name to write the downloaded response into',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		placeholder: 'Add Option',
		default: {},
		options: [...types.returnRaw],
	},
];

export const resource: INodeProperties[] = [
	buildOperationProperty('apiRequest', 'send'),
	...updateDisplayOptions(
		{
			show: {
				resource: ['apiRequest'],
				operation: ['send'],
			},
		},
		properties.slice(1),
	),
];

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const requestMethod = this.getNodeParameter('requestMethod', i) as
		| 'DELETE'
		| 'GET'
		| 'PATCH'
		| 'POST'
		| 'PUT';
	const requestPath = normalizePath(this.getNodeParameter('requestPath', i) as string);
	const sendBinary = this.getNodeParameter('sendBinary', i, false) as boolean;
	const downloadResponse = this.getNodeParameter('downloadResponse', i, false) as boolean;
	const headers = parseJsonObjectParameter(
		this.getNodeParameter('requestHeaders', i, '{}'),
		'Headers',
		this.getNode(),
		i,
	);
	const query = parseJsonObjectParameter(
		this.getNodeParameter('requestQuery', i, '{}'),
		'Query',
		this.getNode(),
		i,
	);

	let body:
		| IDataObject
		| IDataObject[]
		| FormData
		| string
		| number
		| boolean
		| Buffer
		| ArrayBuffer
		| Uint8Array
		| Blob
		| undefined = parseJsonParameter(
		this.getNodeParameter('requestBody', i, '{}'),
		'Body',
		this.getNode(),
		i,
		{},
	);
	let isFormData = false;

	const requestOptions: IDataObject = {
		headers: {
			'content-type': 'application/json',
			...headers,
		},
	};

	if (sendBinary) {
		const binaryPropertyName = (this.getNodeParameter('binaryPropertyName', i, 'data') as string).trim();
		const binaryFieldName = (this.getNodeParameter('binaryFieldName', i, 'file_content') as string).trim();
		const multipartFields = parseJsonObjectParameter(
			this.getNodeParameter('multipartFields', i, '{}'),
			'Multipart Fields',
			this.getNode(),
			i,
		);
		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		const fileName = binaryData.fileName as string;

		if (!fileName) {
			throw new NodeOperationError(this.getNode(), 'No file name given for binary upload.', {
				itemIndex: i,
			});
		}

		const form = new FormData();
		form.append(
			binaryFieldName,
			new Blob([binaryDataBuffer], { type: binaryData.mimeType }),
			fileName,
		);

		if (!Object.prototype.hasOwnProperty.call(multipartFields, 'file_original_name')) {
			form.append('file_original_name', fileName);
		}

		for (const [key, value] of Object.entries(multipartFields)) {
			if (value === undefined || value === null) {
				continue;
			}

			form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
		}

		body = form;
		isFormData = true;
	}

	if (downloadResponse) {
		requestOptions.returnFullResponse = true;
		requestOptions.encoding = 'arraybuffer';
		requestOptions.json = false;
	}

	const response = await apiRequest.call(
		this,
		requestMethod,
		requestPath,
		body,
		query,
		requestOptions,
		isFormData,
	);

	if (downloadResponse) {
		const binaryFieldName = (this.getNodeParameter('outputBinaryField', i, 'data') as string).trim();
		const responseObject = response as unknown as IDataObject;
		const headersObject = (responseObject.headers || {}) as IDataObject;
		const mimeType = (headersObject['content-type'] as string) || 'application/octet-stream';
		const fileName = getResponseFileName(headersObject, requestPath);

		let item = this.getInputData()[i];
		const newItem: INodeExecutionData = {
			json: {
				statusCode: responseObject.statusCode,
				headers: headersObject,
				path: requestPath,
				method: requestMethod,
			},
			binary: {},
		};

		if (item.binary !== undefined) {
			Object.assign(newItem.binary as IBinaryKeyData, item.binary);
		}

		item = newItem;
		item.binary![binaryFieldName] = await this.helpers.prepareBinaryData(
			Buffer.from(responseObject.body as ArrayBuffer),
			fileName,
			mimeType,
		);

		return [item];
	}

	const options = this.getNodeParameter('options', i, {}) as IDataObject;
	const isRaw = (options.isRaw as boolean) || false;
	const output =
		!isRaw &&
		response &&
		typeof response === 'object' &&
		'data' in response &&
		response.data !== undefined
			? response.data
			: response;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(output as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}

export const send = {
	execute,
};
