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
// Limit: this catches exact and whitespace-only copies. Edited, shortened or embedded copies
// are screened by contamination.js, which reports them as POSSIBLE matches for a person to judge.

import { createHash } from 'node:crypto';

export const DEV_MATERIAL_VERSION = 'dev-material/0.3.0';

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
  ['7aca702687d5624f2d7142aea4281304e3a4d4b73eaa0f25b4ed0cde14523dfa', 'corpus/v0.1.0/CR-001'],
  ['ebef93844157e2af7528dec3526f20ee7b25c06883487579a553a93f5e5830dd', 'corpus/v0.1.0/CR-002'],
  ['85597c84486380f985b8d1c3cd41ac89b67fed7853f6dc72196d9981aa24e342', 'corpus/v0.1.0/CR-003'],
  ['3bc0774348b4b0f16a249e028fd2bb5d51ec86ada2dcd4451e6a1bc2fe995434', 'corpus/v0.1.0/CR-004'],
  ['8a7b0cbbca4b39aa02345370d4c8937b37e8878a39e712dca18a61ab0f270ea8', 'corpus/v0.1.0/CR-005'],
  ['09adbf26641c86cc41c9b5c376b900c897b12b262a3ce22fb41bdd3eb2d5aad7', 'corpus/v0.1.0/CR-006'],
  ['f6f293baeb1019cfaac2e7a0330e9b2c9f4aa73ac915f26b155deaf9aa0cfffa', 'corpus/v0.1.0/CR-007'],
  ['afd9804a489a57f224dbc285101b0329546d49e29b62be1aaaa1e75a4dd8ecfc', 'corpus/v0.1.0/CR-008'],
  ['df41450f10730c709af4c8619080179159e5817c8f8927c271c59b0e68c9b564', 'corpus/v0.1.0/CR-009'],
  ['8df502a0f6b9caae333abf0cd22a7fcd11b2c410a5083f2b321b3a8387bdb68e', 'corpus/v0.1.0/CR-010'],
  ['d0ae16558a391c5e5e746ab249779af5ef3165945acb00670a533c534828fb21', 'corpus/v0.1.0/CR-011'],
  ['024a7819ac43e5734e68fb1dd5027f35be3a5897ccb2f36b25f2596b78d417c9', 'corpus/v0.1.0/CR-012'],
  ['b701c99259b2c9911fe66263dd27297db450c4590557a22d403b57a49be47ab3', 'corpus/v0.1.0/CR-013'],
  ['4f3bd192c348b9f102322e516989a57a2fbd1d83b1e335273b743f94b24c6a56', 'corpus/v0.1.0/CR-014'],
  ['69f02b291a08d7c5b3ffed69e637ace878d5621b155949bcd9ea06fb44b4eaf6', 'corpus/v0.1.0/CR-015'],
  ['5db103a6cd1fa676a7769b8c37fb8a4afd0f6e2b8fea4f45463300669f9b642d', 'confirmation/v0.1.0/K01'],
  ['a677072874c3d162da0aeaf05392fc170c0d5a9cf9d2f65c16d9bb5bc12ea6e8', 'confirmation/v0.1.0/K02'],
  ['7be62e0e68972859f135783dbfe031b7816903a0cbdf91536a30ef661f1c2427', 'confirmation/v0.1.0/K03'],
  ['937d96b93499ac26092ebf6b151936a89f04ca2215eee2d872551f4908c1fd72', 'confirmation/v0.1.0/K04'],
  ['18a52094f29e9ef282437f9d1b683faf4fb0055fb3ba22531a5c63c5750dff73', 'confirmation/v0.1.0/K05'],
  ['00be71aa7d92bdc7a87306f3c3e7b215e7524b94c676938e2949c6126667931c', 'confirmation/v0.1.0/K06'],
  ['fd5bdd9a21cbe2711bb97cb9fa9a89c4868d6f5e59bd1c1d02db2c7ef473ec7b', 'confirmation/v0.1.0/K07'],
  ['9af24aad3fe5f83868e741bd08cc40c065f907541d3b7af0e387336556133275', 'confirmation/v0.1.0/K08'],
  ['47c21b6e067ac1365811022e599f8ea489269c02791a8d915dc79be6f634ae8b', 'confirmation/v0.1.0/K09'],
  ['70b83cbd7c57ff7e1b5c606bb53e00ad75e66ee8718536ca99f72c19db431f99', 'confirmation/v0.1.0/K10'],
  ['41db0766e798d9e5eef94ff4e4818bd3f3dddb1dfdbf52153dedf17830902527', 'confirmation/v0.1.0/K11'],
  ['265e2680c0e3a751bae2aaa5b97b64afe117a4255f551b8b2ae8205fdc41263a', 'confirmation/v0.1.0/K12'],
  ['8724e724b0e7bed623c0c91d851d70430d4c55253f2e3c060f62996ca2505dd6', 'confirmation/v0.1.0/K13'],
  ['48ae05c3b53008d0dc49cdbb4f0bc5dbf1a0f1d1862e28f2cc73bfe41c96afd9', 'confirmation/v0.1.0/K14'],
  ['eb3f17c633e447385d8abd5c26d2522b82fae38ae17b09edded2a6e9cf2485a0', 'confirmation/v0.1.0/K15'],
  ['b8c4c66b2610571cedd63db33e4692c1c71241ce60dbfc8426d474cabf2d0997', 'confirmation/v0.1.0/K16'],
  ['27f6eb3efb3b4e6a1123ff30990040e996d41a17486fd68e80a6cc06d5b267a6', 'confirmation/v0.1.0/K17'],
  ['de104661b32977614732384ee8250ac055b6f980557cbed3aab8c0d222d7e1bd', 'confirmation/v0.1.0/K18'],
  ['116c4d07f7c2433bacc3d00fd4c0d01a0b9f0cc2838900e5e85b38f5bc4ea965', 'confirmation/v0.1.0/K19'],
  ['2d608cec5fa2f1359bb86ea7a1a1e2868df03ea4bb2a5319485093a223e63ad9', 'confirmation/v0.1.0/K20'],
  ['e72df0a7b9057a878bf7a4991f3c303b1b1826857953fd5755ab669ed3c612b6', 'confirmation/v0.1.0/K21'],
  ['8d785b6de8116522e692b935d0d6705edf30693407af9e17c34053f3ac3d5c16', 'confirmation/v0.1.0/K22'],
  ['23a524a6dfebb5a0a8e6ba0a3b8e207907f20591abf0a83970fedd0f9ff2e2cb', 'confirmation/v0.1.0/K23'],
  ['3e8e0c136f62159a6aae83465cbd20d59117934b3eaf7439d29656370be557de', 'confirmation/v0.1.0/K24'],
  ['d98eea340c4cb8a98994540830f5475bdeff8848b6013c77e3751f35327360e5', 'confirmation/v0.1.0/K25'],
  ['2fb6dbb39b43e801b861251632065c00ed9dd16ec95373f56d24f8e7c953172d', 'confirmation/v0.1.0/K26'],
  ['3d366103b34228cd7174627d2f8b07b451dd9805541505bdce8bffa924b3fa3c', 'confirmation/v0.1.0/K27'],
  ['a222b73ea51c85f52ef6e3607f7affa6fdf7db5dfbd468bf2bb47550a151338e', 'confirmation/v0.1.0/K28'],
  ['f38bd6401668fc1c9bf2b0f05fad67f9e17dd5ecf1618136c85388baba14cd1a', 'confirmation/v0.1.0/K29'],
  ['96f6fe4881dff052c9e2d709ead3a91877fe6b5236a9be0f44a105e17094b744', 'confirmation/v0.1.0/K30'],
  ['ae34458cdfcb460da73a27b87fadeaf6228c764857d78644a4518939fc3600eb', 'confirmation/v0.1.0/K31'],
  ['2eff959b6eb136f6b56848bc1d7ad31fef19461d8842a7fb95fb3723574ff28b', 'confirmation/v0.1.0/K32'],
  ['70a3ab4fc910a0b4c9d00d5f72dbb0560a6149f5681b7bad5936dff62fec3143', 'confirmation/v0.1.0/K33'],
  ['9be5157ef44d79490eee4f7a9ea3f5e6f6d7dd33239e06ba84bc919706553a1d', 'confirmation/v0.1.0/K34'],
  ['5a2b03896b20eb94dde1c31280654246a3be4bca06cafa85ed6b08aee7dd0aec', 'confirmation/v0.1.0/K35'],
  ['3f123d1db99f81a3063f4fb9b233c07cffef5562a2f9e481035523fff6264343', 'confirmation/v0.1.0/K36'],
  ['18e80e7371165c557adbc673d634f7ae1ed64e43e8308a6791a1ab4294736ca5', 'confirmation/v0.1.0/K37'],
  ['93fe1c8218bab83b2334e6a5c38f4e00c63aafbe8fd7ab6d14962a3744f6e4f3', 'confirmation/v0.1.0/K38'],
  ['a52828775f16a8fc7bcf871e565a9d51ca332ccd508db232e3f63ec7349faa7d', 'confirmation/v0.1.0/K39'],
  ['d8202ce4f6ffeb2d11e5f191ba177b15bb682bf29f243e564a7b78c933d78c3c', 'confirmation/v0.1.0/K40'],
  ['29f0af5970edbe9d1c0b979154a2fba04d5480c83eb91c14f8778b8dc9521f7e', 'confirmation/v0.1.0/K41'],
  ['d38092d43028ab53b3c94f23171fb73574d4a3001e0ce980aad11c1dbae378f0', 'confirmation/v0.1.0/K42'],
  ['f2eda2061edbab2ebbe303ebd46f8047d55678cce87f04be70984c8e48e98dfb', 'confirmation/v0.1.0/K43'],
  ['122888cd76f5b9d5af0db4f30ad838db3633ec3a63143354d358cc35c2bf8a27', 'confirmation/v0.1.0/K44'],
  ['85a5650e7ad1d4062d06164becaf4bf6382118fe39734a2d53b515faf275bdbf', 'confirmation/v0.1.0/K45'],
  ['d35b9f07fe5b7a36d5e5925f84253cd48cc0595552ccf59a1b16a27becacf01e', 'confirmation/v0.1.0/K46'],
  ['8e559e5fae6a7646b93a160d1c11f34daf188ca32d4f33dd59c3b8020f0c4d4e', 'confirmation/v0.1.0/K47'],
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
