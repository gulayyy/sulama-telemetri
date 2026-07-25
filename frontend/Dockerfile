# --- Derleme aşaması ---------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# API adresi derleme sırasında gömülür; tarayıcı host üzerinden eriştiği için
# varsayılan olarak yayınlanan backend portu kullanılır.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Sunum aşaması -----------------------------------------------------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
