# Project Setup & Usage

## 📦 Setting Up

1. Pull and run the Redis Docker image:

   ```bash
   docker pull redis
   docker run --name redis -p 6379:6379 -d redis

   ```

2. Create a .env file in the project root and add your Redis URL:\*\*
   REDIS_URL=redis://127.0.0.1:6379 # This is your Redis URL

3. Install dependencies using npm:
   npm install

## 🚀 Running the Project

1. Start the project:
   npm run start

2. Debugging (Optional):
   You can use the "server" launch configuration with VS Code Debugger to debug the project.

## 🛠 Requirements

Node.js (v22.14.0 recommended)

Docker

## 🧹 Clearing All Redis Data (Optional)

If you want to clear all data stored in Redis, you can run the following command:

docker exec -it "container-name" redis-cli FLUSHALL
