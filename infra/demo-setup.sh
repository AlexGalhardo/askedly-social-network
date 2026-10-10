#!/bin/sh
# Used by the `setup` service in infra/docker-compose.demo.yaml.
set -eu

bunx prisma migrate deploy

# The seed wipes everything before populating: it only runs on an empty database, so the demo is not reset on every `up`.
USERS=$(bun -e 'import { prisma } from "./prisma/prisma-client"; console.log(await prisma.user.count()); await prisma.$disconnect();')
if [ "$USERS" = "0" ]; then
	bun prisma/seed.ts
else
	echo "Database already populated ($USERS users): seed skipped."
fi
