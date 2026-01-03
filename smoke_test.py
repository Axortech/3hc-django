"""
Lightweight smoke test for local backend API endpoints.
Run from the workspace root or backend folder.
"""
import urllib.request
import urllib.error
import json
import sys

ENDPOINTS = [
    '/api/site-logo/',
    '/api/banners/active/',
    '/api/team-members/?page=1&per_page=1',
    '/api/blog-posts/?status=published&limit=1',
    '/api/site-config/',
]

BASE = 'http://127.0.0.1:8000'
TIMEOUT = 5


def check(url):
    full = BASE + url
    req = urllib.request.Request(full, headers={'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            status = resp.getcode()
            ctype = resp.headers.get('Content-Type', '')
            body = resp.read(2000)
            try:
                parsed = json.loads(body.decode('utf-8')) if body else None
                parsed_flag = True
            except Exception:
                parsed = None
                parsed_flag = False
            print(f"OK: {url} -> status={status}, content-type={ctype}, json={parsed_flag}")
    except urllib.error.HTTPError as e:
        print(f"HTTP ERROR: {url} -> status={e.code}")
    except urllib.error.URLError as e:
        print(f"NETWORK ERROR: {url} -> {e.reason}")
    except Exception as e:
        print(f"ERROR: {url} -> {e}")


if __name__ == '__main__':
    print('Running smoke tests against', BASE)
    for ep in ENDPOINTS:
        check(ep)
    print('Done')
