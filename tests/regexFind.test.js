// Import the RegexFind class
const RegexFind = require('../content.js');

describe('RegexFind Extension', () => {
  let regexFind;
  let testPage;

  beforeEach(() => {
    // Create a test page with sample content
    document.body.innerHTML = `
      <div id="test-content">
        <h1>Test Page for Regex Find</h1>
        <p>This is a test paragraph with some numbers: 123, 456, and 789.</p>
        <p>Here's an email: test@example.com and another one: user@domain.org</p>
        <div>
          <span>Some TODO items need attention</span>
          <p>TODO: Fix the bug in line 42</p>
          <p>DONE: Complete the feature</p>
        </div>
        <p>Prices: $19.99, $5.00, and $100.50</p>
        <p>/ Imp V should not match</p>
        <p>/ Imp X should match</p>
        <p>/ Imp M should not match</p>
        <p>/ Imp B should not match</p>
        <p>/ Imp Z should match</p>
      </div>
    `;

    regexFind = new RegexFind();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(regexFind.isActive).toBe(false);
      expect(regexFind.currentMatches).toEqual([]);
      expect(regexFind.currentIndex).toBe(-1);
      expect(regexFind.searchBox).toBe(null);
    });

    test('should add keyboard event listeners', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'F',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });

      document.dispatchEvent(keydownEvent);
      expect(regexFind.isActive).toBe(true);
    });
  });

  describe('UI Creation', () => {
    test('should create search box when shown', () => {
      regexFind.show();
      
      const searchBox = document.querySelector('.regex-find-container');
      expect(searchBox).toBeInTheDocument();
      expect(regexFind.isActive).toBe(true);
    });

    test('should hide search box when hidden', () => {
      regexFind.show();
      regexFind.hide();
      
      const searchBox = document.querySelector('.regex-find-container');
      expect(searchBox.style.display).toBe('none');
      expect(regexFind.isActive).toBe(false);
    });

    test('should focus input when shown', () => {
      regexFind.show();
      
      const input = document.querySelector('.regex-input');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Pattern Processing', () => {
    beforeEach(() => {
      regexFind.show();
    });

    test('should detect regex characters correctly', () => {
      expect(regexFind.containsRegexChars('hello')).toBe(false);
      expect(regexFind.containsRegexChars('hello world')).toBe(false);
      expect(regexFind.containsRegexChars('\\d+')).toBe(true);
      expect(regexFind.containsRegexChars('[abc]')).toBe(true);
      expect(regexFind.containsRegexChars('(test|demo)')).toBe(true);
      // Note: * and ? are now handled as simple wildcards, not regex chars
      expect(regexFind.containsRegexChars('test*')).toBe(false);
      expect(regexFind.containsRegexChars('test?')).toBe(false);
    });

    test('should escape plain text correctly', () => {
      const escaped = regexFind.escapeRegExp('hello.world');
      expect(escaped).toBe('hello\\.world');
      
      const escaped2 = regexFind.escapeRegExp('$5.00');
      expect(escaped2).toBe('\\$5\\.00');
    });

    test('should process plain text patterns', () => {
      const processed = regexFind.processPattern('hello world');
      expect(processed).toBe('hello world');
    });

    test('should process regex patterns', () => {
      const processed = regexFind.processPattern('\\d+');
      expect(processed).toBe('\\d+');
    });

    test('should handle simple wildcards for beginners', () => {
      // Test * wildcard (now constrains to single line)
      const starPattern = regexFind.processPattern('test*');
      expect(starPattern).toBe('test[^\\n]*');
      
      // Test ? wildcard (now constrains to single line)
      const questionPattern = regexFind.processPattern('f?x');
      expect(questionPattern).toBe('f[^\\n]x');
      
      // Test both wildcards
      const bothPattern = regexFind.processPattern('f*?ing');
      expect(bothPattern).toBe('f[^\\n]*[^\\n]ing');
    });

    test('should distinguish wildcards from complex regex', () => {
      // Simple wildcard should be converted
      expect(regexFind.isSimpleWildcard('test*')).toBe(true);
      expect(regexFind.isSimpleWildcard('f?x')).toBe(true);
      
      // Complex regex should not be treated as simple wildcard
      expect(regexFind.isSimpleWildcard('\\d+')).toBe(false);
      expect(regexFind.isSimpleWildcard('[abc]')).toBe(false);
      expect(regexFind.isSimpleWildcard('(test|demo)')).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      regexFind.show();
    });

    test('should find simple text matches', () => {
      regexFind.search('test');
      
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      const highlights = document.querySelectorAll('.regex-highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    test('should find number patterns', () => {
      regexFind.search('\\d+');
      
      expect(regexFind.currentMatches.length).toBe(10); // Found more numbers than expected - this is correct!
      const highlights = document.querySelectorAll('.regex-highlight');
      expect(highlights.length).toBe(10);
    });

    test('should find email patterns', () => {
      regexFind.search('\\w+@\\w+\\.\\w+');
      
      expect(regexFind.currentMatches.length).toBe(2); // test@example.com, user@domain.org
    });

    test('should find TODO items', () => {
      regexFind.search('TODO');
      
      expect(regexFind.currentMatches.length).toBe(2);
    });

    test('should handle NOT operator correctly', () => {
      regexFind.search('/ Imp [^VMB]');
      
      expect(regexFind.currentMatches.length).toBe(2); // / Imp X and / Imp Z
      
      // Check that matches don't include V, M, or B
      regexFind.currentMatches.forEach(match => {
        const text = match.textContent;
        expect(text).toMatch(/\/ Imp [^VMB]/);
      });
    });

    test('should handle wildcard patterns for beginners', () => {
      regexFind.search('test*');
      
      expect(regexFind.currentMatches.length).toBeGreaterThan(0);
      
      // Should match "test" at beginning (case insensitive due to 'gi' flags)
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent.toLowerCase()).toMatch(/^test/);
      });
    });

    test('should handle Ip* pattern correctly with Lorem Ipsum text', () => {
      // Clear previous content and add specific test case
      document.body.innerHTML = `
        <div id="lorem-test">
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
        </div>
      `;

      regexFind.search('Ip*');
      
      // Should find exactly 1 match: "Ipsum" 
      expect(regexFind.currentMatches.length).toBe(1);
      
      // The match should be "Ipsum"
      if (regexFind.currentMatches.length > 0) {
        const matchText = regexFind.currentMatches[0].textContent;
        expect(matchText.toLowerCase()).toMatch(/^ip/);
      }
    });

    test('should find price patterns', () => {
      regexFind.search('\\$\\d+\\.\\d{2}');
      
      expect(regexFind.currentMatches.length).toBe(3); // $19.99, $5.00, $100.50
    });

    test('should handle word boundary patterns', () => {
      // Add test content with word boundaries
      document.body.innerHTML = `
        <div>
          <p>test testing tester</p>
          <p>contest protest</p>
          <p>Test case</p>
        </div>
      `;

      regexFind.search('test\\b');
      
      // Should match "test" at word boundaries: "test" (standalone), "contest" (end), "protest" (end), "Test" (standalone)
      expect(regexFind.currentMatches.length).toBe(4);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent.toLowerCase()).toBe('test');
      });
    });

    test('should handle end of line patterns', () => {
      document.body.innerHTML = `
        <div>
          <p>Line ending with test</p>
          <p>test in middle of line</p>
          <p>Another test here</p>
        </div>
      `;

      regexFind.search('test$');
      
      // Should only match "test" at end of lines
      expect(regexFind.currentMatches.length).toBe(1);
      expect(regexFind.currentMatches[0].textContent).toBe('test');
    });

    test('should handle character class endings', () => {
      document.body.innerHTML = `
        <div>
          <p>Lorem Ipsum dolor</p>
          <p>Lorem, sit amet</p>
          <p>Lorem. consectetur</p>
          <p>LoremTest without space</p>
        </div>
      `;

      regexFind.search('Lorem[ .,]');
      
      // Should match "Lorem " "Lorem," "Lorem." but not "LoremTest"
      expect(regexFind.currentMatches.length).toBe(3);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent).toMatch(/^Lorem[ .,]/);
      });
    });

    test('should handle specific character endings', () => {
      document.body.innerHTML = `
        <div>
          <p>function() call</p>
          <p>function test</p>
          <p>function. End</p>
          <p>functional programming</p>
        </div>
      `;

      regexFind.search('function[( .]');
      
      // Should match "function(" "function " "function." but not "functional"
      expect(regexFind.currentMatches.length).toBe(3);
      
      regexFind.currentMatches.forEach(match => {
        expect(match.textContent).toMatch(/^function[( .]/);
      });
    });

    test('should handle empty search', () => {
      regexFind.search('');
      
      expect(regexFind.currentMatches.length).toBe(0);
      const highlights = document.querySelectorAll('.regex-highlight');
      expect(highlights.length).toBe(0);
    });

    test('should handle invalid regex', () => {
      regexFind.search('[invalid');
      
      expect(regexFind.currentMatches.length).toBe(0);
      const resultInfo = document.querySelector('.match-count');
      expect(resultInfo.textContent).toContain('Invalid regex pattern');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      regexFind.show();
      regexFind.search('\\d+'); // Find numbers
    });

    test('should navigate to next match', () => {
      const initialIndex = regexFind.currentIndex;
      regexFind.nextMatch();
      
      expect(regexFind.currentIndex).toBe((initialIndex + 1) % regexFind.currentMatches.length);
    });

    test('should navigate to previous match', () => {
      regexFind.currentIndex = 2;
      regexFind.previousMatch();
      
      expect(regexFind.currentIndex).toBe(1);
    });

    test('should wrap around when navigating', () => {
      regexFind.currentIndex = regexFind.currentMatches.length - 1;
      regexFind.nextMatch();
      
      expect(regexFind.currentIndex).toBe(0);
    });

    test('should highlight current match', () => {
      regexFind.currentIndex = 0;
      regexFind.highlightCurrentMatch();
      
      const currentHighlight = document.querySelector('.regex-highlight-current');
      expect(currentHighlight).toBeInTheDocument();
      expect(currentHighlight).toBe(regexFind.currentMatches[0]);
    });

    test('should update result info correctly', () => {
      regexFind.currentIndex = 0;
      regexFind.updateResultInfo();
      
      const resultInfo = document.querySelector('.match-count');
      expect(resultInfo.textContent).toBe(`1 of ${regexFind.currentMatches.length} matches`);
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      regexFind.show();
      regexFind.search('test');
    });

    test('should clear all highlights', () => {
      expect(document.querySelectorAll('.regex-highlight').length).toBeGreaterThan(0);
      
      regexFind.clearHighlights();
      
      expect(document.querySelectorAll('.regex-highlight').length).toBe(0);
      expect(regexFind.currentMatches.length).toBe(0);
    });

    test('should restore original text content', () => {
      const originalText = document.getElementById('test-content').textContent;
      
      regexFind.clearHighlights();
      
      const restoredText = document.getElementById('test-content').textContent;
      expect(restoredText).toBe(originalText);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should toggle on Ctrl+Shift+F', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'F',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });

      document.dispatchEvent(keydownEvent);
      expect(regexFind.isActive).toBe(true);

      document.dispatchEvent(keydownEvent);
      expect(regexFind.isActive).toBe(false);
    });

    test('should hide on Escape', () => {
      regexFind.show();
      
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(escapeEvent);
      expect(regexFind.isActive).toBe(false);
    });

    test('should navigate with Enter keys in input', () => {
      regexFind.show();
      regexFind.search('\\d+');
      
      const input = document.querySelector('.regex-input');
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      const initialIndex = regexFind.currentIndex;
      input.dispatchEvent(enterEvent);
      
      expect(regexFind.currentIndex).toBe((initialIndex + 1) % regexFind.currentMatches.length);
    });
  });

  describe('Help System', () => {
    beforeEach(() => {
      regexFind.show();
    });

    test('should toggle help examples', () => {
      const helpBtn = document.querySelector('.help-btn');
      const examplesDiv = document.querySelector('.regex-examples');
      
      expect(examplesDiv.style.display).toBe('none');
      
      helpBtn.click();
      expect(examplesDiv.style.display).toBe('block');
      expect(helpBtn.textContent).toBe('×');
      
      helpBtn.click();
      expect(examplesDiv.style.display).toBe('none');
      expect(helpBtn.textContent).toBe('?');
    });
  });
});
