# Redis Setup Guide for Guest House Booking System

## Step 1: Install Redis on Your System

### For Windows:

**Option A: Using WSL (Windows Subsystem for Linux) - Recommended**
1. Open PowerShell as Administrator
2. Install WSL:
   ```powershell
   wsl --install
   ```
3. Restart your computer
4. Open Ubuntu (or your Linux distro) from Start Menu
5. Update packages:
   ```bash
   sudo apt update
   sudo apt upgrade
   ```
6. Install Redis:
   ```bash
   sudo apt install redis-server
   ```
7. Start Redis:
   ```bash
   sudo service redis-server start
   ```
8. Test Redis:
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

**Option B: Using Docker (Easier)**
1. Install Docker Desktop for Windows
2. Run Redis container:
   ```bash
   docker run -d -p 6379:6379 --name redis redis:latest
   ```
3. Test Redis:
   ```bash
   docker exec -it redis redis-cli ping
   ```

**Option C: Using Memurai (Windows Native)**
1. Download Memurai from: https://www.memurai.com/
2. Install and start the service
3. It runs on port 6379 by default

### For macOS:

1. Install using Homebrew:
   ```bash
   brew install redis
   ```
2. Start Redis:
   ```bash
   brew services start redis
   ```
3. Test Redis:
   ```bash
   redis-cli ping
   ```

### For Linux (Ubuntu/Debian):

1. Update packages:
   ```bash
   sudo apt update
   ```
2. Install Redis:
   ```bash
   sudo apt install redis-server
   ```
3. Start Redis:
   ```bash
   sudo systemctl start redis-server
   ```
4. Enable Redis on startup:
   ```bash
   sudo systemctl enable redis-server
   ```
5. Test Redis:
   ```bash
   redis-cli ping
   ```

## Step 2: Verify Redis is Running

Open a terminal and run:
```bash
redis-cli ping
```

If it returns `PONG`, Redis is running correctly!

## Step 3: Redis Configuration (Optional)

Redis default configuration is fine for development. For production, you may want to:
- Set password authentication
- Configure memory limits
- Set up persistence

For now, default settings are sufficient.

## Step 4: Install Redis Client in Node.js Project

Navigate to your backend folder and install the Redis client:
```bash
cd backend
npm install redis
```

## Step 5: Environment Variables

Add Redis configuration to your `.env` file:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password (development)
```

## Step 6: Test Redis Connection

We'll create a test file to verify Redis connection works.

---

**Next Steps:**
After completing this setup, we'll implement:
1. Redis client utility
2. Guest Houses caching
3. Booking availability caching
4. Admin dashboard statistics caching

