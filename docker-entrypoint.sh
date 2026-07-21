#!/bin/sh
set -e

node_modules/.bin/prisma migrate deploy

if [ -f prisma/guests-data.ts ]; then
    node_modules/.bin/tsx prisma/seed.ts
fi

if [ -f prisma/fixups.ts ]; then
    node_modules/.bin/tsx prisma/fixups.ts
fi

exec "$@"
