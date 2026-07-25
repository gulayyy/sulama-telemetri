FROM node:22-alpine

WORKDIR /app

# Önce yalnızca bağımlılık dosyaları kopyalanır; kaynak kod değiştiğinde
# npm ci katmanı önbellekten gelir ve imaj yeniden hızlı kurulur.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/index.js"]
