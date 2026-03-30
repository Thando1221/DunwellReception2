#!/bin/bash
# Start backend
cd backend && node server.js &
BACKEND_PID=$!

# Return to root and start frontend dev server
cd /home/runner/workspace
npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
