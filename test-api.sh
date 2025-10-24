#!/bin/bash

echo "=========================================="
echo "Stock Sentiment Analyzer - API Test"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Testing health endpoint..."
curl -s http://localhost:5000/health | json_pp
echo ""
echo ""

# Test single stock analysis
echo "2. Analyzing NVDA stock..."
curl -s http://localhost:5000/api/stocks/NVDA/analyze | json_pp
echo ""
echo ""

# Test price endpoint
echo "3. Getting TSLA price data..."
curl -s http://localhost:5000/api/stocks/TSLA/price | json_pp
echo ""
echo ""

echo "=========================================="
echo "Test complete!"
echo "=========================================="
