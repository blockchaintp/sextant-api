#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

export BINARY_NAME="tfs-fuse-actual"
/usr/local/bin/client-wrapper "$@"