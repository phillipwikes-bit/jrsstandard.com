import sys,os,re,json,subprocess
sys.path.insert(0,sys.argv[3])
import build_corpus as b
src,out=sys.argv[1],sys.argv[2]
def outcome(t):
    # Operative words are printed in capitals in these decisions ("we VACATE the
    # Agency's final decision and REMAND"). Only the text after the BACKGROUND
    # section is read, so the background the rule sees never carries the result.
    m=re.search(r"\n\s*BACKGROUND\s*\n(.*?)\n\s*" + b.HEADS + r"\s*\n", t, re.S)
    after=t[m.end():] if m else t
    neg=re.search(r'\b(REVERSE[SD]?|VACATE[SD]?|REMAND(?:ED|S)?|MODIF(?:Y|IED|IES))\b',after)
    pos=re.search(r'\bAFFIRM(?:ED|S)?\b',after)
    if neg: return 'not_affirmed'
    if pos: return 'affirmed'
    return None
rows=[];skip=dict(recon=0,nobg=0,nolabel=0)
for f in sorted(os.listdir(src)):
    if not f.endswith('.pdf'): continue
    t=subprocess.run(['pdftotext','-layout',os.path.join(src,f),'-'],capture_output=True,text=True).stdout
    if re.search(r'Request No\.|REQUEST FOR RECONSIDERATION',t[:4000]): skip['recon']+=1; continue
    bg=b.background(t)
    if len(bg.split())<150: skip['nobg']+=1; continue
    o=outcome(t)
    if o is None: skip['nolabel']+=1; continue
    rows.append({'file':f,'outcome':o,'background':bg})
json.dump(rows,open(out,'w'))
print(len(rows),skip,sum(r['outcome']=='not_affirmed' for r in rows),'not affirmed')
