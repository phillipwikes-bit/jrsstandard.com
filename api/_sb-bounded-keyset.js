// Increment 22: bounded, deterministic PostgREST keyset reader.
// This is not an atomic database snapshot across separate HTTP requests.
const DEFAULT_PAGE_SIZE=1000, MAX_PAGES=100;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DECIMAL_ID=/^(0|[1-9][0-9]{0,38})$/;
const EXACT_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function assert(value,code){if(!value)throw new Error(code)}
function iso(value,code){
 const ms=Date.parse(value);
 assert(typeof value==='string'&&Number.isFinite(ms),code);
 return new Date(ms).toISOString();
}
function idValue(value){
 if(typeof value==='number'){
  assert(Number.isSafeInteger(value)&&value>=0,'source_id_invalid');
  value=String(value);
 }
 assert(typeof value==='string','source_id_invalid');
 const normalized=value.toLowerCase();
 assert(UUID.test(normalized)||DECIMAL_ID.test(value),'source_id_invalid');
 return normalized;
}
function compareId(a,b){
 if(DECIMAL_ID.test(a)&&DECIMAL_ID.test(b)){
  const x=BigInt(a),y=BigInt(b);return x<y?-1:x>y?1:0;
 }
 assert(UUID.test(a)&&UUID.test(b),'source_id_type_mismatch');
 return a<b?-1:a>b?1:0;
}
function compareTuple(a,b){
 return a.timestamp<b.timestamp?-1:a.timestamp>b.timestamp?1:compareId(a.id,b.id);
}
function prepareUrl(raw,cutoff){
 let u;
 try{u=new URL(raw)}catch{throw new Error('source_url_invalid')}
 assert(u.protocol==='https:'&&/^\/rest\/v1\/(pilot_contacts|interaction_events)$/.test(u.pathname),'source_scope_unapproved');
 const keys=[...u.searchParams.keys()];
 assert(keys.every(k=>['source','select'].includes(k))&&
  keys.filter(k=>k==='source').length===1&&
  keys.filter(k=>k==='select').length===1,'source_query_unapproved');
 assert(/^eq\.[a-z][a-z0-9-]{0,63}$/.test(u.searchParams.get('source')||''),'source_filter_invalid');
 const fields=(u.searchParams.get('select')||'').split(',');
 assert(fields.length===new Set(fields).size&&fields.includes('id')&&
  fields.includes('created_at')&&fields.every(s=>/^[a-z_]+$/.test(s)),
  'source_keys_not_selected');
 u.searchParams.set('created_at','lte.'+cutoff);
 u.searchParams.set('order','created_at.asc,id.asc');
 return u;
}
function exactCutoff(value){
 assert(typeof value==='string'&&EXACT_UTC.test(value)&&
  iso(value,'cutoff_invalid')===value,'cutoff_invalid');
 return value;
}
function pageSizeValue(value){
 assert(Number.isSafeInteger(value)&&value>=1&&value<=DEFAULT_PAGE_SIZE,'page_size_invalid');
 return value;
}
// Returns a bounded, ordered, duplicate-checked read for an approved source.
// It does NOT guarantee a consistent database snapshot if rows are deleted,
// backdated, or updated while the sequence is running.
export async function fetchBoundedKeyset(sourceUrl,headers,{cutoffUtc,pageSize=DEFAULT_PAGE_SIZE}={}){
 const cutoff=exactCutoff(cutoffUtc),size=pageSizeValue(pageSize);
 const requestUrl=prepareUrl(sourceUrl,cutoff);
 const out=[],seen=new Set();
 let cursor=null,pages=0;
 for(let page=0;page<MAX_PAGES;page++){
  const u=new URL(requestUrl.toString());
  if(cursor){
   // The cursor values are validated before incorporation in this filter.
   u.searchParams.set('or','(created_at.gt.'+cursor.timestamp+
    ',and(created_at.eq.'+cursor.timestamp+',id.gt.'+cursor.id+'))');
  }
  let batch;
  try{
   const response=await fetch(u.toString(),{
    method:'GET',headers:{...headers,'Range-Unit':'items','Range':'0-'+(size-1)},
    redirect:'error',cache:'no-store'
   });
   if(!response.ok)throw Error('read_failed');
   batch=await response.json();
  }catch{throw new Error('source_read_incomplete')}
  assert(Array.isArray(batch)&&batch.length<=size,'source_page_invalid');
  pages++;
  for(const row of batch){
   assert(row&&typeof row==='object'&&!Array.isArray(row),'source_row_invalid');
   const id=idValue(row.id),timestamp=iso(row.created_at,'source_timestamp_invalid');
   const key={id,timestamp};
   assert(timestamp<=cutoff,'source_row_after_cutoff');
   assert(!seen.has(id),'source_duplicate_id');
   if(cursor)assert(compareTuple(key,cursor)>0,'source_order_invalid');
   seen.add(id);out.push(row);cursor=key;
  }
  if(batch.length<size)return {
   rows:out,evidence:{
    cutoff_utc:cutoff,order:'created_at.asc,id.asc',
    observed_rows:out.length,page_requests:pages,pagination:'strict_keyset',
    consistency:'bounded_ordered_read_not_atomic_snapshot'
   }
  };
 }
 throw new Error('source_page_limit_exceeded');
}
