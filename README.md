# Regex Find Extension

A Chrome browser extension that provides regex-based search functionality for web pages, similar to the built-in find (Ctrl+F) but with the power of regular expressions.

## Features

- **Keyboard shortcut**: `Ctrl+Shift+F` to activate
- **Intuitive for non-regex users**: Automatically prevents matches from crossing newlines unless explicitly specified
- **Visual highlighting**: Current match is highlighted differently from other matches
- **Navigation**: Use Enter (next) or Shift+Enter (previous) to navigate matches
- **Error handling**: Shows helpful message for invalid regex patterns
- **Clean interface**: Positioned in top-right corner, easy to close with Esc

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the extension folder
5. The extension is now installed and ready to use!

## Usage

1. Navigate to any web page
2. Press `Ctrl+Shift+F` to open the regex search box
3. Enter your regex pattern in the input field
4. Use the navigation buttons or keyboard shortcuts to move between matches:
   - **Enter**: Go to next match
   - **Shift+Enter**: Go to previous match
   - **Esc**: Close the search box

## Example Patterns

- `\d+` - Find all numbers
- `[a-z]+@[a-z]+` - Find email-like patterns  
- `TODO.*` - Find TODO comments
- `function \w+` - Find function declarations
- `https?://\S+` - Find URLs
- `\$\d+\.\d{2}` - Find prices (e.g., $19.99)

## For Non-Regex Users

The extension is designed to be intuitive even if you're not familiar with regular expressions:

- Matches automatically stop at line breaks for easier reading
- The search box provides helpful tips
- Common patterns are shown in the popup for reference
- Invalid patterns show clear error messages

## Technical Details

- Built for Chrome Manifest V3
- Uses content scripts to search and highlight text
- Preserves original page structure when removing highlights
- Handles edge cases like script tags and existing highlights

## Development and Testing

### Running Tests

The extension includes a comprehensive test suite covering:

- Core functionality (search, highlighting, navigation)
- Edge cases (special characters, nested HTML, large documents)
- Performance testing
- Integration testing with realistic web page scenarios
- Error handling and validation

To run the tests:

```bash
# Install dependencies and run all tests
./run-tests.js

# Or manually:
npm install
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories

1. **Unit Tests** (`regexFind.test.js`):
   - Core RegexFind class functionality
   - Pattern processing and validation
   - UI creation and interaction
   - Navigation and highlighting

2. **Edge Cases** (`edgeCases.test.js`):
   - Special characters and Unicode
   - Nested HTML structures
   - Performance with large documents
   - Memory management
   - Error handling

3. **Integration Tests** (`integration.test.js`):
   - Complete user workflows
   - Real-world usage scenarios
   - CSS styling verification
   - Cross-browser compatibility scenarios

### Example Test Cases

The tests cover real-world patterns like:
- Finding email addresses: `\w+@\w+\.\w+`
- Phone numbers: `\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}`
- URLs: `https?://[\w.-]+`
- Prices: `\$\d+\.\d{2}`
- Code comments: `(TODO|FIXME|NOTE):`
- The NOT operator: `/ Imp [^VMB]`
