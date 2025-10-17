#!/bin/bash

# Kill any stuck Netlify development processes
echo "🔍 Looking for stuck Netlify processes..."

# Kill processes on port 8889
PORT_PID=$(lsof -ti :8889)
if [ ! -z "$PORT_PID" ]; then
    echo "🛑 Killing process $PORT_PID on port 8889"
    kill $PORT_PID
    sleep 2
    # Force kill if still running
    if kill -0 $PORT_PID 2>/dev/null; then
        echo "💀 Force killing process $PORT_PID"
        kill -9 $PORT_PID
    fi
else
    echo "✅ No processes found on port 8889"
fi

# Kill any remaining netlify processes
NETLIFY_PIDS=$(ps aux | grep -i netlify | grep -v grep | awk '{print $2}')
if [ ! -z "$NETLIFY_PIDS" ]; then
    echo "🛑 Killing Netlify processes: $NETLIFY_PIDS"
    echo $NETLIFY_PIDS | xargs kill
else
    echo "✅ No Netlify processes found"
fi

echo "🧹 Cleanup complete!"
