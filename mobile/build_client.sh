#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# ICI White-Label build helper
# Usage:
#   ./build_client.sh <slug> <app_name> <package_id> [platform]
# Example:
#   ./build_client.sh test-academy "Test Academy" com.iciplatform.testacademy apk
# Requires TENANT_ID of the client in the environment (or edit below).
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SLUG="${1:?usage: build_client.sh <slug> <app_name> <package_id> [platform]}"
APP_NAME="${2:?missing app name}"
PKG="${3:?missing package id}"
PLATFORM="${4:-apk}"

# Set this per client (or pass via env): TENANT_ID
TENANT_ID="${TENANT_ID:?export TENANT_ID=<tenant uuid>}"
PRIMARY="${PRIMARY_COLOR:-#0284C7}"
SECONDARY="${SECONDARY_COLOR:-#0EA5E9}"
LOGO="${LOGO_ASSET:-assets/images/logo_default.png}"

COMMON_DEFINES=(
  "--dart-define=TENANT_ID=$TENANT_ID"
  "--dart-define=TENANT_SLUG=$SLUG"
  "--dart-define=APP_NAME=$APP_NAME"
  "--dart-define=APP_SHORT_NAME=$SLUG"
  "--dart-define=PRIMARY_COLOR=$PRIMARY"
  "--dart-define=SECONDARY_COLOR=$SECONDARY"
  "--dart-define=LOGO_ASSET=$LOGO"
  "--dart-define=APP_PACKAGE=$PKG"
  "--dart-define=APP_BUNDLE=$PKG"
)

echo "==> Building $APP_NAME ($SLUG) for $PLATFORM"
flutter pub get

if [ "$PLATFORM" = "apk" ]; then
  flutter build apk --release "${COMMON_DEFINES[@]}"
  echo "==> APK: build/app/outputs/flutter-apk/app-release.apk"
elif [ "$PLATFORM" = "apk-debug" ]; then
  flutter build apk --debug "${COMMON_DEFINES[@]}"
  echo "==> APK: build/app/outputs/flutter-apk/app-debug.apk"
elif [ "$PLATFORM" = "ios" ]; then
  flutter build ios --release --no-codesign "${COMMON_DEFINES[@]}"
else
  echo "Unknown platform: $PLATFORM"
  exit 1
fi
echo "==> Done."
