# Render butuh Chrome Headless Shell (diunduh Remotion) + library sistemnya.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
      libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 \
      libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*
# Claude Code CLI untuk riset dan naskah (auth lewat CLAUDE_CODE_OAUTH_TOKEN)
RUN npm install -g @anthropic-ai/claude-code@2.1.296
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npx remotion browser ensure && npm run build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
