FROM node:20-alpine

WORKDIR /app

# Копируем манифесты зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код проекта
COPY . .

# Открываем стандартный порт Vite
EXPOSE 5173

# Запускаем dev-сервер Vite с флагом --host, чтобы он слушал внешний сетевой интерфейс
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]