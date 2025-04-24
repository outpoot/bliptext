FROM oven/bun:latest

WORKDIR /app

COPY package*.json bun.lockb ./

RUN bun install

RUN mkdir -p src/lib/shared

COPY ../src/lib/shared/*.ts ./src/lib/shared/

COPY . .

EXPOSE 8080

CMD [ "bun", "run", "src/main.ts" ]