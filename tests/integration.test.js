/**
 * Integration tests for the Regex Find extension
 * These tests simulate real-world usage scenarios
 */

// Import the RegexFind class
const RegexFind = require('../content.js');
const fs = require('fs');
const path = require('path');

// Read styles for testing
const styles = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');

describe('Regex Find Integration Tests', () => {
  let regexFind;

  beforeEach(() => {
    // Create a realistic webpage structure
    document.head.innerHTML = `<style>${styles}</style>`;
    document.body.innerHTML = `
      <header>
        <h1>Sample Website</h1>
        <nav>
          <a href="/home">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      
      <main>
        <article>
          <h2>Article Title</h2>
          <p>This is a sample article with various content types:</p>
          <ul>
            <li>Phone numbers: (555) 123-4567, 1-800-555-0199</li>
            <li>Email addresses: user@example.com, admin@site.org</li>
            <li>URLs: https://example.com, http://test.site.com</li>
            <li>Prices: $19.99, $100.00, $5.50</li>
          </ul>
          
          <h3>Code Examples</h3>
          <pre><code>
function calculateTotal(price, tax) {
  return price * (1 + tax);
}

// TODO: Add error handling
// FIXME: Handle edge cases
// NOTE: This needs optimization
          </code></pre>
          
          <h3>Data Section</h3>
          <table>
            <tr><td>ID</td><td>Name</td><td>Value</td></tr>
            <tr><td>001</td><td>Alpha</td><td>123.45</td></tr>
            <tr><td>002</td><td>Beta</td><td>678.90</td></tr>
            <tr><td>003</td><td>Gamma</td><td>999.99</td></tr>
          </table>
          
          <p>Some special cases to test:</p>
          <div>/ Imp V should not match this pattern</div>
          <div>/ Imp X should match this pattern</div>
          <div>/ Imp M should not match this pattern</div>
          <div>/ Imp A should match this pattern</div>
        </article>
      </main>
      
      <footer>
        <p>&copy; 2025 Test Site. All rights reserved.</p>
        <p>Contact: support@testsite.com | Phone: (555) 987-6543</p>
      </footer>
    `;

    regexFind = new RegexFind();
  });

  describe('Real-world Usage Scenarios', () => {
    test('Finding all email addresses on a page', () => {
      regexFind.show();
      regexFind.search('\\w+@\\w+\\.\\w+');
      
      expect(regexFind.currentMatches.length).toBe(3);
      
      // Verify the matches are correct
      const matchTexts = regexFind.currentMatches.map(m => m.textContent);
      expect(matchTexts).toContain('user@example.com');
      expect(matchTexts).toContain('admin@site.org');
      expect(matchTexts).toContain('support@testsite.com');
    });

    test('Finding all phone numbers', () => {
      regexFind.show();
      regexFind.search('\\(?\\d{3}\\)?[\\s-]?\\d{3}[\\s-]?\\d{4}');
      
      expect(regexFind.currentMatches.length).toBe(3);
    });

    test('Finding all URLs', () => {
      regexFind.show();
      regexFind.search('https?://[\\w.-]+');
      
      expect(regexFind.currentMatches.length).toBe(2);
      
      const matchTexts = regexFind.currentMatches.map(m => m.textContent);
      expect(matchTexts).toContain('https://example.com');
      expect(matchTexts).toContain('http://test.site.com');
    });

    test('Finding all prices', () => {
      regexFind.show();
      regexFind.search('\\$\\d+\\.\\d{2}');
      
      expect(regexFind.currentMatches.length).toBe(3); // Fixed expectation to match actual content
    });

    test('Finding TODO comments in code', () => {
      regexFind.show();
      regexFind.search('(TODO|FIXME|NOTE):');
      
      expect(regexFind.currentMatches.length).toBe(3);
    });

    test('Finding specific pattern with NOT operator', () => {
      regexFind.show();
      regexFind.search('/ Imp [^VM]');
      
      expect(regexFind.currentMatches.length).toBe(2); // X and A should match
      
      const matchTexts = regexFind.currentMatches.map(m => m.textContent);
      matchTexts.forEach(text => {
        expect(text).toMatch(/\/ Imp [^VM]/);
      });
    });

    test('Finding words with boundary constraints', () => {
      regexFind.show();
      regexFind.search('function\\b');
      
      // Should find "function" as complete words, not parts of other words
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent.toLowerCase()).toBe('function');
      });
    });

    test('Finding patterns at end of lines', () => {
      regexFind.show();
      regexFind.search('\\.$');
      
      // Should find periods at end of lines
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent).toBe('.');
      });
    });

    test('Finding words followed by specific punctuation', () => {
      regexFind.show();
      regexFind.search('\\w+[.,!]');
      
      // Should find words followed by punctuation
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent).toMatch(/\w+[.,!]/);
      });
    });
  });

  describe('User Interaction Flow', () => {
    test('Complete search workflow', () => {
      // 1. User opens search with keyboard shortcut
      const openEvent = new KeyboardEvent('keydown', {
        key: 'F',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      document.dispatchEvent(openEvent);
      
      expect(regexFind.isActive).toBe(true);
      expect(document.querySelector('.regex-find-container')).toBeInTheDocument();
      
      // 2. User types a pattern
      const input = document.querySelector('.regex-input');
      input.value = '\\d+';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      // 3. User navigates through matches
      const initialIndex = regexFind.currentIndex;
      regexFind.nextMatch();
      expect(regexFind.currentIndex).toBe((initialIndex + 1) % regexFind.currentMatches.length);
      
      // 4. User checks current match is highlighted
      const currentHighlight = document.querySelector('.regex-highlight-current');
      expect(currentHighlight).toBeInTheDocument();
      
      // 5. User closes search
      const closeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(closeEvent);
      
      expect(regexFind.isActive).toBe(false);
      expect(document.querySelectorAll('.regex-highlight').length).toBe(0);
    });

    test('Help system interaction', () => {
      regexFind.show();
      
      const helpBtn = document.querySelector('.help-btn');
      const examplesDiv = document.querySelector('.regex-examples');
      
      // Initially hidden
      expect(examplesDiv.style.display).toBe('none');
      
      // Click to show
      helpBtn.click();
      expect(examplesDiv.style.display).toBe('block');
      expect(helpBtn.textContent).toBe('×');
      
      // Click to hide
      helpBtn.click();
      expect(examplesDiv.style.display).toBe('none');
      expect(helpBtn.textContent).toBe('?');
    });

    test('Navigation with buttons', () => {
      regexFind.show();
      regexFind.search('\\d+');
      
      const nextBtn = document.querySelector('.next-btn');
      const prevBtn = document.querySelector('.prev-btn');
      
      const initialIndex = regexFind.currentIndex;
      
      // Test next button
      nextBtn.click();
      expect(regexFind.currentIndex).toBe((initialIndex + 1) % regexFind.currentMatches.length);
      
      // Test previous button
      prevBtn.click();
      expect(regexFind.currentIndex).toBe(initialIndex);
    });
  });

  describe('Error Scenarios', () => {
    test('Graceful handling of invalid patterns during typing', () => {
      regexFind.show();
      const input = document.querySelector('.regex-input');
      
      // Type an incomplete pattern
      input.value = '[incomplete';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      const resultInfo = document.querySelector('.match-count');
      expect(resultInfo.textContent).toContain('Invalid regex pattern');
      expect(regexFind.currentMatches.length).toBe(0);
      
      // Complete the pattern
      input.value = '[abc]';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Should work now (even if no matches)
      expect(resultInfo.style.color).not.toBe('#ff6b6b');
    });

    test('Handling search in modified DOM', () => {
      regexFind.show();
      regexFind.search('test');
      
      // Simulate DOM modification (common in SPAs)
      const newElement = document.createElement('div');
      newElement.textContent = 'New test content added dynamically';
      document.body.appendChild(newElement);
      
      // Search again - should handle the new content
      regexFind.search('test');
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
    });
  });

  describe('CSS and Styling', () => {
    test('Search box should have proper styling applied', () => {
      regexFind.show();
      
      const container = document.querySelector('.regex-find-container');
      const box = document.querySelector('.regex-find-box');
      const input = document.querySelector('.regex-input');
      
      // Check that elements exist and can receive styles
      expect(container).toBeInTheDocument();
      expect(box).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      
      // Verify CSS classes are applied
      expect(container.className).toBe('regex-find-container');
      expect(box.className).toBe('regex-find-box');
      expect(input.className).toBe('regex-input');
    });

    test('Highlights should have proper styling', () => {
      regexFind.show();
      regexFind.search('test');
      
      const highlights = document.querySelectorAll('.regex-highlight');
      expect(highlights.length).toBeGreaterThan(0);
      
      // Current highlight should have additional class
      const currentHighlight = document.querySelector('.regex-highlight-current');
      if (currentHighlight) {
        expect(currentHighlight.classList.contains('regex-highlight')).toBe(true);
        expect(currentHighlight.classList.contains('regex-highlight-current')).toBe(true);
      }
    });
  });
});
