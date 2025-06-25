#!/bin/bash

# Test Notifications Script
# This script provides one-off commands to test each notification type individually

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default server URL (change if running on different port)
SERVER_URL="http://localhost:3001"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to make API calls
call_api() {
    local type=$1
    local email_flag=$2

    if [ "$email_flag" = "true" ]; then
        local payload='{"type": "'$type'", "email": true}'
    else
        local payload='{"type": "'$type'"}'
    fi

    print_status "Sending $type notification request..."

    response=$(curl -s -X POST "$SERVER_URL/api/test/manual-notifications" \
        -H "Content-Type: application/json" \
        -d "$payload")

    if [ $? -eq 0 ]; then
        echo "$response" | jq . 2>/dev/null || echo "$response"
    else
        print_error "Failed to connect to server at $SERVER_URL"
    fi
}

# Function to check server status
check_server() {
    print_status "Checking server status..."
    response=$(curl -s "$SERVER_URL/api/test/manual-notifications" 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_success "Server is running at $SERVER_URL"
        return 0
    else
        print_error "Server is not running at $SERVER_URL"
        print_warning "Please start the server with: npm run dev"
        return 1
    fi
}

# Main command handler
case "$1" in
    "check")
        check_server
        ;;
    "seed")
        print_status "Seeding test data..."
        call_api "seed" "false"
        ;;
    "cleanup")
        print_status "Cleaning up test data..."
        call_api "cleanup" "false"
        ;;
    "weekly")
        print_status "Testing weekly summary notification..."
        call_api "weekly" "true"
        ;;
    "daily")
        print_status "Testing daily study plan notification..."
        call_api "daily" "true"
        ;;
    "tracking")
        print_status "Testing tracking reminder notification..."
        call_api "tracking" "true"
        ;;
    "weekly-db")
        print_status "Testing weekly summary (database only)..."
        call_api "weekly" "false"
        ;;
    "daily-db")
        print_status "Testing daily study plan (database only)..."
        call_api "daily" "false"
        ;;
    "tracking-db")
        print_status "Testing tracking reminder (database only)..."
        call_api "tracking" "false"
        ;;
    "all")
        print_status "Running all email tests..."
        echo ""

        print_status "1. Seeding test data..."
        call_api "seed" "false"
        echo ""

        print_status "2. Testing weekly summary email..."
        call_api "weekly" "true"
        echo ""

        print_status "3. Testing daily study plan email..."
        call_api "daily" "true"
        echo ""

        print_status "4. Testing tracking reminder email..."
        call_api "tracking" "true"
        echo ""

        print_success "All tests completed!"
        ;;
    "help"|"--help"|"-h"|"")
        echo "🔔 Notification Testing Script"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  check       Check if the development server is running"
        echo "  seed        Seed test data (courses, assignments, study plans)"
        echo "  cleanup     Clean up all test data"
        echo ""
        echo "  weekly      Send weekly summary test email to citopuc@gmail.com"
        echo "  daily       Send daily study plan test email to citopuc@gmail.com"
        echo "  tracking    Send tracking reminder test email to citopuc@gmail.com"
        echo ""
        echo "  weekly-db   Create weekly summary notifications in database only"
        echo "  daily-db    Create daily study plan notifications in database only"
        echo "  tracking-db Create tracking reminder notifications in database only"
        echo ""
        echo "  all         Run all email tests (seed + weekly + daily + tracking)"
        echo "  help        Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 check                    # Check server status"
        echo "  $0 seed                     # Create test data"
        echo "  $0 weekly                   # Send weekly summary email"
        echo "  $0 all                      # Run complete test suite"
        echo ""
        echo "Note: Make sure the development server is running (npm run dev)"
        echo "Test emails will be sent to: citopuc@gmail.com"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' to see available commands"
        exit 1
        ;;
esac
