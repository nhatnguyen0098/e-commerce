#!/bin/sh
set -e
readonly nestApp="${NEST_APP:?NEST_APP is required (e.g. api-gateway)}"
exec node "/app/dist/apps/${nestApp}/apps/${nestApp}/src/main.js"
