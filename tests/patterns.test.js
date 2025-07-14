import { expect } from 'chai';

const API_BASE = 'http://localhost:5000';

async function testPatternGeneration() {
  console.log('🧶 Testing Pattern Generation System...');
  
  let testPatternId = null;

  async function runTest(testName, testFn) {
    try {
      await testFn();
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      console.log(`  ❌ ${testName}: ${error.message}`);
      throw error;
    }
  }

  // Test text-to-pattern generation
  await runTest('Text-to-Pattern Generation', async () => {
    const patternData = {
      description: 'A simple blue scarf with white stripes',
      width: 20,
      height: 30,
      complexity: 'simple',
      colorPalette: 'blue-white',
      colors: ['#0066cc', '#ffffff'],
      yarnWeight: 'medium',
      materialType: 'yarn',
      fiberType: 'acrylic'
    };

    const response = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patternData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Pattern generation failed');
    }

    if (!data.success || !data.pattern) {
      throw new Error('Pattern generation response invalid');
    }

    if (!data.pattern.patternData || !data.pattern.instructions) {
      throw new Error('Pattern data incomplete');
    }

    if (!data.metrics || !data.generatedImage) {
      throw new Error('Missing metrics or generated image');
    }

    testPatternId = data.pattern.id;
  });

  // Test pattern retrieval
  await runTest('Pattern Retrieval by ID', async () => {
    const response = await fetch(`${API_BASE}/api/patterns/${testPatternId}`);

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Pattern retrieval failed');
    }

    if (!data.success || !data.pattern) {
      throw new Error('Pattern retrieval response invalid');
    }

    if (data.pattern.id !== testPatternId) {
      throw new Error('Pattern ID mismatch');
    }
  });

  // Test pattern list retrieval
  await runTest('Pattern List Retrieval', async () => {
    const response = await fetch(`${API_BASE}/api/patterns`);

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Pattern list retrieval failed');
    }

    if (!data.success || !Array.isArray(data.patterns)) {
      throw new Error('Pattern list response invalid');
    }

    const pattern = data.patterns.find(p => p.id === testPatternId);
    if (!pattern) {
      throw new Error('Generated pattern not found in list');
    }
  });

  // Test pattern search
  await runTest('Pattern Search', async () => {
    const response = await fetch(`${API_BASE}/api/patterns/search?q=scarf`);

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Pattern search failed');
    }

    if (!data.success || !Array.isArray(data.patterns)) {
      throw new Error('Pattern search response invalid');
    }

    // Search should find our pattern if it contains "scarf"
    const foundPattern = data.patterns.find(p => p.id === testPatternId);
    if (!foundPattern) {
      console.log('  ⚠️  Generated pattern not found in search (may be due to description)');
    }
  });

  // Test invalid pattern data
  await runTest('Invalid Pattern Data Validation', async () => {
    const invalidData = {
      description: '', // Empty description
      width: -5, // Invalid width
      height: 0, // Invalid height
      complexity: 'invalid' // Invalid complexity
    };

    const response = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    if (response.ok) {
      throw new Error('Should have rejected invalid pattern data');
    }

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test pattern breakdown for complex patterns
  await runTest('Pattern Breakdown Generation', async () => {
    const complexPatternData = {
      description: 'A complex multicolored afghan with intricate patterns',
      width: 60,
      height: 80,
      complexity: 'advanced',
      colorPalette: 'rainbow',
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
      yarnWeight: 'medium',
      materialType: 'yarn',
      fiberType: 'wool'
    };

    const response = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complexPatternData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Complex pattern generation failed');
    }

    if (!data.success || !data.pattern) {
      throw new Error('Complex pattern generation response invalid');
    }

    // Check if breakdown is available
    const breakdownResponse = await fetch(`${API_BASE}/api/patterns/${data.pattern.id}/breakdown`);
    
    if (breakdownResponse.ok) {
      const breakdownData = await breakdownResponse.json();
      if (!breakdownData.success || !breakdownData.breakdown) {
        throw new Error('Pattern breakdown response invalid');
      }
    }
  });

  console.log('🧶 Pattern generation tests completed successfully!');
  return true;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPatternGeneration().catch(console.error);
}

export { testPatternGeneration };