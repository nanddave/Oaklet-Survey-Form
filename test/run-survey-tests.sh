#!/bin/bash

# Survey Form Test Runner
# @copyright (c) 2025 Oaklet
# 
# Comprehensive test runner for Survey Form system
# Runs E2E tests, backend tests, and integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
SURVEY_API_URL=${SURVEY_API_URL:-"http://localhost:3002"}
NEST_API_URL=${NEST_API_URL:-"http://localhost:3001"}
TEST_TIMEOUT=${TEST_TIMEOUT:-60}

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}     SURVEY FORM TEST SUITE${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Survey API URL: ${YELLOW}$SURVEY_API_URL${NC}"
echo -e "Nest API URL: ${YELLOW}$NEST_API_URL${NC}"
echo -e "Test Timeout: ${YELLOW}${TEST_TIMEOUT}s${NC}"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -e "Checking ${name}..."
    if curl -s --max-time 5 "${url}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${name} is running${NC}"
        return 0
    else
        echo -e "${RED}✗ ${name} is not running at ${url}${NC}"
        return 1
    fi
}

# Function to run a test
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${BLUE}Running ${test_name}...${NC}"
    
    # Use gtimeout if available (brew install coreutils), otherwise run without timeout
    if command -v gtimeout &> /dev/null; then
        if gtimeout $TEST_TIMEOUT npx ts-node "$test_file"; then
            echo -e "${GREEN}✓ ${test_name} passed${NC}"
            return 0
        else
            echo -e "${RED}✗ ${test_name} failed${NC}"
            return 1
        fi
    else
        if npx ts-node "$test_file"; then
            echo -e "${GREEN}✓ ${test_name} passed${NC}"
            return 0
        else
            echo -e "${RED}✗ ${test_name} failed${NC}"
            return 1
        fi
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in Survey Form directory${NC}"
    echo "Please run this script from the Survey Form root directory"
    exit 1
fi

# Check if test directory exists
if [ ! -d "test" ]; then
    echo -e "${RED}Error: Test directory not found${NC}"
    exit 1
fi

# Parse command line arguments
TEST_TYPE="all"
VERBOSE=false
COVERAGE=false
PARALLEL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TEST_TYPE="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --type TYPE     Run specific test type (e2e, backend, integration, all)"
            echo "  --verbose       Enable verbose output"
            echo "  --coverage      Generate coverage report"
            echo "  --parallel      Run tests in parallel (where possible)"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Run all tests"
            echo "  $0 --type e2e              # Run only E2E tests"
            echo "  $0 --type backend --verbose # Run backend tests with verbose output"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Set environment variables for tests
export SURVEY_API_URL
export NEST_API_URL

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Check if TypeScript is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not available${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if services are running
SERVICES_OK=true

if ! check_service "$SURVEY_API_URL" "Survey Form API"; then
    SERVICES_OK=false
fi

if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "integration" ]; then
    if ! check_service "$NEST_API_URL" "Oaklet-Nest API"; then
        SERVICES_OK=false
    fi
fi

if [ "$SERVICES_OK" = false ]; then
    echo -e "${RED}Error: Required services are not running${NC}"
    echo "Please start the required services before running tests"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to update test results
update_results() {
    local result=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $result -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Run tests based on type
case $TEST_TYPE in
    "e2e"|"all")
        echo -e "${BLUE}=====================================${NC}"
        echo -e "${BLUE}     E2E TESTS${NC}"
        echo -e "${BLUE}=====================================${NC}"
        
        run_test "test/survey-form.test.ts" "Survey Form E2E Tests"
        update_results $?
        ;;
esac

case $TEST_TYPE in
    "backend"|"all")
        echo -e "${BLUE}=====================================${NC}"
        echo -e "${BLUE}     BACKEND TESTS${NC}"
        echo -e "${BLUE}=====================================${NC}"
        
        run_test "test/survey-backend.test.ts" "Survey Backend Tests"
        update_results $?
        ;;
esac

case $TEST_TYPE in
    "integration"|"all")
        echo -e "${BLUE}=====================================${NC}"
        echo -e "${BLUE}     INTEGRATION TESTS${NC}"
        echo -e "${BLUE}=====================================${NC}"
        
        run_test "test/survey-integration.test.ts" "Survey Integration Tests"
        update_results $?
        ;;
esac

# Generate coverage report if requested
if [ "$COVERAGE" = true ]; then
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}     COVERAGE REPORT${NC}"
    echo -e "${BLUE}=====================================${NC}"
    
    # Note: This would require additional setup for coverage tools
    echo -e "${YELLOW}Coverage reporting not yet implemented${NC}"
    echo "To implement coverage:"
    echo "1. Install nyc or c8"
    echo "2. Configure coverage settings"
    echo "3. Run tests with coverage instrumentation"
fi

# Final results
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}     FINAL RESULTS${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo -e "${GREEN}Survey Form system is working correctly${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed${NC}"
    echo ""
    echo -e "${RED}Please review the failed tests and fix any issues${NC}"
    exit 1
fi
