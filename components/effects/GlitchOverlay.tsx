'use client';

import { useEffect, useRef } from 'react';
import styles from './GlitchOverlay.module.css';

function randomSlices(count: number): { top: number; height: number }[] {
  const slices: { top: number; height: number }[] = [];
  for (let i = 0; i < count; i++) {
    slices.push({ top: Math.random() * 85, height: 2 + Math.random() * 8 });
  }
  return slices;
}

// Pick a random visible word from the page and glitch it
function glitchRandomWord(): (() => void) | null {
  // Collect all text nodes that are visible and have real words
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip scripts, styles, hidden elements, already-glitched spans
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-glitch]')) return NodeFilter.FILTER_REJECT;
        const text = node.textContent?.trim() ?? '';
        if (text.length < 2) return NodeFilter.FILTER_REJECT;
        // Must be visible
        const rect = parent.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  if (nodes.length === 0) return null;

  // Pick random node
  const textNode = nodes[Math.floor(Math.random() * nodes.length)];
  const fullText = textNode.textContent ?? '';

  // Split into words, pick one
  const words = fullText.split(/(\s+)/);
  const wordIndices = words.reduce<number[]>((acc, w, i) => {
    if (w.trim().length >= 2) acc.push(i);
    return acc;
  }, []);
  if (wordIndices.length === 0) return null;

  const wi = wordIndices[Math.floor(Math.random() * wordIndices.length)];
  const word = words[wi];

  // Replace that word with a glitch span (use global class, not CSS module)
  words[wi] = `<span data-glitch class="glitch-word" data-text="${word}">${word}</span>`;
  const newHTML = words.join('');

  // Wrap the text node in a temp span
  const wrapper = document.createElement('span');
  wrapper.innerHTML = newHTML;
  textNode.parentNode?.replaceChild(wrapper, textNode);

  // Return cleanup function
  return () => {
    if (wrapper.parentNode) {
      wrapper.parentNode.replaceChild(textNode, wrapper);
    }
  };
}

export default function GlitchOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 20000 + Math.random() * 30000; // 20-50 seconds instead of 6-18
      timerRef.current = setTimeout(() => {
        triggerGlitch();
        scheduleGlitch();
      }, delay);
    };

    const triggerGlitch = () => {
      // Just glitch a random word, no page shake or overlay
      const cleanupWord = glitchRandomWord();
      
      // Clean up after 3 seconds
      setTimeout(() => {
        cleanupWord?.();
      }, 3000);
    };

    scheduleGlitch();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.transform = '';
      document.body.style.filter = '';
    };
  }, []);

  return <div ref={overlayRef} className={styles.glitchOverlay} aria-hidden="true" />;
}
