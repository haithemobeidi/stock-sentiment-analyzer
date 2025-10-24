#!/bin/bash

echo "=========================================="
echo "Stock Sentiment Analyzer"
echo "=========================================="
echo ""

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time setup)..."
    npm run install:all
    echo ""
fi

echo "🚀 Starting servers..."
echo ""
echo "Backend will be available at: http://localhost:5000"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=========================================="
echo ""

npm start
