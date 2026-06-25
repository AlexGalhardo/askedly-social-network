<h1 align="center">RespondeAê - Rede Social de Perguntas e Respostas</h1>


## Up postgre docker

1. Clone repository

```bash
git clone git@github.com:AlexGalhardo/respondeae.git
```

2. Enter repository

```bash
cd respondeae/
```

3. Install dependencies

```bash
npm install
```

4. Setup your environment variables

```bash
cp .env.example .env
```

5. Start Docker Postgres and build and up Docker Api Service

```bash
sudo chmod +x setup.sh && ./setup.sh
```

## Prisma Studio (DataBase GUI)

- To Start Prisma Studio:

```bash
npm run prisma:studio
```

## Build

a. Creating build

```bash
npm run build
```

b. Testing build server locally

```bash
npm run start
```
