#!/bin/sh
# Usado pelo serviço `setup` de infra/docker-compose.demo.yaml.
set -eu

bunx prisma migrate deploy

# O seed apaga tudo antes de popular: só roda em banco vazio, para não zerar a demonstração a cada `up`.
USERS=$(bun -e 'import { prisma } from "./prisma/prisma-client"; console.log(await prisma.user.count()); await prisma.$disconnect();')
if [ "$USERS" = "0" ]; then
	bun prisma/seed.ts
else
	echo "Banco já populado ($USERS usuários): seed ignorado."
fi
