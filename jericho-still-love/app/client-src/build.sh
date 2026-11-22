#!/bin/bash
# Join the client source parts into the single file the page loads.
set -e
cd "$(dirname "$0")"
cat a.js t.js b1.js b2.js c.js d.js e.js f.js > ../public/client.js
node --check ../public/client.js
echo "client.js: $(wc -l < ../public/client.js) lines"
