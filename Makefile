# Notification Testing Makefile
# Provides convenient commands for testing the notification system

.PHONY: help check seed cleanup weekly daily tracking all

# Default target
help:
	@echo "🔔 Notification Testing Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make check       - Check if development server is running"
	@echo "  make seed        - Seed test data (courses, assignments, study plans)"
	@echo "  make cleanup     - Clean up all test data"
	@echo ""
	@echo "  make weekly      - Send weekly summary test email"
	@echo "  make daily       - Send daily study plan test email"
	@echo "  make tracking    - Send tracking reminder test email"
	@echo ""
	@echo "  make all         - Run all notification tests"
	@echo "  make help        - Show this help message"
	@echo ""
	@echo "Note: Make sure the development server is running (npm run dev)"
	@echo "Test emails will be sent to: citopuc@gmail.com"

# Check server status
check:
	@./test-notifications.sh check

# Seed test data
seed:
	@./test-notifications.sh seed

# Clean up test data
cleanup:
	@./test-notifications.sh cleanup

# Test individual notifications
weekly:
	@./test-notifications.sh weekly

daily:
	@./test-notifications.sh daily

tracking:
	@./test-notifications.sh tracking

# Run all tests
all:
	@./test-notifications.sh all
