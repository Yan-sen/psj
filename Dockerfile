FROM node:20-slim

# 无头浏览器（预渲染用）
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=development

# npm 对本项目依赖树会崩溃（Exit handler never called），改用 pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json ./

RUN pnpm install
RUN ./node_modules/.bin/vite --version

COPY . .

RUN pnpm run build

ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["npm", "start"]
