#!/bin/bash
cd "$(dirname "$0")"
echo "Starting frontend debug script..." > debug.log
echo "Current directory: $(pwd)" >> debug.log
echo "Node version: $(node --version)" >> debug.log
echo "NPM version: $(npm --version)" >> debug.log
echo "Starting npm run dev..." >> debug.log
npm run dev >> debug.log 2>&1 &
echo "Frontend started with PID: $!" >> debug.log
echo "Frontend debug script completed" >> debug.log
