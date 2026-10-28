// Offline network guard for the scratch-only feasibility harness.
// Installed before anything else is imported. Every outbound path the runtime
// offers is replaced with a function that records the attempt and throws, so a
// test can never pass by reaching a network and the run reports the count.

import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';

export const attempts = [];

function block(kind) {
  return function blocked() {
    attempts.push({ kind, at: new Date().toISOString() });
    throw new Error('network_blocked:' + kind);
  };
}

export function installNetGuard() {
  globalThis.fetch = block('fetch');
  net.connect = block('net.connect');
  net.createConnection = block('net.createConnection');
  net.Socket.prototype.connect = block('net.Socket.connect');
  tls.connect = block('tls.connect');
  http.request = block('http.request');
  http.get = block('http.get');
  https.request = block('https.request');
  https.get = block('https.get');
  dns.lookup = block('dns.lookup');
  dns.resolve = block('dns.resolve');
  if (dns.promises) {
    dns.promises.lookup = block('dns.promises.lookup');
    dns.promises.resolve = block('dns.promises.resolve');
  }
  return attempts;
}
