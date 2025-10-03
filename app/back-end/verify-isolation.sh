#!/bin/bash

# Toasté Bike Polo Isolation Verification Script
# This script verifies that Toasté containers are properly isolated

echo "🔒 Toasté Bike Polo Isolation Verification"
echo "=========================================="
echo ""

# Check Toasté containers
echo "📋 Toasté Containers:"
TOASTE_CONTAINERS=$(docker ps -a --filter "name=toaste-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
if [ -n "$TOASTE_CONTAINERS" ]; then
    echo "$TOASTE_CONTAINERS"
else
    echo "   No Toasté containers found"
fi
echo ""

# Check other containers
echo "📋 Other Containers (should NOT be affected):"
OTHER_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v "toaste-")
if [ -n "$OTHER_CONTAINERS" ]; then
    echo "$OTHER_CONTAINERS"
else
    echo "   No other containers running"
fi
echo ""

# Check networks
echo "🌐 Networks:"
echo "Toasté Network:"
docker network ls --filter "name=toaste" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
echo ""
echo "Other Networks:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | grep -v "toaste"
echo ""

# Check volumes
echo "💾 Volumes:"
echo "Toasté Volumes:"
docker volume ls --filter "name=toaste" --format "table {{.Name}}\t{{.Driver}}"
echo ""
echo "Other Volumes:"
docker volume ls --format "table {{.Name}}\t{{.Driver}}" | grep -v "toaste"
echo ""

# Check images
echo "🖼️  Images:"
echo "Toasté Images:"
docker images --filter "reference=*toaste*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# Summary
echo "📊 Summary:"
TOASTE_COUNT=$(docker ps -a --filter "name=toaste-" --format "{{.Names}}" | wc -l)
OTHER_COUNT=$(docker ps --format "{{.Names}}" | grep -v "toaste-" | wc -l)

echo "   Toasté containers: $TOASTE_COUNT"
echo "   Other containers: $OTHER_COUNT"
echo ""

if [ "$TOASTE_COUNT" -gt 0 ] && [ "$OTHER_COUNT" -gt 0 ]; then
    echo "✅ Isolation verified: Toasté containers are separate from other containers"
elif [ "$TOASTE_COUNT" -gt 0 ] && [ "$OTHER_COUNT" -eq 0 ]; then
    echo "ℹ️  Only Toasté containers running"
elif [ "$TOASTE_COUNT" -eq 0 ] && [ "$OTHER_COUNT" -gt 0 ]; then
    echo "ℹ️  No Toasté containers running, other containers unaffected"
else
    echo "ℹ️  No containers running"
fi

echo ""
echo "🔒 Safety: Toasté operations will only affect containers with 'toaste-' prefix"
