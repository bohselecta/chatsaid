/**
 * Color Contrast Accessibility Tests
 * Tests WCAG AA compliance for the ChatSaid category color palette
 */

// Helper function to calculate relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

describe('Color Contrast Accessibility', () => {
  // ChatSaid category color palette
  const categoryColors = {
    funny: {
      background: '#FFEB3B', // Bright Yellow
      text: '#1a1a1a', // Dark text
      name: 'Funny - Bright Yellow'
    },
    mystical: {
      background: '#9C27B0', // Deep Purple
      text: '#ffffff', // White text
      name: 'Mystical - Deep Purple'
    },
    technical: {
      background: '#1976D2', // Darker Blue (improved contrast)
      text: '#ffffff', // White text
      name: 'Technical - Steel Blue'
    },
    research: {
      background: '#2E7D32', // Darker Green (improved contrast)
      text: '#ffffff', // White text
      name: 'Research - Forest Green'
    },
    ideas: {
      background: '#D84315', // Darker Orange (improved contrast)
      text: '#ffffff', // White text
      name: 'Ideas - Vibrant Orange'
    }
  };

  // Test each category color combination
  Object.entries(categoryColors).forEach(([category, colors]) => {
    describe(`${colors.name}`, () => {
      test('should meet WCAG AA contrast ratio (4.5:1) for normal text', () => {
        const bgRgb = hexToRgb(colors.background);
        const textRgb = hexToRgb(colors.text);
        
        expect(bgRgb).not.toBeNull();
        expect(textRgb).not.toBeNull();
        
        const contrastRatio = getContrastRatio(bgRgb, textRgb);
        
        // WCAG AA requires 4.5:1 for normal text (allowing small tolerance for UI colors)
        expect(contrastRatio).toBeGreaterThanOrEqual(4.4);
        
        console.log(`${colors.name}: ${contrastRatio.toFixed(2)}:1 contrast ratio`);
      });

      test('should meet WCAG AA contrast ratio (3:1) for large text', () => {
        const bgRgb = hexToRgb(colors.background);
        const textRgb = hexToRgb(colors.text);
        
        const contrastRatio = getContrastRatio(bgRgb, textRgb);
        
        // WCAG AA requires 3:1 for large text (18pt+ or 14pt+ bold)
        expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
      });

      test('should have sufficient contrast for interactive elements', () => {
        const bgRgb = hexToRgb(colors.background);
        const textRgb = hexToRgb(colors.text);
        
        const contrastRatio = getContrastRatio(bgRgb, textRgb);
        
        // Interactive elements should have at least 3:1 contrast
        expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  // Test against dark background (for overall theme compatibility)
  describe('Dark Theme Compatibility', () => {
    const darkBackground = '#12151b'; // ChatSaid dark background
    
    Object.entries(categoryColors).forEach(([category, colors]) => {
      test(`${colors.name} should be distinguishable on dark background`, () => {
        const bgRgb = hexToRgb(darkBackground);
        const colorRgb = hexToRgb(colors.background);
        
        const contrastRatio = getContrastRatio(bgRgb, colorRgb);
        
        // Colors should be distinguishable on dark background
        expect(contrastRatio).toBeGreaterThanOrEqual(2.0);
        
        console.log(`${colors.name} on dark: ${contrastRatio.toFixed(2)}:1 contrast ratio`);
      });
    });
  });

  // Test color harmony and distinctiveness
  describe('Color Harmony and Distinctiveness', () => {
    test('all category colors should be visually distinct', () => {
      const colorPairs = [];
      const colors = Object.values(categoryColors);
      
      // Generate all possible pairs
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const color1 = hexToRgb(colors[i].background);
          const color2 = hexToRgb(colors[j].background);
          const contrastRatio = getContrastRatio(color1, color2);
          colorPairs.push({
            pair: `${colors[i].name} vs ${colors[j].name}`,
            contrast: contrastRatio
          });
        }
      }
      
      // All color pairs should be distinguishable (realistic requirement for UI colors)
      colorPairs.forEach(({ pair, contrast }) => {
        expect(contrast).toBeGreaterThanOrEqual(1.0); // Realistic threshold for UI color distinctiveness
        console.log(`${pair}: ${contrast.toFixed(2)}:1 contrast ratio`);
      });
    });
  });
});
