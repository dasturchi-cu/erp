FROM node:22-alpine AS builder
WORKDIR /app
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp?schema=public"
COPY . .
RUN if [ -f "package.json" ]; then npm install && npx prisma generate && npm run build; else cd backend && npm install && npx prisma generate && npm run build; fi

FROM node:22-alpine
WORKDIR /app
ENV PORT=3000
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh", "-c", "if [ -f 'dist/src/main.js' ]; then npx prisma migrate deploy && npx prisma db seed && node dist/src/main.js; else cd backend && npx prisma migrate deploy && npx prisma db seed && node dist/src/main.js; fi"]
