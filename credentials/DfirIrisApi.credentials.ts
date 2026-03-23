import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { getNextDocsUrl, getStableDocsUrl } from '../nodes/DfirIris/v1/compatibility';

export class DfirIrisApi implements ICredentialType {
	name = 'zivegoDfirIrisApi';
	displayName = 'DFIR IRIS API (Zivego)';
	documentationUrl = 'https://docs.dfir-iris.org/latest/_static/iris_api_reference_v2.0.4.html';
	icon = { light: "file:icons/iris.svg", dark: "file:icons/iris.svg"} as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Mode',
			name: 'apiMode',
			type: 'options',
			default: 'stable',
			description:
				`Stable uses ${getStableDocsUrl()} and Next uses ${getNextDocsUrl()}.`,
			options: [
				{
					name: 'Stable / Legacy (API v2.0.4)',
					value: 'stable',
				},
				{
					name: 'Next / Dev (API v2.1.x)',
					value: 'next',
				},
			],
		},
		{
			displayName: 'Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'get it from the Web console',
		},
		{
			displayName: 'Use HTTP',
			name: 'isHttp',
			type: 'boolean',
			default: false,
			description: 'Whether to use HTTP instead of HTTPS',
		},
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			placeholder: 'iris.contoso.com',
			default: '',
			description: 'The FQDN, not the URL',
		},
		// eslint-disable-next-line @n8n/community-nodes/credential-password-field
		{
			displayName: 'Ignore SSL Issues',
			name: 'allowUnauthorizedCerts',
			type: 'boolean',
			description: 'Whether to connect even if SSL certificate validation is not possible',
			default: false,
			displayOptions: {
				show: {
					isHttp: [false],
				},
			},
		},
		{
			displayName: 'Enable Debug',
			name: 'enableDebug',
			type: 'boolean',
			description: 'Whether to write debug logs in the console',
			default: false,
		},
	];

	// This allows the credential to be used by other parts of n8n
	// stating how this credential is injected as part of the request
	// An example is the Http Request node that can make generic calls
	// reusing this credential
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.accessToken}}',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.isHttp ? "http://" : "https://" }}{{$credentials?.host}}',
			url: '/api/ping',
			skipSslCertificateValidation:
				'={{$credentials?.isHttp ? true : $credentials?.allowUnauthorizedCerts}}',
		},
	};
}
