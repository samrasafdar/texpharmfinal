#!/bin/bash
echo "================================================"
echo " Tex-Pharm Backend - Starting..."
echo "================================================"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (first time only)..."
    npm install
fi

echo ""
echo "Creating/checking admin account..."
node seedAdmin.js

echo ""
echo "Starting server on http://localhost:5000 ..."
node server.js
