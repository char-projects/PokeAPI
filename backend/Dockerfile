FROM node:20-bullseye-slim

WORKDIR /usr/src/app

RUN apt-get update && \
	apt-get install -y --no-install-recommends build-essential python3 libsqlite3-dev ca-certificates && \
	rm -rf /var/lib/apt/lists/*

COPY package*.json ./

COPY . .
RUN npm install
RUN npm run build

RUN apt-get purge -y --auto-remove build-essential python3 && \
	rm -rf /var/lib/apt/lists/* || true

EXPOSE 3000
CMD ["node", "dist/server.js"]

