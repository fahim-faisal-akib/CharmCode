#!/bin/bash
set -e

echo ""
echo "  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗ ██████╗ ███████╗"
echo " ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝"
echo " ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ██║█████╗  "
echo " ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║  ██║██╔══╝  "
echo " ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗╚██████╔╝██████╔╝███████╗"
echo "  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═════╝╚══════╝"
echo ""
echo "  AI Coding Agent — OpenRouter Edition"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  ✗ Node.js not found. Install it from https://nodejs.org"
  exit 1
fi

echo "  ✓ Node.js $(node -v)"

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo ""
  echo "  Installing backend dependencies..."
  cd backend && npm install --silent && cd ..
  echo "  ✓ Backend dependencies installed"
fi

if [ ! -d "frontend/node_modules" ]; then
  echo ""
  echo "  Installing frontend dependencies..."
  cd frontend && npm install --silent && cd ..
  echo "  ✓ Frontend dependencies installed"
fi

echo ""
echo "  Starting OpenCode..."
echo "  Backend  → http://localhost:3001"
echo "  Frontend → http://localhost:3000"
echo ""
echo "  Open http://localhost:3000 in your browser"
echo "  Press Ctrl+C to stop"
echo ""

# Start backend in background
cd backend && npm start &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend
cd ../frontend && npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
