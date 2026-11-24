#!/usr/bin/env bash
# Deploy the trainer to the droplet.
#
# The droplet keeps a git clone of origin/main in /opt/bld, run by the systemd unit
# `bld` (python3 -m bld.server 8010) behind nginx. The React app (web/) is built here
# and its bundle (web/dist, not in git) is copied over. A deploy is: make sure what you
# want live is pushed to origin/main, build, fast-forward the clone, copy the bundle,
# restart the service, and check that the page and the API answer.
#
# Usage: ./deploy.sh [--skip-tests]
# Override any of these from the environment, e.g. DEPLOY_HOST=other ./deploy.sh
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-devcfm}"      # ssh host from ~/.ssh/config
APP_DIR="${APP_DIR:-/opt/bld}"
SERVICE="${SERVICE:-bld}"
PORT="${PORT:-8010}"
BRANCH="${BRANCH:-main}"

skip_tests=0
for arg in "$@"; do
  case "$arg" in
    --skip-tests) skip_tests=1 ;;
    -h|--help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")"
say() { printf '\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# 1. The droplet pulls from GitHub, so only pushed commits can go live.
say "Checking local repo"
[ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] || die "not on $BRANCH"
[ -z "$(git status --porcelain)" ] || die "uncommitted changes; commit (and push) them first"
git fetch --quiet origin "$BRANCH"
local_rev="$(git rev-parse HEAD)"
remote_rev="$(git rev-parse "origin/$BRANCH")"
[ "$local_rev" = "$remote_rev" ] || die "HEAD ($(git rev-parse --short HEAD)) differs from origin/$BRANCH ($(git rev-parse --short "origin/$BRANCH")); push or pull first"

# 2. Tests, then a clean production build of the web app (typecheck included).
if [ "$skip_tests" -eq 0 ]; then
  say "Running tests"
  python3 -m unittest discover -s tests -q
fi
say "Building web app"
npm ci --prefix web --no-audit --no-fund --loglevel=error
npm run --prefix web --silent build
[ -f web/dist/index.html ] || die "build produced no web/dist/index.html"

# 3. Fast-forward the clone on the droplet (as root) to exactly this commit.
say "Deploying $(git rev-parse --short HEAD) to $DEPLOY_HOST:$APP_DIR"
ssh "$DEPLOY_HOST" bash -s -- "$APP_DIR" "$BRANCH" "$local_rev" <<'REMOTE'
set -euo pipefail
app_dir="$1" branch="$2" want="$3"
cd "$app_dir"
before="$(git rev-parse --short HEAD)"
git fetch --quiet origin "$branch"
git merge --ff-only --quiet "origin/$branch"
[ "$(git rev-parse HEAD)" = "$want" ] || { echo "droplet is at $(git rev-parse --short HEAD), expected ${want:0:7}" >&2; exit 1; }
echo "    $before -> $(git rev-parse --short HEAD)"
find . -name __pycache__ -type d -prune -exec rm -rf {} +
REMOTE

# 4. Copy the bundle (readable by the service user), restart, health-check page and API.
say "Copying web/dist"
rsync -a --delete --chmod=D755,F644 web/dist/ "$DEPLOY_HOST:$APP_DIR/web/dist/"
ssh "$DEPLOY_HOST" bash -s -- "$SERVICE" "$PORT" <<'REMOTE'
set -euo pipefail
service="$1" port="$2"
systemctl restart "$service"
ok() { python3 -c "import urllib.request,sys; sys.exit(urllib.request.urlopen('http://127.0.0.1:$port$1', timeout=2).status != 200)" 2>/dev/null; }
for i in $(seq 1 20); do
  if ok / && ok /api/algs; then echo "    $service is up on :$port (page and API)"; exit 0; fi
  sleep 0.5
done
echo "service did not answer on :$port; recent logs:" >&2
journalctl -u "$service" -n 30 --no-pager >&2
exit 1
REMOTE

say "Done"
