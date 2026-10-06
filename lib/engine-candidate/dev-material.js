// JRS Review Engine local candidate: holdout-separation control.
// LOCAL DEVELOPMENT ONLY. No network, no storage.
//
// Every constructed text used to develop or test this candidate is listed here
// by the SHA-256 of its whitespace-normalised form. Under the 5 October handoff,
// development, training and debugging data must never enter a sealed holdout.
// Any future holdout builder must call assertNotDevelopmentMaterial() on every
// text before sealing, and the candidate tests fail if a fixture or regression
// case exists that is not listed here.
//
// Limit (NOT ESTABLISHED as sufficient): this catches exact and whitespace-only
// copies. It does not catch a development text that has been edited, shortened
// or embedded inside a longer one.

import { createHash } from 'node:crypto';

export const DEV_MATERIAL_VERSION = 'dev-material/0.1.0';

export const DEVELOPMENT_MATERIAL = [
  ['495433d070d6d800f4d0635f827936e67fc39b042d2ef2045e9a3f82def623c0', 'fixtures/SYNTHETIC-SAE-01.txt'],
  ['00cb8584cacdf30f4d409cb85f8ad4042e7350c7ce885608ce5c595d5aa0a26e', 'fixtures/SYNTHETIC-SAE-02-PARTIAL.txt'],
  ['f7f02408fc150b3078720de30b44fc2af4c06fece0e5b8e2b4869512b710d078', 'fixtures/SYNTHETIC-SAE-03-GAPS.txt'],
  ['f2048ea78d4ecc007af556835d0ae4519c3f6059847494a30f13fe9a0d5560a4', 'regression/R01'],
  ['b3ee58585afb430220c085447563a18dca2deb77010877daa7e38a5bda4befee', 'regression/R02'],
  ['72fb50ea9141718267a9d7225fbd8b7116b56719989538958e9bb3c03f49c439', 'regression/R03'],
  ['7c1e687afa78122433c4867fedf9c730386cd06c7d10bc1e8cc358ea1db1d874', 'regression/R04'],
  ['47919f273f5c0fd60d494c3a349ffd506a316c0ee9a623fddc2e55abb8ebdf9d', 'regression/R05'],
  ['0b74e9334a462736627755c9420b112eb6642be619597ebe002d1c02acb0ead8', 'regression/R06'],
  ['69118464a17cdbc6cffa049135d4c6086d54a460b7f2ece39a4d73227c58dd45', 'regression/R07'],
  ['06cad4c9cd4666368c9ba8b263343b6ff25e472a4628675a3262769decb9ef68', 'regression/R08'],
  ['3771ab7f9649358f8e3bac7c7ea2c61bf703b18fdef92a30bef48b99b83fc810', 'regression/R09'],
  ['e148809e64413693bb134077c35db36b3ae6e5d51975f2ec7b6d1cc74f6dcee8', 'regression/R10'],
  ['1c40af7f5aca039941cbbb0c3faea866109373024427ca563caa574762b87ac2', 'regression/R11'],
  ['adc1a3b3f49c1f4a45112b09c2a9f6ed0d2b7a255b0c15ea5c42659d52a1c92d', 'regression/R12'],
  ['ca47a1daf028db91a9bc4e1865d1ba5326bc26b4d09f2c2080fbba871d33f911', 'regression/R13'],
  ['4df6f2cc9337fdc2d740cb0a086baaed8aceb3a9f370f9a37f44f11823e7eb84', 'regression/R14'],
  ['83164c492507e79f238714dc4744684477d25ae79a53c83de8d78a54d6e8cecb', 'regression/R15'],
  ['87356d514f03a56d9ce972818160e75dbf5584828b936eddf37b240690d91be7', 'regression/R16'],
  ['330c1b5a1893ad359f969bf479c080ba6a74c95861cca59d0f8c07e9136eb7c3', 'regression/R17'],
  ['bf6f4e25ca601cb6b9ff61ecf78882c37450febb91e564a85baa10ccbd2ca89d', 'regression/R18'],
  ['1575a8b8e2b129682285202c839db4e0d1fd4f2f45f4f8cac03bed155262dac5', 'regression/R19'],
  ['6a515e972129d0997af76440497181664d0476e51dea1e04b713956448c370b3', 'regression/R20'],
  ['7084ad7b2896c6a6c5cdee6d52f48659564ab270f345174c5310a7378ede509b', 'regression/R21'],
  ['e3d0869318b2a72c1ed8af37312115df9f3109ea003f2c5dfff2a0db8f4f453d', 'regression/R22'],
  ['01e2f539d6dae196ed919dec3248fc7222f7662f3e636b9e2a9f785a225a00c4', 'regression/R23'],
  ['cb3327997c22267519aa5ee3f949f4897c886ac634d97bfc85979ba5c9314334', 'regression/R24'],
];

export function materialHash(text) {
  return createHash('sha256').update(String(text).replace(/\s+/g, ' ').trim(), 'utf8').digest('hex');
}

const INDEX = new Map(DEVELOPMENT_MATERIAL.map(function (e) { return [e[0], e[1]]; }));

// Returns the source name if the text is listed development material, otherwise null.
export function isDevelopmentMaterial(text) {
  return INDEX.get(materialHash(text)) || null;
}

// Throws if any candidate holdout text is listed development material.
export function assertNotDevelopmentMaterial(texts) {
  var hits = [];
  (texts || []).forEach(function (t, i) { var src = isDevelopmentMaterial(t); if (src) hits.push(i + ' (' + src + ')'); });
  if (hits.length) throw new Error('development_material_in_holdout: ' + hits.join(', '));
  return true;
}
