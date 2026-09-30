# small wrapper so the probe scripts stay short
import json, time, urllib.request, urllib.error

BASE = "https://api.realworld.show/api"

def req(method, path, body=None, tok=None, raw=None, hdr=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if tok:
        r.add_header("Authorization", "Token " + tok)
    for k, v in (hdr or {}).items():
        r.add_header(k, v)
    t = time.time()
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, resp.read().decode(), round(time.time() - t, 2), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), round(time.time() - t, 2), dict(e.headers)

def show(label, res):
    print(f"== {label}: {res[0]} ({res[2]}s) {res[1][:300]}")

def new_user(password="pass1234"):
    import random
    u = "qa" + str(random.randint(10000, 99999))
    res = req("POST", "/users", {"user": {"username": u, "email": u + "@example.com", "password": password}})
    return u, u + "@example.com", json.loads(res[1])["user"]["token"]
