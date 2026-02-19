# Layer 1: The Base OS
FROM node:18-alpine

# Layer 2: Setup the Work Folder
WORKDIR /app

# Layer 3: Install Dependencies
COPY package.json package-lock.json ./
RUN npm install
RUN apk add --no-cache python3

# Layer 4: Copy Source Code
COPY . .

# Layer 5: Open Port
EXPOSE 8080

# Layer 6: Run Command
CMD ["sh", "-c", "node src/monitor.js & python3 -m http.server 8080 --directory src/"]
