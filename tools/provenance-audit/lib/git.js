// Provenance audit: local git reader. INTERNAL, LOCAL ONLY.
//
// Runs git for a fixed set of read-only, local subcommands. Every call disables all transport
// protocols (protocol.allow=never) and terminal prompts, so no call can reach a remote even by
// accident. fetch, pull, clone, push, remote, ls-remote, submodule and every other subcommand
// are refused before git is started.
import { execFileSync } from 'node:child_process';

export const ALLOWED = Object.freeze(['rev-parse', 'ls-tree', 'cat-file', 'log', 'check-ignore', 'show']);
const BASE = ['-c', 'protocol.allow=never', '-c', 'core.quotePath=false', '--no-pager'];

export function git(root, args, input) {
  if (!Array.isArray(args) || !ALLOWED.includes(args[0])) throw new Error('refused git subcommand: ' + (args && args[0]));
  if (args.some((a) => /^--(upload-pack|exec|receive-pack)/.test(a))) throw new Error('refused git option');
  return execFileSync('git', BASE.concat(args), {
    cwd: root, input, maxBuffer: 1 << 30,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: '', LC_ALL: 'C' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
export const gitText = (root, args, input) => git(root, args, input).toString('utf8');
