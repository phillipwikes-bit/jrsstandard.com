// Local-only owner CSV evidence inspection. Imported records never leave this
// browser session, do not enter the provider inbox, and are not source-verified.
const MAX_FILE_BYTES=1024*1024, MAX_ROWS=2000, MAX_COLS=40, MAX_CELL=5000;
const statuses=['not_recorded','needs_review','response_recorded','closed','not_relevant'];
const labels={
  not_recorded:'Not recorded',needs_review:'Needs review',
  response_recorded:'Reply marked sent (unverified)',closed:'Closed (manual)',
  not_relevant:'Not relevant (manual)'
};
export function parseCsv(text){
  if(typeof text!=='string'||text.length>MAX_FILE_BYTES)throw Error('csv_size_limit');
  let csv=text.charCodeAt(0)===0xFEFF?text.slice(1):text;
  const records=[],cols=[];let field='',quoted=false,atStart=true;
  const pushField=()=>{
    if(field.length>MAX_CELL)throw Error('csv_field_limit');
    cols.push(field);field='';
    if(cols.length>MAX_COLS)throw Error('csv_column_limit');
    atStart=true;
  };
  const pushRecord=()=>{
    pushField();
    if(cols.some(x=>x.trim()!==''))records.push(cols.slice());
    cols.length=0;
    if(records.length>MAX_ROWS+1)throw Error('csv_row_limit');
  };
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(quoted){
      if(c==='"'){
        if(csv[i+1]==='"'){field+='"';i++;}
        else quoted=false;
      }else field+=c;
    }else if(c==='"'){
      if(!atStart)throw Error('csv_malformed_quotes');
      quoted=true;atStart=false;
    }else if(c===','){pushField();}
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&csv[i+1]==='\n')i++;
      pushRecord();
    }else{field+=c;atStart=false;}
    if(field.length>MAX_CELL)throw Error('csv_field_limit');
  }
  if(quoted)throw Error('csv_unclosed_quote');
  if(field.length||cols.length)pushRecord();
  if(records.length<2)throw Error('csv_no_records');
  const headers=records.shift().map(h=>h.trim().toLowerCase().replace(/[\s-]+/g,'_'));
  if(new Set(headers).size!==headers.length)throw Error('csv_duplicate_header');
  if(!headers.includes('email')||!headers.includes('message'))throw Error('csv_missing_required_headers');
  if(records.some(r=>r.length!==headers.length))throw Error('csv_column_mismatch');
  return {headers,records};
}
export function normalizeInquiries(text){
  const {headers,records}=parseCsv(text);
  const col=(row,...names)=>{
    for(const name of names){
      const i=headers.indexOf(name);
      if(i>=0)return row[i].trim();
    }
    return '';
  };
  const out=records.map((r,i)=>{
    const choice=col(r,'consent_to_contact','contact_permission','consent').toLowerCase();
    const contact=choice==='true'||choice==='yes'||choice==='on'||choice==='recorded-yes'
      ?'self-declared yes':choice==='false'||choice==='no'||choice==='recorded-no'
        ?'self-declared no':'not recorded';
    return {
      row:i+2,
      date:col(r,'date','_date','submitted_at','submitted','created_at'),
      category:col(r,'category','inquiry_category'),
      name:col(r,'name'),
      email:col(r,'email'),
      organization:col(r,'organization','organisation'),
      message:col(r,'message'),
      contact,
      source_record_id:col(r,'source_record_id','_id','id'),
      status:'not_recorded'
    };
  });
  return out;
}
function protectCsv(value){
  let v=String(value??'');
  if(/^[\s]*[=+@-]/.test(v))v="'"+v;
  return '"'+v.replace(/"/g,'""')+'"';
}
export function exportInquiries(rows){
  const keys=['date','category','name','email','organization','message','contact',
    'source_record_id','status','row'];
  const cells=[keys.map(protectCsv).join(',')];
  for(const r of rows){
    cells.push(keys.map(k=>protectCsv(r[k])).join(','));
  }
  return '\uFEFF'+cells.join('\r\n');
}
function setup(){
  const input=document.getElementById('current-inquiry-local-csv');
  const state=document.getElementById('current-inquiry-local-status');
  const table=document.getElementById('current-inquiry-local-rows');
  const exportBtn=document.getElementById('current-inquiry-local-export');
  const clearBtn=document.getElementById('current-inquiry-local-clear');
  if(!input||!state||!table||!exportBtn||!clearBtn)return;
  let records=[];
  const cell=(tr,v)=>{
    const td=document.createElement('td');
    td.textContent=String(v??'');tr.appendChild(td);return td;
  };
  function redraw(){
    table.textContent='';
    exportBtn.disabled=records.length===0;
    clearBtn.disabled=records.length===0;
    if(!records.length){
      const tr=document.createElement('tr'),td=cell(tr,'No local file loaded.');
      td.colSpan=8;table.appendChild(tr);return;
    }
    for(const r of records.slice(0,150)){
      const tr=document.createElement('tr');
      cell(tr,r.date||'Not supplied');cell(tr,r.category||'Unclassified');
      cell(tr,r.name||'Not supplied');cell(tr,r.email||'Not supplied');
      cell(tr,r.organization);cell(tr,r.message);cell(tr,r.contact);
      const td=cell(tr,'');
      const select=document.createElement('select');
      select.setAttribute('aria-label','Temporary follow-up for CSV row '+r.row);
      for(const status of statuses){
        const option=document.createElement('option');
        option.value=status;option.textContent=labels[status];select.appendChild(option);
      }
      select.value=r.status;
      select.addEventListener('change',()=>{
        r.status=select.value;
        state.textContent=records.length+' locally imported rows. Follow-up changes are temporary until exported. No database or Gmail changes were made.';
      });
      td.appendChild(select);table.appendChild(tr);
    }
  }
  function clear(){
    records=[];input.value='';
    state.textContent='No file loaded. Nothing was saved to the server.';
    redraw();
  }
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];
    if(!file){clear();return;}
    records=[];redraw();
    if(file.size>MAX_FILE_BYTES){
      state.textContent='Import rejected: maximum file size is 1 MB.';
      input.value='';return;
    }
    try{
      const content=await file.text();
      const parsed=normalizeInquiries(content);
      records=parsed;
      state.textContent=records.length+' unverified rows loaded in browser memory only. Showing first '+
        Math.min(records.length,150)+'. CSV content is not submitted to JRS, Formspree or Google Analytics.';
      redraw();
    }catch{
      records=[];input.value='';
      state.textContent='Could not validate this CSV. It must contain email and message columns, consistent rows and at most 2,000 records. No data was stored.';
      redraw();
    }
  });
  exportBtn.addEventListener('click',()=>{
    if(!records.length)return;
    if(!window.confirm('Export '+records.length+' unverified local rows, including contact details and temporary follow-up states, to a private CSV on this device?'))return;
    const blob=new Blob([exportInquiries(records)],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='jrs-private-local-inquiry-review.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    state.textContent='Private CSV download initiated. No permanent dashboard follow-up storage was created.';
  });
  clearBtn.addEventListener('click',clear);
  redraw();
}
if(typeof document!=='undefined')setup();
