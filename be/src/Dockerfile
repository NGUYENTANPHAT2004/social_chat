FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Install FFmpeg for stream transcoding
RUN apk add --no-cache ffmpeg

EXPOSE 5000 1935

CMD ["node", "dist/main"]