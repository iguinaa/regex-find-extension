// Import the RegexFind class
const RegexFind = require('../content.js');

describe('RegexFind Edge Cases and Performance', () => {
  let regexFind;

  beforeEach(() => {
    regexFind = new RegexFind();
  });

  describe('Edge Cases', () => {
    test('should handle special characters in text', () => {
      document.body.innerHTML = `
        <div>Special chars: !@#$%^&*()_+-=[]{}|;':",./<>?</div>
        <div>Unicode: café, naïve, résumé</div>
        <div>Newlines and\ntabs\there</div>
      `;

      regexFind.show();
      regexFind.search('\\$');
      
      expect(regexFind.currentMatches.length).toBe(1);
    });

    test('should handle nested HTML elements', () => {
      document.body.innerHTML = `
        <div>
          <p>Outer <span>inner <em>deeply nested</em> text</span> outer</p>
          <ul>
            <li>Item <strong>one</strong></li>
            <li>Item <em>two</em></li>
          </ul>
        </div>
      `;

      regexFind.show();
      regexFind.search('Item');
      
      expect(regexFind.currentMatches.length).toBe(2);
    });

    test('should skip script and style tags', () => {
      document.body.innerHTML = `
        <div>Visible text</div>
        <script>var hidden = "script content";</script>
        <style>.hidden { display: none; }</style>
        <div>More visible text</div>
      `;

      regexFind.show();
      regexFind.search('hidden');
      
      expect(regexFind.currentMatches.length).toBe(0);
    });

    test('should handle empty elements', () => {
      document.body.innerHTML = `
        <div></div>
        <p></p>
        <span>  </span>
        <div>actual content</div>
      `;

      regexFind.show();
      regexFind.search('content');
      
      expect(regexFind.currentMatches.length).toBe(1);
    });

    test('should handle very long text', () => {
      const longText = 'word '.repeat(1000) + 'target ' + 'word '.repeat(1000);
      document.body.innerHTML = `<div>${longText}</div>`;

      regexFind.show();
      regexFind.search('target');
      
      expect(regexFind.currentMatches.length).toBe(1);
    });

    test('should handle regex with capture groups', () => {
      document.body.innerHTML = `
        <div>Phone: (555) 123-4567</div>
        <div>Phone: (888) 999-0000</div>
      `;

      regexFind.show();
      regexFind.search('\\((\\d{3})\\) (\\d{3}-\\d{4})');
      
      expect(regexFind.currentMatches.length).toBe(2);
    });

    test('should handle overlapping matches correctly', () => {
      document.body.innerHTML = `<div>aaaa</div>`;

      regexFind.show();
      regexFind.search('aa');
      
      // Should find non-overlapping matches
      expect(regexFind.currentMatches.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      regexFind.show();
    });

    test('should handle malformed regex gracefully', () => {
      const malformedPatterns = [
        '[invalid',
        '(unclosed',
        '*invalid',
        '+invalid',
        '?invalid'
      ];

      malformedPatterns.forEach(pattern => {
        regexFind.search(pattern);
        expect(regexFind.currentMatches.length).toBe(0);
        
        const resultInfo = document.querySelector('.match-count');
        expect(resultInfo.textContent).toContain('Invalid regex pattern');
      });
    });

    test('should handle catastrophic backtracking patterns', () => {
      document.body.innerHTML = `<div>aaaaaaaaaaaaaaaaaaaaX</div>`;

      // This pattern could cause catastrophic backtracking
      const start = performance.now();
      regexFind.search('(a+)+b');
      const end = performance.now();
      
      // Should complete quickly (under 100ms) due to error handling
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('Performance', () => {
    test('should handle large documents efficiently', () => {
      // Create a large document
      const largeContent = Array.from({ length: 100 }, (_, i) => 
        `<p>Paragraph ${i} with some test content and numbers like ${i * 10}</p>`
      ).join('');
      
      document.body.innerHTML = `<div>${largeContent}</div>`;

      regexFind.show();
      
      const start = performance.now();
      regexFind.search('\\d+');
      const end = performance.now();
      
      // Should complete within reasonable time (under 50ms for this size)
      expect(end - start).toBeLessThan(50);
      expect(regexFind.currentMatches.length).toBe(200); // Fixed expectation - found paragraph numbers AND content numbers
    });

    test('should clear highlights efficiently', () => {
      // Create content with many matches
      const content = Array.from({ length: 50 }, (_, i) => 
        `<p>test ${i} test content test</p>`
      ).join('');
      
      document.body.innerHTML = `<div>${content}</div>`;

      regexFind.show();
      regexFind.search('test');
      
      const matchCount = regexFind.currentMatches.length;
      expect(matchCount).toBeGreaterThan(100);
      
      const start = performance.now();
      regexFind.clearHighlights();
      const end = performance.now();
      
      // Should clear quickly
      expect(end - start).toBeLessThan(20);
      expect(document.querySelectorAll('.regex-highlight').length).toBe(0);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory when repeatedly searching', () => {
      document.body.innerHTML = `
        <div>Some test content with various words and numbers 123</div>
      `;

      regexFind.show();
      
      // Perform many searches
      for (let i = 0; i < 100; i++) {
        regexFind.search(`test${i % 10}`);
        regexFind.clearHighlights();
      }
      
      // Should not accumulate matches or highlights
      expect(regexFind.currentMatches.length).toBe(0);
      expect(document.querySelectorAll('.regex-highlight').length).toBe(0);
    });

    test('should clean up properly when hidden', () => {
      document.body.innerHTML = `<div>test content</div>`;

      regexFind.show();
      regexFind.search('test');
      
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      regexFind.hide();
      
      expect(document.querySelectorAll('.regex-highlight').length).toBe(0);
      expect(regexFind.isActive).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('should maintain focus management', () => {
      regexFind.show();
      
      const input = document.querySelector('.regex-input');
      expect(document.activeElement).toBe(input);
      
      // Simulate tab navigation
      const nextBtn = document.querySelector('.next-btn');
      nextBtn.focus();
      expect(document.activeElement).toBe(nextBtn);
    });

    test('should provide proper ARIA attributes', () => {
      regexFind.show();
      
      const searchBox = document.querySelector('.regex-find-box');
      const input = document.querySelector('.regex-input');
      const buttons = document.querySelectorAll('.regex-btn');
      
      // Check that interactive elements have proper attributes
      expect(input).toBeInTheDocument();
      buttons.forEach(btn => {
        expect(btn.title).toBeTruthy();
      });
    });
  });
});
