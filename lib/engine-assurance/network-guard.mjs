// JRS ENGINE ASSURANCE: network refusal for local runs.
//
// Two controls, both required:
//   1. detectProviderConfiguration() refuses to start when a provider credential
//      or provider endpoint is present in the environment, or when a request asks
//      for any provider mode other than "mocked". The harness never reads the
//      VALUE of a variable; it reports only the NAME.
//   2. installNetworkTrap() replaces fetch, http(s).request/get, net and tls
//      connects and dns lookups with functions that throw and count. The count is
//      reported in every execution record. A nonzero count fails the run.
//
// The trap covers the Node APIs named below. It does not cover a native addon or
// a child process opening its own socket; the package uses neither. Recorded as
// FM-15.

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';

export const PROVIDER_CREDENTIAL_VARS = Object.freeze([
  'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_API_KEY', 'OPENAI_API_KEY', 'AZURE_OPENAI_API_KEY',
  'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY', 'COHERE_API_KEY', 'AWS_BEARER_TOKEN_BEDROCK',
  'REVIEW_API_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY',
]);
export const PROVIDER_ENDPOINT_VARS = Object.freeze([
  'ANTHROPIC_BASE_URL', 'OPENAI_BASE_URL', 'JRS_PROVIDER_ENDPOINT', 'JRS_ENGINE_ENDPOINT',
]);

export function detectProviderConfiguration(env, request) {
  const e = env || {};
  const found = [];
  for (const k of PROVIDER_CREDENTIAL_VARS) if (e[k] && String(e[k]).trim()) found.push({ kind: 'credential_variable', name: k });
  for (const k of PROVIDER_ENDPOINT_VARS) if (e[k] && String(e[k]).trim()) found.push({ kind: 'endpoint_variable', name: k });
  if (e.JRS_EXECUTION_MODE && e.JRS_EXECUTION_MODE !== 'local_mocked' && e.JRS_EXECUTION_MODE !== 'local_deterministic') {
    found.push({ kind: 'execution_mode_variable', name: 'JRS_EXECUTION_MODE' });
  }
  if (request && request.provider !== undefined) {
    const p = request.provider;
    if (!p || typeof p !== 'object' || p.mode !== 'mocked' || Object.keys(p).some((k) => k !== 'mode')) {
      found.push({ kind: 'request_provider_configuration', name: 'provider' });
    }
  }
  return found;
}

export function installNetworkTrap() {
  const attempts = [];
  const saved = [];
  const block = (label) => function blocked() {
    attempts.push(label);
    throw new Error('network_access_prohibited: ' + label);
  };
  const patch = (obj, key, label) => {
    if (!obj || typeof obj[key] !== 'function') return;
    saved.push([obj, key, obj[key]]);
    obj[key] = block(label);
  };
  if (typeof globalThis.fetch === 'function') {
    saved.push([globalThis, 'fetch', globalThis.fetch]);
    globalThis.fetch = async (url) => { attempts.push('fetch ' + String(url).slice(0, 80)); throw new Error('network_access_prohibited: fetch'); };
  }
  patch(http, 'request', 'http.request'); patch(http, 'get', 'http.get');
  patch(https, 'request', 'https.request'); patch(https, 'get', 'https.get');
  patch(net, 'connect', 'net.connect'); patch(net, 'createConnection', 'net.createConnection');
  patch(net.Socket.prototype, 'connect', 'net.Socket.connect');
  patch(tls, 'connect', 'tls.connect');
  patch(dns, 'lookup', 'dns.lookup'); patch(dns, 'resolve', 'dns.resolve');
  if (dns.promises) { patch(dns.promises, 'lookup', 'dns.promises.lookup'); patch(dns.promises, 'resolve', 'dns.promises.resolve'); }
  return {
    attempts,
    count: () => attempts.length,
    restore() { for (const [obj, key, fn] of saved.reverse()) obj[key] = fn; saved.length = 0; },
  };
}
