/**
 * Random Word Glitch Effect - HOME PAGE ONLY
 * Randomly selects one word every 3 seconds and applies glitch animation
 * Only runs on the home page (pathname === '/')
 */

(function() {
  // Check if we're on the home page
  function isHomePage() {
    return window.location.pathname === '/';
  }

  // Find all text elements that should have random glitch
  const glitchableSelectors = [
    'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'li', 'td', 'th', 'label', 'a', 'button'
  ];

  let allWords = [];
  let currentGlitchWord = null;
  let glitchInterval = null;
  let observer = null;

  // Initialize: find all words in the page
  function initGlitchWords() {
    // Only run on home page
    if (!isHomePage()) {
      console.log('[Random Glitch] Not on home page, skipping');
      return;
    }

    allWords = [];
    
    const elements = document.querySelectorAll(glitchableSelectors.join(','));
    
    elements.forEach(element => {
      // Skip if element is inside a script, style, or already has glitch class
      if (element.closest('script, style, .glitch-text, .glitch-text-delay-1, .glitch-text-delay-2, .glitch-text-delay-3, .glitch-text-delay-4')) {
        return;
      }
      
      // Get text content
      const text = element.textContent || '';
      const words = text.trim().split(/\s+/);
      
      // Only process if element has 1-50 words (avoid huge blocks)
      if (words.length > 0 && words.length <= 50) {
        words.forEach((word, index) => {
          if (word.length > 2) { // Only words with 3+ characters
            allWords.push({
              element,
              word,
              index,
              fullText: text
            });
          }
        });
      }
    });
    
    console.log(`[Random Glitch] Found ${allWords.length} glitchable words`);
  }

  // Apply glitch to a random word
  function applyRandomGlitch() {
    // Only run on home page
    if (!isHomePage()) {
      stopGlitch();
      return;
    }

    // Remove previous glitch
    if (currentGlitchWord) {
      const { element, fullText } = currentGlitchWord;
      element.innerHTML = fullText;
      currentGlitchWord = null;
    }

    // Pick a random word
    if (allWords.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * allWords.length);
    const wordData = allWords[randomIndex];
    
    const { element, word, fullText } = wordData;
    
    // Wrap the word in a span with glitch class
    const glitchClasses = [
      'glitch-text',
      'glitch-text-fast',
      'glitch-text-slow',
      'glitch-subtle'
    ];
    const randomGlitchClass = glitchClasses[Math.floor(Math.random() * glitchClasses.length)];
    
    // Replace the word with glitched version
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    const newHTML = fullText.replace(regex, `<span class="${randomGlitchClass}">${word}</span>`);
    
    element.innerHTML = newHTML;
    
    // Store current glitch word
    currentGlitchWord = wordData;
  }

  // Stop glitch effect
  function stopGlitch() {
    if (glitchInterval) {
      clearInterval(glitchInterval);
      glitchInterval = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // Remove any active glitch
    if (currentGlitchWord) {
      const { element, fullText } = currentGlitchWord;
      element.innerHTML = fullText;
      currentGlitchWord = null;
    }
    console.log('[Random Glitch] Stopped');
  }

  // Start the random glitch cycle
  function startRandomGlitch() {
    // Only run on home page
    if (!isHomePage()) {
      console.log('[Random Glitch] Not on home page, not starting');
      return;
    }

    // Initial glitch
    applyRandomGlitch();
    
    // Apply new glitch every 3 seconds
    glitchInterval = setInterval(() => {
      applyRandomGlitch();
    }, 3000);

    // Re-initialize when page content changes (for SPAs)
    observer = new MutationObserver(() => {
      // Stop if not on home page
      if (!isHomePage()) {
        stopGlitch();
        return;
      }
      // Debounce re-initialization
      clearTimeout(window.glitchReinitTimeout);
      window.glitchReinitTimeout = setTimeout(() => {
        initGlitchWords();
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (isHomePage()) {
          initGlitchWords();
          startRandomGlitch();
        }
      }, 500);
    });
  } else {
    setTimeout(() => {
      if (isHomePage()) {
        initGlitchWords();
        startRandomGlitch();
      }
    }, 500);
  }

  // Listen for route changes (Next.js navigation)
  // Stop glitch when leaving home page
  let lastPath = window.location.pathname;
  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      if (currentPath !== '/') {
        stopGlitch();
      } else {
        initGlitchWords();
        startRandomGlitch();
      }
    }
  }, 500);
})();
