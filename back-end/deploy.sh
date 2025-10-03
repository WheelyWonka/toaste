#!/bin/bash

# Exit on any error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# First, ensure we're in the script directory
cd "$SCRIPT_DIR"

# Function to show interactive service selection menu
show_service_menu() {
    # Get available services from docker-compose.yml (only from services section)
    AVAILABLE_SERVICES=$(awk '/^services:/{flag=1; next} /^[a-zA-Z]/ && !/^  /{flag=0} flag && /^  [a-zA-Z0-9_-]+:/{gsub(/[: ]/, "", $1); print $1}' docker-compose.yml | sort)
    
    # Create menu items array
    local menu_items=()
    menu_items+=("All Services (Full Deployment)")
    
    while IFS= read -r service; do
        menu_items+=("$service")
    done <<< "$AVAILABLE_SERVICES"
    
    local selected_items=()
    local current_line=0
    local total_lines=${#menu_items[@]}
    
    # Function to display menu
    display_menu() {
        clear
        echo "🚀 Toasté Bike Polo Deployment Manager"
        echo "======================================"
        echo ""
        echo "Navigate: ↑/↓  |  Toggle: →  |  Deploy: ENTER  |  Quit: q"
        echo ""
        
        for i in "${!menu_items[@]}"; do
            local prefix="  "
            local checkbox="[ ]"
            
            # Check if this item is selected
            for selected_index in "${selected_items[@]}"; do
                if [[ "$selected_index" == "$i" ]]; then
                    checkbox="[✓]"
                    break
                fi
            done
            
            # Highlight current line
            if [[ $i -eq $current_line ]]; then
                prefix="→ "
            fi
            
            echo "${prefix}${checkbox} ${menu_items[$i]}"
        done
        
        echo ""
        if [[ ${#selected_items[@]} -gt 0 ]]; then
            echo "Selected: ${#selected_items[@]} item(s)"
        else
            echo "No services selected"
        fi
    }
    
    # Interactive menu loop
    while true; do
        display_menu
        
        # Read single character
        read -rsn1 key
        
        case "$key" in
            $'\x1b') # Escape sequence (arrow keys)
                read -rsn2 key
                case "$key" in
                    '[A') # Up arrow
                        ((current_line > 0)) && ((current_line--))
                        ;;
                    '[B') # Down arrow
                        ((current_line < total_lines - 1)) && ((current_line++))
                        ;;
                    '[C') # Right arrow - toggle selection
                        # Check if current line is already selected
                        local found=false
                        local new_selected=()
                        
                        for item in "${selected_items[@]}"; do
                            if [[ "$item" == "$current_line" ]]; then
                                found=true
                            else
                                new_selected+=("$item")
                            fi
                        done
                        
                        if [[ "$found" == "false" ]]; then
                            # Add to selection
                            new_selected+=("$current_line")
                        fi
                        
                        selected_items=("${new_selected[@]}")
                        ;;
                    '[D') # Left arrow - also toggle (for convenience)
                        # Same logic as right arrow
                        local found=false
                        local new_selected=()
                        
                        for item in "${selected_items[@]}"; do
                            if [[ "$item" == "$current_line" ]]; then
                                found=true
                            else
                                new_selected+=("$item")
                            fi
                        done
                        
                        if [[ "$found" == "false" ]]; then
                            new_selected+=("$current_line")
                        fi
                        
                        selected_items=("${new_selected[@]}")
                        ;;
                esac
                ;;
            $'\n'|$'\r'|'') # Enter - confirm selection
                break
                ;;
            'q'|'Q') # Quit
                clear
                echo "❌ Deployment cancelled by user"
                exit 0
                ;;
        esac
    done
    
    # Process selections
    if [[ ${#selected_items[@]} -eq 0 ]]; then
        clear
        echo "❌ No services selected. Deployment cancelled."
        exit 0
    fi
    
    # Check if "All Services" is selected (index 0)
    local all_selected=false
    for index in "${selected_items[@]}"; do
        if [[ "$index" == "0" ]]; then
            all_selected=true
            break
        fi
    done
    
    if [[ "$all_selected" == "true" ]]; then
        FULL_DEPLOY=true
        SERVICES=""
        clear
        echo "✅ Selected: All Services (Full Deployment)"
    else
        FULL_DEPLOY=false
        local selected_services=""
        
        for index in "${selected_items[@]}"; do
            if [[ $index -gt 0 ]]; then  # Skip "All Services" option
                service_name="${menu_items[$index]}"
                selected_services="$selected_services $service_name"
            fi
        done
        
        SERVICES=$(echo "$selected_services" | xargs)  # Trim whitespace
        clear
        echo "✅ Selected services: $SERVICES"
    fi
    
    echo ""
    read -p "Press ENTER to continue with deployment or Ctrl+C to cancel..."
}

# Parse command line arguments for services
SERVICES=""
FULL_DEPLOY=true
INTERACTIVE_MODE=true

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --services)
            SERVICES="$2"
            FULL_DEPLOY=false
            INTERACTIVE_MODE=false
            shift 2
            ;;
        --all)
            FULL_DEPLOY=true
            INTERACTIVE_MODE=false
            shift
            ;;
        --help|-h)
            # Get available services dynamically from docker-compose.yml (only from services section)
            AVAILABLE_SERVICES=$(awk '/^services:/{flag=1; next} /^[a-zA-Z]/ && !/^  /{flag=0} flag && /^  [a-zA-Z0-9_-]+:/{gsub(/[: ]/, "", $1); print $1}' docker-compose.yml | sort | tr '\n' ' ')
            
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --services \"service1 service2\"  Deploy specific services (non-interactive)"
            echo "  --all                           Deploy all services (non-interactive)"
            echo "  --help, -h                      Show this help message"
            echo "  (no options)                    Interactive mode with service selection menu"
            echo ""
            echo "Available services (auto-detected from docker-compose.yml):"
            # Format services in columns for better readability
            echo "  $AVAILABLE_SERVICES" | fold -s -w 70 | sed 's/^/  /'
            echo ""
            echo "Examples:"
            echo "  $0                              # Interactive mode with menu"
            echo "  $0 --all                        # Deploy all services (full restart)"
            echo "  $0 --services \"api pocketbase\"  # Deploy only api and pocketbase"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show interactive menu if no arguments provided
