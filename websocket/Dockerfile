FROM oven/bun:latest

WORKDIR /app

COPY package*.json bun.lockb ./

RUN bun install

COPY ../src/lib ./src/lib/

COPY . .

EXPOSE 8080

CMD [ "bun", "run", "src/main.ts" ]