#!/bin/bash
#
# Merges coverage reports from cypress and jest tests
# and generates an HTML report to view and a merged json report for Codecov.
# Upload to Codecov is handled separately via codecov/codecov-action in GitHub Actions.
#
# For jest coverage to be collected correctly
#  * Ensure the *coverageDirectory* is set to "coverage-jest" in packages.json
#  * Ensure there is a npm "test" script
#
# For cypress collection to work correctly
#  * Ensure "babel" (and dependencies) are at the latest (possible) version (aligned with frontend-components preferably)
#  * Ensure that babel-loader plugin is configured correctly for webpack (see this apps cypress.webpack.config.js)
#  * Ensure the babel "istanbul" plugin is included and configured in babel.config.js
#  * Ensure "nyc" is configuerd to output to "coverage-cypress"
#  * Ensure there is a npm "test:ct" script
#
set -e

echo "Initiating coverage collection process"
echo ""

JEST_COMMAND="${JEST_COMMAND:-"npm run test"}"
JEST_CONFIG="${JEST_CONFIG:-"jest.config.js"}"

CYPRESS_COMMAND="${CYPRESS_COMMAND:-"npm run test:ct"}"
CYPRESS_CONFIG="${CYPRESS_CONFIG:-"cypress.config.js"}"

echo "Removing old reports."

rm -rf ./nyc_output
rm -rf ./coverage-jest
rm -rf ./coverage-cypress
rm -rf ./coverage

mkdir -p coverage/src

jest_pkg_config=$(
	grep -q -e '"jest": {' package.json
	echo $?
)

if [ "$jest_pkg_config" -eq 0 ] || [ -f "$JEST_CONFIG" ] || [ -f jest.config.mjs ] || [ -f .jest.config.js ] || [ -f .jest.config.mjs ] || [ -f jest.config.ts ] || [ -f jest.config.cjs ]; then
	HAS_JEST="${HAS_JEST:-"true"}"
fi

if [ "$HAS_JEST" = "true" ]; then
	echo "Running Jest tests with: ${JEST_COMMAND}"

	$JEST_COMMAND
	cp ./coverage-jest/coverage-final.json ./coverage/src/jest.json
else
	echo "No jest config found!"
fi

if [ -f "$CYPRESS_CONFIG" ]; then
	echo "Running Cypress tests with: ${CYPRESS_COMMAND}"

	$CYPRESS_COMMAND
	cp ./coverage-cypress/coverage-final.json ./coverage/src/cypress.json
else
	echo "No cypress config found!"
fi

npx nyc merge ./coverage/src ./coverage/coverage-final.json
npx nyc report -t ./coverage --reporter html --report-dir ./coverage/html

echo "Coverage reports generated: ./coverage/coverage-final.json (merged)"

if [ -n "${GITHUB_ACTIONS}" ]; then
	echo "To upload coverage to Codecov, add codecov/codecov-action to your GitHub Actions workflow."
fi
