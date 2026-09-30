# first pass over the main flows + validation edge cases
# run: python api_probes.py
import json, random
from api_helpers import req, show

u="qa"+str(random.randint(10000,99999))
show("register", r:=req("POST","/users",{"user":{"username":u,"email":u+"@example.com","password":"p"}}))
show("register empty", req("POST","/users",{"user":{"username":"","email":"","password":""}}))
show("register bad email", req("POST","/users",{"user":{"username":u+"x","email":"not-an-email","password":"a"}}))
show("register whitespace user", req("POST","/users",{"user":{"username":"   ","email":u+"ws@example.com","password":"a"}}))
show("register dup", req("POST","/users",{"user":{"username":u,"email":u+"@example.com","password":"p"}}))
show("register case email", req("POST","/users",{"user":{"username":u+"c","email":u.upper()+"@EXAMPLE.COM","password":"p"}}))
show("register malformed json", req("POST","/users",raw=b'{"user":'))
tok=json.loads(r[1])["user"]["token"] if r[0] in (200,201) else None
print("token:", tok[:40] if tok else None)
show("login ok", req("POST","/users/login",{"user":{"email":u+"@example.com","password":"p"}}))
show("login wrong pw", req("POST","/users/login",{"user":{"email":u+"@example.com","password":"wrong"}}))
show("login unknown", req("POST","/users/login",{"user":{"email":"nobody-zz@example.com","password":"wrong"}}))
show("create article", a:=req("POST","/articles",{"article":{"title":"QA test <script>alert(1)</script>","description":"d","body":"# hi\n<img src=x onerror=alert(1)>\n[x](javascript:alert(1))","tagList":["qa","QA"," qa "]}},tok))
slug=json.loads(a[1])["article"]["slug"] if a[0] in (200,201) else None
show("create dup title", req("POST","/articles",{"article":{"title":"QA test <script>alert(1)</script>","description":"d","body":"b"}},tok))
show("create empty", req("POST","/articles",{"article":{"title":"","description":"","body":""}},tok))
show("create whitespace", req("POST","/articles",{"article":{"title":"   ","description":"  ","body":"  "}},tok))
show("create huge title", req("POST","/articles",{"article":{"title":"A"*5000,"description":"d","body":"b"}},tok))
show("create no auth", req("POST","/articles",{"article":{"title":"x","description":"d","body":"b"}}))
show("update", req("PUT","/articles/"+str(slug),{"article":{"title":"Edited title"}},tok))
show("get old slug", req("GET","/articles/"+str(slug)))
show("update empty title", req("PUT","/articles/"+str(slug),{"article":{"title":""}},tok))
show("user update empty email", req("PUT","/user",{"user":{"email":""}},tok))
show("user update image js", req("PUT","/user",{"user":{"image":"javascript:alert(1)"}},tok))
show("comment empty", req("POST",f"/articles/{slug}/comments",{"comment":{"body":""}},tok))
show("bad token", req("GET","/user",tok="abc.def.ghi"))
show("delete", req("DELETE","/articles/"+str(slug),tok=tok))
show("delete again", req("DELETE","/articles/"+str(slug),tok=tok))
show("limit huge", req("GET","/articles?limit=100000"))
show("limit negative", req("GET","/articles?limit=-1&offset=-5"))
show("limit nan", req("GET","/articles?limit=abc"))
h=req("GET","/tags")[3]; print("HEADERS", {k:v for k,v in h.items()})
print("USER",u)
