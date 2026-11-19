FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Применяем миграции Drizzle при каждом запуске контейнера.
# Делается здесь, а не в npm run dev, чтобы схема БД была актуальна
# и при одноразовом запуске (docker compose run backend ...).
EXPOSE 5000

CMD ["sh", "-c", "npm run db:migrate && npm run dev"]