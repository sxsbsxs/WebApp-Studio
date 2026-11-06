#!/usr/bin/env bash
set -Eeuo pipefail
mkdir -p /work/src /work/output
unzip -q /work/input.zip -d /work/src
# Accept either a project at ZIP root or one enclosing project directory.
ROOT=/work/src
if ! find "$ROOT" -maxdepth 3 \( -name gradlew -o -name settings.gradle -o -name settings.gradle.kts \) -print -quit | grep -q .; then
  candidate=$(find "$ROOT" -mindepth 1 -maxdepth 3 -type f \( -name gradlew -o -name settings.gradle -o -name settings.gradle.kts \) -print -quit || true)
  if [ -n "$candidate" ]; then ROOT=$(dirname "$candidate"); fi
fi
if [ ! -f "$ROOT/gradlew" ]; then
  echo "未找到 gradlew。请上传包含 Gradle Wrapper 的完整 Android Studio 项目 ZIP。"
  exit 2
fi
if [ ! -f "$ROOT/settings.gradle" ] && [ ! -f "$ROOT/settings.gradle.kts" ]; then
  echo "未找到 settings.gradle 或 settings.gradle.kts。"
  exit 2
fi
cd "$ROOT"
chmod +x ./gradlew
./gradlew --no-daemon --stacktrace assembleDebug
APK=$(find . -type f -path '*/build/outputs/apk/debug/*.apk' -print -quit)
if [ -z "$APK" ]; then echo "Gradle 完成，但没有找到 debug APK。"; exit 3; fi
cp "$APK" /work/output/app-debug.apk
echo "APK_OUTPUT_READY"
