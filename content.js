class RegexFind {
  constructor() {
    this.isActive = false;
    this.currentMatches = [];
    this.currentIndex = -1;
    this.searchBox = null;
    this.resultInfo = null;
    this.originalText = new Map();
    
    this.init();
  }

  init() {
    // Listen for keyboard shortcut (Ctrl+Shift+F)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isActive) {
        this.hide();
      }
    });
  }

  toggle() {
    if (this.isActive) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.searchBox) {
      this.searchBox.style.display = 'block';
      this.searchBox.querySelector('input').focus();
      return;
    }

    this.createSearchBox();
    this.isActive = true;
  }

  hide() {
    if (this.searchBox) {
      this.searchBox.style.display = 'none';
    }
    this.clearHighlights();
    this.isActive = false;
  }

  createSearchBox() {
    this.searchBox = document.createElement('div');
    this.searchBox.className = 'regex-find-container';
    
    this.searchBox.innerHTML = `
      <div class="regex-find-box">
        <input type="text" placeholder="Enter pattern or regex (e.g., TODO, \\d+)" class="regex-input">
        <div class="regex-controls">
          <button class="regex-btn prev-btn" title="Previous match">↑</button>
          <button class="regex-btn next-btn" title="Next match">↓</button>
          <button class="regex-btn help-btn" title="Show examples">?</button>
          <button class="regex-btn close-btn" title="Close (Esc)">×</button>
        </div>
        <div class="regex-info">
          <span class="match-count">0 matches</span>
          <div class="regex-help">
            Start typing to search. Click ? for examples and tips.
          </div>
        </div>
        <div class="regex-examples" style="display: none;">
          <div class="example-section">
            <strong>Simple patterns:</strong><br>
            <code>TODO</code> - Find "TODO"<br>
            <code>function</code> - Find "function"<br>
            <code>123</code> - Find "123"
          </div>
          <div class="example-section">
            <strong>Wildcards (single line):</strong><br>
            <code>test*</code> - "test" + anything on same line<br>
            <code>*ing</code> - Anything + "ing" (same line)<br>
            <code>f?x</code> - "f" + any single char + "x"
          </div>
          <div class="example-section">
            <strong>Cross-line matching:</strong><br>
            <code>test.*</code> - "test" + anything (including newlines)<br>
            <code>start.*end</code> - From "start" to "end" anywhere<br>
            <code>\\s</code> - Any whitespace (space, tab, newline)
          </div>
          <div class="example-section">
            <strong>Numbers & digits:</strong><br>
            <code>\\d</code> - Any single digit<br>
            <code>\\d+</code> - One or more digits<br>
            <code>\\d{3}</code> - Exactly 3 digits
          </div>
          <div class="example-section">
            <strong>Excluding characters:</strong><br>
            <code>cat [^s]</code> - "cat" not followed by "s"<br>
            <code>[^VMB]</code> - Any char except V, M, or B<br>
            <code>/ Imp [^VMB]</code> - "/ Imp " + not V/M/B
          </div>
          <div class="example-section">
            <strong>Common patterns:</strong><br>
            <code>\\w+@\\w+</code> - Email-like<br>
            <code>https?://\\S+</code> - URLs<br>
            <code>\\$\\d+</code> - Prices like $25
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.searchBox);

    const input = this.searchBox.querySelector('.regex-input');
    const prevBtn = this.searchBox.querySelector('.prev-btn');
    const nextBtn = this.searchBox.querySelector('.next-btn');
    const helpBtn = this.searchBox.querySelector('.help-btn');
    const closeBtn = this.searchBox.querySelector('.close-btn');
    const examplesDiv = this.searchBox.querySelector('.regex-examples');
    this.resultInfo = this.searchBox.querySelector('.match-count');

    // Event listeners
    input.addEventListener('input', (e) => this.search(e.target.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.shiftKey ? this.previousMatch() : this.nextMatch();
      }
    });
    
    prevBtn.addEventListener('click', () => this.previousMatch());
    nextBtn.addEventListener('click', () => this.nextMatch());
    helpBtn.addEventListener('click', () => {
      const isVisible = examplesDiv.style.display !== 'none';
      examplesDiv.style.display = isVisible ? 'none' : 'block';
      helpBtn.textContent = isVisible ? '?' : '×';
      helpBtn.title = isVisible ? 'Show examples' : 'Hide examples';
    });
    closeBtn.addEventListener('click', () => this.hide());

    input.focus();
  }

  search(pattern) {
    this.clearHighlights();
    this.currentMatches = [];
    this.currentIndex = -1;

    if (!pattern.trim()) {
      this.updateResultInfo();
      return;
    }

    try {
      // Smart pattern detection and suggestions
      let regexPattern = this.processPattern(pattern);
      
      // Debug logging to help troubleshoot issues
      console.log('Input pattern:', pattern);
      console.log('Is simple wildcard?', this.isSimpleWildcard(pattern));
      console.log('Contains regex chars?', this.containsRegexChars(pattern));
      console.log('Final regex pattern:', regexPattern);
      
      const regex = new RegExp(regexPattern, 'gi');
      this.findMatches(document.body, regex);
      this.updateResultInfo();
      
      if (this.currentMatches.length > 0) {
        this.currentIndex = 0;
        this.highlightCurrentMatch();
      }
    } catch (e) {
      console.error('Regex error:', e, 'Pattern:', pattern);
      this.showPatternSuggestion(pattern);
    }
  }

  processPattern(pattern) {
    // Check if it looks like a simple wildcard pattern (contains * or ? but not complex regex)
    if (this.isSimpleWildcard(pattern)) {
      return this.convertWildcardToRegex(pattern);
    }
    
    // If it looks like plain text, escape it
    if (!this.containsRegexChars(pattern)) {
      return this.escapeRegExp(pattern);
    }

    // Return as-is for full regex patterns
    return pattern;
  }

  isSimpleWildcard(str) {
    // Check if it contains wildcards but not complex regex syntax
    const hasWildcards = /[*?]/.test(str);
    const hasComplexRegex = /[\\^${}()|[\]]+/.test(str);
    return hasWildcards && !hasComplexRegex;
  }

  convertWildcardToRegex(pattern) {
    // Convert simple wildcards to regex, but constrain to single lines
    // Escape regex special characters except * and ?
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert wildcards with line boundary awareness:
    // * becomes [^\n]* (anything except newlines)
    // ? becomes [^\n] (any single character except newline)
    escaped = escaped.replace(/\*/g, '[^\\n]*').replace(/\?/g, '[^\\n]');
    
    return escaped;
  }

  containsRegexChars(str) {
    // Check if string contains regex special characters (excluding simple wildcards)
    return /[\\^${}()|[\]]+/.test(str);
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  showPatternSuggestion(pattern) {
    this.resultInfo.style.color = '#ff6b6b';
    this.resultInfo.textContent = 'Invalid regex pattern - click ? for examples';
  }

  findMatches(element, regex) {
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent;
      const matches = [...text.matchAll(regex)];
      
      if (matches.length > 0) {
        this.processTextMatches(element, matches);
      }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      // Skip script, style, and our search box
      if (element.tagName && 
          !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName) &&
          !element.classList.contains('regex-find-container')) {
        
        for (let child of Array.from(element.childNodes)) {
          this.findMatches(child, regex);
        }
      }
    }
  }

  processTextMatches(textNode, matches) {
    const parent = textNode.parentNode;
    const text = textNode.textContent;
    let lastIndex = 0;
    const fragments = [];

    for (let match of matches) {
      // Add text before match
      if (match.index > lastIndex) {
        fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // Create highlighted span for match
      const span = document.createElement('span');
      span.className = 'regex-highlight';
      span.textContent = match[0];
      fragments.push(span);
      
      this.currentMatches.push(span);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragments.push(document.createTextNode(text.slice(lastIndex)));
    }

    // Replace original text node with fragments
    this.originalText.set(parent, textNode);
    fragments.forEach(fragment => parent.insertBefore(fragment, textNode));
    parent.removeChild(textNode);
  }

  nextMatch() {
    if (this.currentMatches.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.currentMatches.length;
    this.highlightCurrentMatch();
  }

  previousMatch() {
    if (this.currentMatches.length === 0) return;
    
    this.currentIndex = this.currentIndex <= 0 ? 
      this.currentMatches.length - 1 : this.currentIndex - 1;
    this.highlightCurrentMatch();
  }

  highlightCurrentMatch() {
    // Remove current highlight
    this.currentMatches.forEach(match => 
      match.classList.remove('regex-highlight-current'));
    
    // Add current highlight
    if (this.currentMatches[this.currentIndex]) {
      const currentMatch = this.currentMatches[this.currentIndex];
      currentMatch.classList.add('regex-highlight-current');
      currentMatch.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }

    this.updateResultInfo();
  }

  updateResultInfo() {
    if (!this.resultInfo) return;
    
    this.resultInfo.style.color = '#666';
    if (this.currentMatches.length === 0) {
      this.resultInfo.textContent = '0 matches';
    } else {
      this.resultInfo.textContent = 
        `${this.currentIndex + 1} of ${this.currentMatches.length} matches`;
    }
  }

  clearHighlights() {
    // Remove all highlight spans and restore original text
    document.querySelectorAll('.regex-highlight').forEach(span => {
      const parent = span.parentNode;
      const textNode = document.createTextNode(span.textContent);
      parent.replaceChild(textNode, span);
      parent.normalize(); // Merge adjacent text nodes
    });
    
    this.currentMatches = [];
    this.currentIndex = -1;
  }
}

// Initialize the extension
if (typeof module !== 'undefined' && module.exports) {
  // For testing environment
  module.exports = RegexFind;
} else {
  // For browser environment
  new RegexFind();
}
