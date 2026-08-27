FROM node:20-alpine
WORKDIR /app
COPY src/app.js .
EXPOSE 3000
CMD ["node", "app.js"]
