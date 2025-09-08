#!/bin/bash

# Lootamo Backend with Cloudflare Tunnel
echo "🚀 Starting Lootamo Backend with Cloudflare Tunnel..."

# Start backend in background
echo "📡 Starting backend server..."
python run.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start cloudflared tunnel
echo "🌐 Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8000 &
TUNNEL_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $TUNNEL_PID 2>/dev/null
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

echo "✅ Services started!"
echo "📍 Backend: http://localhost:8000"
echo "🌐 Cloudflare tunnel will show the public URL above"
echo "📖 API docs will be available at: https://YOUR_TUNNEL_URL/docs"
echo ""
echo "⏹️  Press Ctrl+C to stop all services"

# Wait for user to stop
wait
