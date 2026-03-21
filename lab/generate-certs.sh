#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${ROOT_DIR}/manual-stack.certs"
ROOT_CA_DIR="${CERTS_DIR}/rootCA"
WEB_CERTS_DIR="${CERTS_DIR}/web_certificates"
LDAP_DIR="${CERTS_DIR}/ldap"

mkdir -p "${ROOT_CA_DIR}" "${WEB_CERTS_DIR}" "${LDAP_DIR}"

CA_KEY="${ROOT_CA_DIR}/irisRootCAKey.pem"
CA_CERT="${ROOT_CA_DIR}/irisRootCACert.pem"
SERVER_KEY="${WEB_CERTS_DIR}/iris-key.pem"
SERVER_CSR="${WEB_CERTS_DIR}/iris.csr"
SERVER_CERT="${WEB_CERTS_DIR}/iris.pem"
OPENSSL_CNF="${WEB_CERTS_DIR}/openssl.cnf"

if [[ ! -f "${CA_KEY}" || ! -f "${CA_CERT}" ]]; then
	openssl genrsa -out "${CA_KEY}" 2048
	openssl req -x509 -new -nodes -key "${CA_KEY}" -sha256 -days 3650 \
		-subj "/C=UA/ST=Kyiv/L=Kyiv/O=Zivego/CN=iris-root-ca" \
		-out "${CA_CERT}"
fi

cat > "${OPENSSL_CNF}" <<'EOF'
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = UA
ST = Kyiv
L = Kyiv
O = Zivego
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = iris-nginx
DNS.3 = host.docker.internal
IP.1 = 127.0.0.1
EOF

openssl genrsa -out "${SERVER_KEY}" 2048
openssl req -new -key "${SERVER_KEY}" -out "${SERVER_CSR}" -config "${OPENSSL_CNF}"
openssl x509 -req -in "${SERVER_CSR}" -CA "${CA_CERT}" -CAkey "${CA_KEY}" -CAcreateserial \
	-out "${SERVER_CERT}" -days 825 -sha256 -extensions v3_req -extfile "${OPENSSL_CNF}"

rm -f "${SERVER_CSR}" "${ROOT_CA_DIR}/irisRootCACert.srl" "${OPENSSL_CNF}"
