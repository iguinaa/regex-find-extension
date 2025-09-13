// Jest setup file
require('@testing-library/jest-dom');

// Mock browser APIs that aren't available in Jest
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Mock scrollIntoView which doesn't exist in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Setup DOM cleanup
afterEach(() => {
  // Clean up any extension UI elements
  document.querySelectorAll('.regex-find-container').forEach(el => el.remove());
  
  // Clean up any highlights
  document.querySelectorAll('.regex-highlight').forEach(span => {
    const parent = span.parentNode;
    const textNode = document.createTextNode(span.textContent);
    parent.replaceChild(textNode, span);
  });
  
  // Normalize text nodes
  document.normalize();
});
