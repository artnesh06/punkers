'use client';

import { useEffect } from 'react';
import './glitch.css';

export default function GlitchEffect() {
  useEffect(() => {
    const createGlitch = () => {
      // Get all text elements in viewport
      const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, div'));
      
      // Filter only visible elements in viewport
      const visibleElements = textElements.filter(el => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth &&
          el.textContent && el.textContent.trim().length > 0
        );
      });
      
      if (visibleElements.length === 0) return;
      
      // Pick random element
      const randomElement = visibleElements[Math.floor(Math.random() * visibleElements.length)];
      
      // Add glitch class
      randomElement.classList.add('text-glitch-active');
      
      // Remove after animation
      setTimeout(() => {
        randomElement.classList.remove('text-glitch-active');
      }, 300);
    };
    
    // Trigger glitch every 3 seconds
    const interval = setInterval(createGlitch, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
}
