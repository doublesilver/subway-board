#!/bin/bash

echo "Starting deployment..."

# Run migrations
echo "Running database migrations..."
npm run migrate

# Check if migration succeeded
if [ $? -eq 0 ]; then
    echo "Migration successful, starting server..."
else
    echo "Migration failed, but starting server anyway..."
fi

# Start the server
npm start
