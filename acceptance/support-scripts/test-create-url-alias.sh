#!/usr/bin/env bash
# This is is the acceptance test for creating a URL alias
set -e

# ENDPOINT_URL will be provided by the pipeline environment
#ENDPOINT_URL=$1
ID_TOKEN=$(cat /tmp/id_token.txt)

echo "Creating URL alias ..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ID_TOKEN" \
 -d '{"url":"https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html", "ttl": 1}' $ENDPOINT_URL
