#!/bin/sh
# Mac 에서 UX Lens 서버(npm run share)를 로그인할 때 자동으로 켜고, 꺼지면 다시 켜요(launchd).
#   등록:  npm run autostart:mac
#   상태:  npm run autostart:mac -- --status
#   해제:  npm run autostart:mac -- --remove
# 로그는 프로젝트 폴더의 share.log 에 쌓여요. 켜져 있는 동안은 share 가 Mac 잠자기를 막아요(전원 연결 시).
set -eu

LABEL=com.uxlens.share
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
TARGET="gui/$(id -u)"
PROJECT=$(cd "$(dirname "$0")/.." && pwd -P)
LOG="$PROJECT/share.log"

case "${1:-}" in
  --remove)
    launchctl bootout "$TARGET/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "자동 실행을 해제했어요."
    exit 0
    ;;
  --status)
    if launchctl print "$TARGET/$LABEL" >/dev/null 2>&1; then
      launchctl print "$TARGET/$LABEL" | grep -E '^[[:space:]]*(state|pid|last exit code|runs) ='
    else
      echo "자동 실행이 등록돼 있지 않아요."
    fi
    exit 0
    ;;
esac

NODE=$(command -v node)
# launchd 는 터미널의 PATH 를 쓰지 않아서 claude·npx·cloudflared 를 찾을 수 있게 직접 적어요.
TOOL_PATH="$(dirname "$NODE"):$(dirname "$(command -v claude)"):$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>scripts/share.js</string>
  </array>
  <key>WorkingDirectory</key><string>$PROJECT</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$TOOL_PATH</string>
    <key>LANG</key><string>en_US.UTF-8</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST_EOF
plutil -lint "$PLIST" >/dev/null

launchctl bootout "$TARGET/$LABEL" 2>/dev/null || true
launchctl bootstrap "$TARGET" "$PLIST"
echo "자동 실행을 등록했어요. 지금 켜졌고, 다음 로그인부터 자동으로 켜져요."
echo "로그: $LOG"
