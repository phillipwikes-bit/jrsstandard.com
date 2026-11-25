#!/usr/bin/env python3
"""Builds lib/ds-n1/data/wordnet-senses.json from the Princeton WordNet 3.1 index
files (npm package wordnet-db 3.1.14, MIT wrapper; WordNet licence in
WORDNET_LICENSE.txt). For every single-word lemma it keeps the synsets of its
four most frequent senses only, so
two words match only when their usual meanings coincide.
Usage: python3 build-wordnet-table.py <wordnet dict dir> <out json>"""
import json, sys, os
src, out = sys.argv[1], sys.argv[2]
KEEP = {'noun': 4, 'verb': 4, 'adj': 4, 'adv': 4}
ids, table = {}, {}
for pos, k in KEEP.items():
    for line in open(os.path.join(src, 'index.' + pos), encoding='utf-8'):
        if line.startswith(' '): continue
        f = line.split()
        lemma = f[0]
        if '_' in lemma or '-' in lemma or not lemma.isalpha(): continue
        p_cnt = int(f[3]); synset_cnt = int(f[2])
        offs = f[6 + p_cnt:]
        offs = offs[:synset_cnt][:k]
        for o in offs:
            key = pos[0] + o
            sid = ids.setdefault(key, len(ids))
            table.setdefault(lemma, [])
            if sid not in table[lemma]: table[lemma].append(sid)
json.dump({'source': 'Princeton WordNet 3.1 via npm wordnet-db 3.1.14', 'keep_senses': KEEP, 'lemmas': table}, open(out, 'w'), separators=(',', ':'), sort_keys=True)
print(len(table), 'lemmas', len(ids), 'synsets', os.path.getsize(out) // 1024, 'KB')
