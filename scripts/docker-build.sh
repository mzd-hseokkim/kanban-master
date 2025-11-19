#!/usr/bin/env bash

set -euo pipefail

VERSION="${1:-latest}"

echo "Building docker images with tag: ${VERSION}"

KANBAN_VERSION="${VERSION}" docker compose build
