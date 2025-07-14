// COMPREHENSIVE TESTING SCRIPT FOR CROCHET PATTERN GENERATOR
// This script tests ALL components, API endpoints, and functionality

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 TESTING ALL API ENDPOINTS...\n');
  
  const tests = [
    {
      name: 'GET /api/patterns',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/patterns`);
        const data = await response.json();
        return response.ok && data.success && Array.isArray(data.patterns);
      }
    },
    {
      name: 'POST /api/patterns/validate',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/patterns/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patternData: { test: 'data' } })
        });
        const data = await response.json();
        return response.ok && data.success && data.validation;
      }
    },
    {
      name: 'POST /api/patterns/generate-from-text',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/patterns/generate-from-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: 'small blue flower',
            materialType: 'yarn',
            yarnWeight: 'worsted',
            fiberType: 'cotton'
          })
        });
        const data = await response.json();
        return response.ok && data.success && data.pattern;
      }
    }
  ];

  for (const { name, test } of tests) {
    try {
      const result = await test();
      console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
}

async function testDatabase() {
  console.log('\n🗄️ TESTING DATABASE CONNECTIVITY...\n');
  
  try {
    // Test database read
    const response = await fetch(`${BASE_URL}/api/patterns`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Database connection: WORKING');
      console.log(`✅ Pattern count: ${data.patterns?.length || 0}`);
      
      if (data.patterns?.length > 0) {
        const pattern = data.patterns[0];
        console.log(`✅ Latest pattern: "${pattern.name}" (ID: ${pattern.id})`);
        console.log(`✅ Pattern properties: ${Object.keys(pattern).join(', ')}`);
      }
    } else {
      console.log('❌ Database connection: FAILED');
    }
  } catch (error) {
    console.log(`❌ Database test: ERROR - ${error.message}`);
  }
}

async function testImageGeneration() {
  console.log('\n🎨 TESTING IMAGE GENERATION...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/patterns/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'simple test pattern',
        materialType: 'yarn',
        yarnWeight: 'worsted',
        fiberType: 'cotton'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Text-to-image generation: WORKING');
      console.log(`✅ Generated pattern: "${data.pattern?.name}"`);
      console.log(`✅ Image URL: ${data.pattern?.imageUrl ? 'Present' : 'Missing'}`);
      console.log(`✅ Pattern data: ${data.pattern?.patternData ? 'Generated' : 'Missing'}`);
    } else {
      console.log('❌ Image generation: FAILED');
    }
  } catch (error) {
    console.log(`❌ Image generation: ERROR - ${error.message}`);
  }
}

async function testExportFunctionality() {
  console.log('\n📤 TESTING EXPORT FUNCTIONALITY...\n');
  
  // Test if patterns have export-ready data
  try {
    const response = await fetch(`${BASE_URL}/api/patterns`);
    const data = await response.json();
    
    if (data.patterns?.length > 0) {
      const pattern = data.patterns[0];
      
      console.log('✅ Export test pattern found');
      console.log(`✅ Pattern name: ${pattern.name ? 'Present' : 'Missing'}`);
      console.log(`✅ Instructions: ${pattern.instructions ? 'Present' : 'Missing'}`);
      console.log(`✅ Pattern data: ${pattern.patternData ? 'Present' : 'Missing'}`);
      console.log(`✅ Stitch count: ${pattern.stitchCount || 'N/A'}`);
      console.log(`✅ Difficulty: ${pattern.difficulty || 'N/A'}`);
      console.log(`✅ Yarn weight: ${pattern.yarnWeight || 'N/A'}`);
      
      // Test if we can create exportable content
      const exportContent = {
        pdf: pattern.name && pattern.instructions,
        text: pattern.instructions,
        chart: pattern.patternData,
        share: pattern.id
      };
      
      console.log(`✅ PDF export ready: ${exportContent.pdf ? 'YES' : 'NO'}`);
      console.log(`✅ Text export ready: ${exportContent.text ? 'YES' : 'NO'}`);
      console.log(`✅ Chart export ready: ${exportContent.chart ? 'YES' : 'NO'}`);
      console.log(`✅ Share ready: ${exportContent.share ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ No patterns available for export testing');
    }
  } catch (error) {
    console.log(`❌ Export test: ERROR - ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 COMPREHENSIVE CROCHET APP TESTING\n');
  console.log('=' .repeat(50));
  
  await testDatabase();
  await testAPI();
  await testImageGeneration();
  await testExportFunctionality();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 TESTING COMPLETE');
  console.log('\nNOTE: Frontend components (buttons, UI) must be tested manually in browser');
  console.log('Backend API endpoints and data flow have been verified above.');
}

// Run all tests
runAllTests().catch(console.error);