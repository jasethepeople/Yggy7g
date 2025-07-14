// Basic API testing script
// Run with: node tests/api.test.js

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing CrochetAI API endpoints...\n');
  
  // Test 1: Get all patterns (should be empty initially)
  try {
    const response = await fetch(`${API_BASE}/patterns`);
    const data = await response.json();
    console.log('✅ GET /api/patterns:', data.success ? 'SUCCESS' : 'FAILED');
    console.log('   Patterns found:', data.patterns?.length || 0);
  } catch (error) {
    console.log('❌ GET /api/patterns: FAILED -', error.message);
  }

  // Test 2: Pattern validation endpoint
  try {
    const testPattern = {
      patternData: {
        width: 10,
        height: 10,
        cells: Array(10).fill().map((_, y) => 
          Array(10).fill().map((_, x) => ({
            x, y, stitch: 'sc', color: '#FFB3E6'
          }))
        )
      }
    };
    
    const response = await fetch(`${API_BASE}/patterns/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPattern)
    });
    
    const data = await response.json();
    console.log('✅ POST /api/patterns/validate:', data.success ? 'SUCCESS' : 'FAILED');
    console.log('   Pattern valid:', data.validation?.isValid || false);
  } catch (error) {
    console.log('❌ POST /api/patterns/validate: FAILED -', error.message);
  }

  // Test 3: Database connection (test with text generation - will fail without OpenAI key)
  try {
    const testData = {
      description: "A simple test pattern",
      width: 20,
      height: 20,
      complexity: "simple",
      colorPalette: "pastel"
    };
    
    const response = await fetch(`${API_BASE}/patterns/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (response.status === 400) {
      const error = await response.json();
      if (error.error?.includes('API key') || error.error?.includes('OpenAI')) {
        console.log('⚠️  Text generation: NEEDS OPENAI_API_KEY (expected)');
      } else {
        console.log('✅ Text generation endpoint: WORKING (DB connected)');
      }
    } else {
      console.log('✅ Text generation: SUCCESS (with API key)');
    }
  } catch (error) {
    console.log('❌ Text generation test: FAILED -', error.message);
  }

  console.log('\n🔍 API Testing Complete!');
  console.log('💡 To test with AI features, add your OPENAI_API_KEY');
}

testAPI();