import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000';

// Production readiness test suite
async function runProductionReadinessTests() {
  console.log('🚀 Production Readiness Testing...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  const errors = [];

  async function runTest(testName, testFn) {
    try {
      console.log(`⏳ ${testName}`);
      await testFn();
      console.log(`✅ PASSED: ${testName}`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      errors.push({ test: testName, error: error.message });
      testsFailed++;
    }
  }

  // Test 1: Core API Functionality
  await runTest('Core API Endpoints', async () => {
    const endpoints = [
      { method: 'GET', url: '/api/patterns', expectedStatus: 200 },
      { method: 'POST', url: '/api/patterns/validate', 
        data: { patternData: { width: 10, height: 10, cells: [] } }, 
        expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${BASE_URL}${endpoint.url}`);
      } else if (endpoint.method === 'POST') {
        response = await axios.post(`${BASE_URL}${endpoint.url}`, endpoint.data);
      }
      
      if (response.status !== endpoint.expectedStatus) {
        throw new Error(`${endpoint.method} ${endpoint.url} returned ${response.status}, expected ${endpoint.expectedStatus}`);
      }
    }
  });

  // Test 2: Material System Integration
  await runTest('Material System Features', async () => {
    const testPattern = {
      name: "Material Test Pattern",
      description: "Testing material system",
      patternData: { width: 10, height: 10, cells: [] },
      width: 10,
      height: 10,
      complexity: "simple",
      yarnWeight: "worsted", 
      materialType: "yarn",
      fiberType: "cotton",
      stitchCount: 100,
      estimatedTime: "2 hours",
      difficulty: "beginner"
    };

    const response = await axios.post(`${BASE_URL}/api/patterns`, testPattern);
    
    if (response.status !== 201) {
      throw new Error(`Pattern creation failed with status ${response.status}`);
    }

    const pattern = response.data.pattern;
    
    // Verify material fields are preserved
    if (pattern.yarnWeight !== "worsted" || 
        pattern.materialType !== "yarn" || 
        pattern.fiberType !== "cotton") {
      throw new Error('Material fields not properly stored');
    }

    // Cleanup
    await axios.delete(`${BASE_URL}/api/patterns/${pattern.id}`);
  });

  // Test 3: Data Validation
  await runTest('Schema Validation', async () => {
    const invalidInputs = [
      { description: "", width: 10, height: 10 }, // Empty description
      { description: "test", width: 300, height: 10 }, // Width too large
      { description: "test", width: 10, height: 5 }, // Height too small
      { description: "test", width: 10, height: 10, complexity: "invalid" }, // Invalid complexity
    ];

    for (const input of invalidInputs) {
      try {
        await axios.post(`${BASE_URL}/api/patterns/generate-text`, input);
        throw new Error(`Validation should have failed for: ${JSON.stringify(input)}`);
      } catch (error) {
        if (!error.response || error.response.status !== 400) {
          throw new Error(`Expected 400 validation error, got: ${error.response?.status}`);
        }
      }
    }
  });

  // Test 4: Error Handling
  await runTest('Error Handling', async () => {
    // Test 404 for non-existent pattern
    try {
      await axios.get(`${BASE_URL}/api/patterns/99999`);
      throw new Error('Should have returned 404 for non-existent pattern');
    } catch (error) {
      if (!error.response || error.response.status !== 404) {
        throw new Error(`Expected 404, got: ${error.response?.status}`);
      }
    }

    // Test invalid JSON
    try {
      await axios.post(`${BASE_URL}/api/patterns`, "invalid json", {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (!error.response || error.response.status !== 400) {
        throw new Error(`Expected 400 for invalid JSON, got: ${error.response?.status}`);
      }
    }
  });

  // Test 5: Frontend Assets
  await runTest('Frontend Assets Loading', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    
    if (response.status !== 200) {
      throw new Error(`Frontend not accessible: ${response.status}`);
    }

    const html = response.data;
    
    // Check for essential HTML structure
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error('Missing DOCTYPE declaration');
    }
    
    if (!html.includes('<div id="root">')) {
      throw new Error('Missing React root element');
    }
    
    if (!html.includes('main.tsx')) {
      throw new Error('Missing main application script');
    }
  });

  // Test 6: Database Schema Integrity
  await runTest('Database Schema Completeness', async () => {
    // Create a pattern with all fields
    const fullPattern = {
      name: "Schema Test",
      description: "Testing schema completeness",
      patternData: { 
        width: 15, 
        height: 15, 
        cells: Array(15).fill().map(() => Array(15).fill({ stitch: 'sc', color: '#ff0000' }))
      },
      width: 15,
      height: 15,
      complexity: "intermediate",
      yarnWeight: "dk",
      materialType: "thread",
      fiberType: "bamboo",
      stitchCount: 225,
      estimatedTime: "3 hours",
      difficulty: "intermediate",
      colorPalette: ["#ff0000", "#00ff00", "#0000ff"],
      instructions: ["Row 1: Chain 15", "Row 2: Single crochet in each chain"]
    };

    const response = await axios.post(`${BASE_URL}/api/patterns`, fullPattern);
    
    if (response.status !== 201) {
      throw new Error('Failed to create pattern with complete schema');
    }

    const pattern = response.data.pattern;
    
    // Verify all critical fields are present
    const requiredFields = [
      'id', 'name', 'description', 'patternData', 'width', 'height', 
      'complexity', 'yarnWeight', 'materialType', 'fiberType',
      'stitchCount', 'estimatedTime', 'difficulty'
    ];

    for (const field of requiredFields) {
      if (!(field in pattern)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Cleanup
    await axios.delete(`${BASE_URL}/api/patterns/${pattern.id}`);
  });

  // Test 7: Performance Checks
  await runTest('Performance Benchmarks', async () => {
    const startTime = Date.now();
    
    // Test multiple simultaneous requests
    const promises = Array(5).fill().map(() => 
      axios.get(`${BASE_URL}/api/patterns`)
    );
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 5000) { // 5 seconds
      throw new Error(`Responses too slow: ${duration}ms for 5 concurrent requests`);
    }
  });

  // Test 8: Security Headers Check
  await runTest('Security Configuration', async () => {
    const response = await axios.get(`${BASE_URL}/api/patterns`);
    
    // Check for JSON response (not HTML)
    if (response.headers['content-type'] && 
        !response.headers['content-type'].includes('application/json')) {
      throw new Error('API should return JSON content-type');
    }

    // Verify proper error responses don't leak sensitive info
    try {
      await axios.post(`${BASE_URL}/api/patterns/generate-text`, {});
    } catch (error) {
      if (error.response && error.response.data && 
          typeof error.response.data.error === 'string') {
        // Good - returns user-friendly error message
      } else {
        throw new Error('Error responses should be user-friendly');
      }
    }
  });

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('🏆 PRODUCTION READINESS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

  if (errors.length > 0) {
    console.log('❌ FAILED TESTS:');
    errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
    console.log('');
  }

  const readinessLevel = testsFailed === 0 ? 'PRODUCTION READY' : 
                       testsFailed <= 2 ? 'NEAR PRODUCTION READY' : 
                       'NEEDS WORK';

  console.log(`🎯 STATUS: ${readinessLevel}\n`);

  if (testsFailed === 0) {
    console.log('🎉 APPLICATION IS PRODUCTION READY!');
    console.log('\n🚀 DEPLOYMENT CHECKLIST:');
    console.log('✅ Backend API fully functional');
    console.log('✅ Frontend assets loading correctly');
    console.log('✅ Database operations working');
    console.log('✅ Error handling implemented');
    console.log('✅ Schema validation active');
    console.log('✅ Material system integrated');
    console.log('✅ Performance benchmarks met');
    console.log('✅ Security considerations addressed');
    console.log('\n📝 NEXT STEPS FOR DEPLOYMENT:');
    console.log('1. Set OPENAI_API_KEY for full AI functionality');
    console.log('2. Configure production database URL');
    console.log('3. Set up SSL/HTTPS certificate');
    console.log('4. Configure domain and DNS');
    console.log('5. Set up monitoring and logging');
    console.log('6. Run final tests with real OpenAI API');
  } else {
    console.log('⚠️  Please resolve failing tests before deployment.');
  }

  return { testsPassed, testsFailed, errors, readinessLevel };
}

// Run the production readiness tests
runProductionReadinessTests().catch(console.error);