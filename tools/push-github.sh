#!/usr/bin/env bash
#
# 공개 저장소(GitHub)에 지금 상태를 올린다.
#
# 히스토리를 통째로 올리지 않는다. 예전 커밋에 .env 가 들어 있어서, 지금 지워 봐야
# 과거를 뒤지면 그대로 나온다. 그래서 매번 **한 커밋짜리 가지**를 새로 만들어 올린다.
#
#   개발 히스토리 → GitLab (origin)
#   지금 상태 한 장 → GitHub (github)
#
# 쓰기: bash tools/push-github.sh "커밋에 적을 말"
set -e

MSG="${1:-남은 두 장 — 지금 상태}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"

# 올리지 않을 것. 플랫폼이 관리하거나, 스캐폴드가 두고 간 것들.
SECRET=(.env .agent8.lock committedAt)
SCAFFOLD=(PROJECT)

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ -n "$(git status --porcelain)" ]; then
  echo "손댄 것이 남아 있다. 먼저 커밋하거나 치울 것."
  exit 1
fi

git branch -D github-public 2>/dev/null || true
git checkout -q --orphan github-public

for f in "${SECRET[@]}"; do git rm -q --cached "$f" 2>/dev/null || true; done
for d in "${SCAFFOLD[@]}"; do git rm -q -r --cached "$d" 2>/dev/null || true; done

# 공개 저장소에서는 .env 를 아예 안 본다
grep -qx '.env' .gitignore || printf '\n# 공개 저장소에는 안 올린다\n.env\n' >> .gitignore
git add .gitignore

git commit -q -m "$MSG"

echo "── 올라갈 것에 비밀값이 없는지 ──"
for f in "${SECRET[@]}" "${SCAFFOLD[@]}"; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "  멈춘다: $f 가 들어 있다"
    git checkout -q -f "$BRANCH"
    exit 1
  fi
done
echo "  깨끗함"

git push -q --force github github-public:main
git checkout -q -f "$BRANCH"
git branch -D github-public >/dev/null

echo "올림: https://github.com/Jujeongmin/remaining-two-pages"
