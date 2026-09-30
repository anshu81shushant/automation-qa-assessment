# second pass - digging into the weird stuff from api_probes.py
# (duplicate accounts, tokens dying, empty slugs)
# run: PYTHONIOENCODING=utf-8 python api_probes_accounts.py
import json
from api_helpers import req, show, new_user

print("### same email registered twice")
u, em, _ = new_user()
a = req("POST", "/users", {"user": {"username": u, "email": em, "password": "second"}})
show("2nd signup same email", a)
show("login w/ 1st password", req("POST", "/users/login", {"user": {"email": em, "password": "pass1234"}}))
show("login w/ 2nd password", req("POST", "/users/login", {"user": {"email": em, "password": "second"}}))

print("\n### login on 'device 2' kills 'device 1'")
u, em, _ = new_user()
dev1 = json.loads(req("POST", "/users/login", {"user": {"email": em, "password": "pass1234"}})[1])["user"]["token"]
print("device1 before:", req("GET", "/user", tok=dev1)[0])
dev2 = json.loads(req("POST", "/users/login", {"user": {"email": em, "password": "pass1234"}})[1])["user"]["token"]
print("device2:", req("GET", "/user", tok=dev2)[0])
show("device1 after device2 login", req("GET", "/user", tok=dev1))
show("device1 tries to publish", req("POST", "/articles", {"article": {"title": "lost work", "description": "d", "body": "b"}}, dev1))

print("\n### titles that break the slug")
u, em, tok = new_user()
for title in ["   ", "\U0001f680\U0001f680", "!!!", "日本語", "Café Olé"]:
    r = req("POST", "/articles", {"article": {"title": title, "description": "d", "body": "b"}}, tok)
    slug = json.loads(r[1]).get("article", {}).get("slug") if r[0] == 201 else r[1]
    print(ascii(title), r[0], "slug =", repr(slug))

print("\ntrying to get rid of the empty-slug one:")
print("GET /articles/   ->", req("GET", "/articles/", tok=tok)[0], "(that's the list endpoint, not the article)")
print("DELETE /articles/ ->", req("DELETE", "/articles/", tok=tok)[0])
print("DELETE /articles/%20 ->", req("DELETE", "/articles/%20", tok=tok)[0])
lst = json.loads(req("GET", "/articles?author=" + u, tok=tok)[1])
print("my articles still:", lst["articlesCount"], [a["slug"] for a in lst["articles"]])
