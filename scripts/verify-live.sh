#!/usr/bin/env bash
# Read-only checks against a deployed site. Usage: scripts/verify-live.sh https://your.site.example
# Needs only curl. Does not log in and sends no credentials.
set -u
BASE="${1:?usage: $0 https://site.example}"
HOST="${BASE#https://}"; HOST="${HOST%%/*}"
pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; pass=$((pass+1)); else echo "FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -m 20 -w '%{http_code}' "$@"; }

check "HTTPS homepage"            200 "$(code "$BASE/")"
for p in about academics admissions contact; do
  check "Subpage /$p/"            200 "$(code "$BASE/$p/")"
done
check "HTTP redirects to HTTPS"   301 "$(code "http://$HOST/")"
loc=$(curl -s -o /dev/null -m 20 -w '%{redirect_url}' "http://$HOST/")
case "$loc" in https://*) echo "PASS  Redirect target is HTTPS ($loc)"; pass=$((pass+1));; *) echo "FAIL  Redirect target is HTTPS ($loc)"; fail=$((fail+1));; esac
check "WAF blocks script injection" 403 "$(code -G --data-urlencode 'q=<script>alert(1)</script>' "$BASE/")"
check "TLS certificate valid"     0 "$(curl -s -o /dev/null -m 20 -w '%{ssl_verify_result}' "$BASE/")"
echo "Passed: $pass  Failed: $fail"
[ "$fail" -eq 0 ]
