#!/bin/bash

# Simple wrapper for npm run send
agent="$1"
message="$2"

if [ -z "$agent" ] || [ -z "$message" ]; then
    echo "Usage: $0 <agent> \"<message>\""
    exit 1
fi

npm run send "$agent" "$message"