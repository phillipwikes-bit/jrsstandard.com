import json,re,sys
from math import comb,sqrt
d=json.load(open(sys.argv[1]))
GAP=r'did not (provide|submit|include|respond|produce|investigate|interview|address)|failed to (provide|submit|respond|investigate|include|produce|interview|address)|not (included|provided|produced) in the record|no affidavit|incomplete|insufficient|inadequate|was not (investigated|interviewed|addressed)'
SJ=r'without a hearing|summary judgment'
rules={'primary_no_summary_judgment':lambda t: not re.search(SJ,t),'secondary_gap_and_no_summary_judgment':lambda t: bool(re.search(GAP,t)) and not re.search(SJ,t)}
def fisher(a,b,c,d):
  n=a+b+c+d;r1=a+b;c1=a+c;p=lambda x: comb(c1,x)*comb(n-c1,r1-x)/comb(n,r1);p0=p(a)
  return sum(p(x) for x in range(max(0,r1+c1-n),min(r1,c1)+1) if p(x)<=p0+1e-12)
def wil(k,n,z=1.96):
  if not n: return None
  p=k/n;dd=1+z*z/n;c=p+z*z/(2*n);h=z*sqrt(p*(1-p)/n+z*z/(4*n*n));return [round((c-h)/dd,3),round((c+h)/dd,3)]
out={'n':len(d),'not_affirmed':sum(r['outcome']=='not_affirmed' for r in d)}
for name,f in rules.items():
  fl=[(f(r['background'].lower()),r['outcome']=='not_affirmed') for r in d]
  a=sum(1 for x,y in fl if x and y);b=sum(1 for x,y in fl if x and not y);c=sum(1 for x,y in fl if not x and y);e=sum(1 for x,y in fl if not x and not y)
  p=fisher(a,b,c,e);share=(a+b)/len(fl)
  out[name]={'flagged':a+b,'not_affirmed_if_flagged':[a,a+b,wil(a,a+b)],'not_affirmed_if_not_flagged':[c,c+e,wil(c,c+e)],'fisher_p':round(p,4),'flag_share':round(share,3),'pass':p<0.05 and a/(a+b)>c/max(c+e,1) and 0.1<=share<=0.9}
print(json.dumps(out,indent=1))
