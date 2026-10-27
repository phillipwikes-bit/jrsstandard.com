// 156-record study: splits the frozen research prompt into the system part and the user part and inserts one record.
// The header lines before [SYSTEM] (title, version, status) are documentation and are not sent. Pure; no I/O.
export function assemble(promptText, recordText) {
  const s = promptText.indexOf('[SYSTEM]\n'), u = promptText.indexOf('\n[USER]\n');
  if (s < 0 || u < 0 || u < s) throw new Error('prompt_sections_missing');
  const system = promptText.slice(s + '[SYSTEM]\n'.length, u).trim();
  const tpl = promptText.slice(u + '\n[USER]\n'.length);
  if (tpl.split('{{RECORD}}').length !== 2) throw new Error('prompt_record_placeholder_must_occur_once');
  if (/<\/?record>/i.test(recordText)) throw new Error('record_contains_record_delimiter');
  return { system, user: tpl.replace('{{RECORD}}', () => recordText).replace(/\s+$/, '') };
}
