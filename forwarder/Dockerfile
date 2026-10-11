FROM node:20-alpine
WORKDIR /app
COPY server.mjs .
COPY static ./static
ENV STATIC_DIR=/app/static
EXPOSE 8787
CMD ["node", "server.mjs"]