if [[ "$INTERACTIVE_MODE" = true ]]; then
    show_service_menu
fi

# Validate services if selective deployment
if [ "$FULL_DEPLOY" = false ]; then
    # Get available services from docker-compose.yml (only from services section)
    AVAILABLE_SERVICES=$(awk '/^services:/{flag=1; next} /^[a-zA-Z]/ && !/^  /{flag=0} flag && /^  [a-zA-Z0-9_-]+:/{gsub(/[: ]/, "", $1); print $1}' docker-compose.yml)
    
    # Check if all specified services exist
    for service in $SERVICES; do
        if ! echo "$AVAILABLE_SERVICES" | grep -q "^$service$"; then
            echo "❌ Error: Service '$service' not found in docker-compose.yml"
            echo ""
            echo "Available services:"
            echo "$AVAILABLE_SERVICES" | sort | sed 's/^/  - /'
            exit 1
        fi
    done
    
    echo "🚀 Starting SELECTIVE deployment process for services: $SERVICES"
    echo "✅ All specified services found in docker-compose.yml"
else
    echo "🚀 Starting FULL deployment process (all services will be restarted)..."
fi

# Function to handle errors
handle_error() {
    echo "❌ Error occurred in deployment at line $1"
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if Toasté network exists
echo "🔍 Checking Toasté network..."
if ! docker network ls | grep -q "toaste-network"; then
    echo "⚠️  Toasté network not found. It will be created automatically."
else
    echo "✅ Toasté network found"
fi

# Safety check: Verify we're only working with Toasté containers
echo "🔒 Safety check: Verifying Toasté project isolation..."
EXISTING_TOASTE_CONTAINERS=$(docker ps -a --filter "name=toaste-" --format "{{.Names}}" | wc -l)
if [ "$EXISTING_TOASTE_CONTAINERS" -gt 0 ]; then
    echo "✅ Found $EXISTING_TOASTE_CONTAINERS existing Toasté container(s)"
    echo "   These will be safely managed by this deployment"
else
    echo "ℹ️  No existing Toasté containers found (first deployment)"
fi

# Show what other containers are running (for transparency)
OTHER_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -v "toaste-" | wc -l)
if [ "$OTHER_CONTAINERS" -gt 0 ]; then
    echo "ℹ️  $OTHER_CONTAINERS other container(s) running - these will NOT be affected"
fi

# Deploy services
if [ "$FULL_DEPLOY" = true ]; then
    echo "🛑 Stopping existing Toasté containers..."
    # Only stop containers with 'toaste' in the name to avoid affecting other projects
    docker-compose -p toaste down --remove-orphans || true
    
    echo "🔨 Building and starting all Toasté services..."
    docker-compose -p toaste up -d --build
else
    echo "🛑 Stopping selected Toasté services: $SERVICES"
    # Only stop specific Toasté services
    docker-compose -p toaste stop $SERVICES || true
    
    echo "🔨 Building and starting selected Toasté services: $SERVICES"
    docker-compose -p toaste up -d --build $SERVICES
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -p toaste ps

# Test API health
echo "🏥 Testing API health..."
sleep 5
curl -f http://localhost:3001/health || echo "❌ API health check failed"

# Function to extract and display service URLs from docker-compose.yml
show_service_urls() {
    echo "🌐 Your Toasté services are available at:"
    echo "   International (.com):"
    echo "   - API: https://api.toastebikepolo.com"
    echo "   - PocketBase Admin: https://api.toastebikepolo.com/pb/_/"
    echo ""
    echo "   Canadian (.ca):"
    echo "   - API: https://api.toastebikepolo.ca"
    echo "   - PocketBase Admin: https://api.toastebikepolo.ca/pb/_/"
    echo "   - Local API: http://localhost:3001"
    echo "   - Local PocketBase: http://localhost:8091"
    echo ""
    echo "📋 Management commands:"
    echo "   - View logs: docker-compose -p toaste logs -f"
    echo "   - Check status: docker-compose -p toaste ps"
    echo "   - Stop services: docker-compose -p toaste down"
    echo "   - Restart: docker-compose -p toaste restart"
    echo ""
    echo "🔧 Cloudflare Tunnel:"
    echo "   - Container: toaste-cloudflared"
    echo "   - Logs: docker-compose -p toaste logs cloudflared"
    echo "   - Status: Check Cloudflare dashboard"
}

echo "✅ Deployment completed successfully!"
echo ""
show_service_urls
