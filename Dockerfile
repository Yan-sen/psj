FROM node:20-slim

# 无头浏览器（预渲染用）
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./

ENV NODE_ENV=development

# npm 在该网络下偶发 "Exit handler never called" 崩溃：用 npmmirror 源 + 失败重试
RUN npm config set registry https://registry.npmmirror.com \
  && (npm ci --include=dev || npm ci --include=dev || npm ci --include=dev)
RUN ./node_modules/.bin/vite --version

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["npm", "start"]
