#!/bin/bash

# Toasté Bike Polo Container Management Script
# Usage: ./manage.sh [start|stop|restart|status|logs|clean]

PROJECT_NAME="toaste"
COMPOSE_FILE="docker-compose.yml"

# Safety check: Ensure we're only working with Toasté containers
echo "🔒 Safety check: Verifying Toasté project isolation..."
EXISTING_TOASTE_CONTAINERS=$(docker ps -a --filter "name=toaste-" --format "{{.Names}}" | wc -l)
OTHER_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -v "toaste-" | wc -l)
echo "ℹ️  $OTHER_CONTAINERS other container(s) running - these will NOT be affected"

case "$1" in
    start)
        echo "🚀 Starting Toasté Bike Polo services..."
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "🛑 Stopping Toasté Bike Polo services..."
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE down
        ;;
    restart)
        echo "🔄 Restarting Toasté Bike Polo services..."
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE restart
        ;;
    status)
        echo "📊 Toasté Bike Polo services status:"
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE ps
        echo ""
        echo "🔍 All containers with 'toaste' in name:"
        docker ps --filter "name=toaste" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    logs)
        echo "📋 Toasté Bike Polo services logs:"
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f
        ;;
    clean)
        echo "🧹 Cleaning up Toasté Bike Polo resources..."
        echo "⚠️  This will remove ALL Toasté containers, volumes, and images"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [ "$confirm" = "yes" ]; then
            docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE down -v --rmi all
            docker system prune -f --filter "label=com.toaste.project=toaste"
            echo "✅ Toasté resources cleaned up"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all Toasté services"
        echo "  stop    - Stop all Toasté services"
        echo "  restart - Restart all Toasté services"
        echo "  status  - Show status of Toasté services"
        echo "  logs    - Show logs from all Toasté services"
        echo "  clean   - Remove all Toasté containers, volumes, and images"
        exit 1
        ;;
esac
