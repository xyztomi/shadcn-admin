# 1. Base Image
FROM node:18-alpine

# 2. Set Working Directory
WORKDIR /app

# 3. Copy dependencies first (Caching)
COPY package.json package-lock.json* ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the code
COPY . .

# 6. Expose the port
EXPOSE 3000

# 7. Start the dev server
CMD ["npm", "run", "dev"]