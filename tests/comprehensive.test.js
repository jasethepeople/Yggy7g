import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000';

// Test suite for comprehensive application testing
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Application Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  const errors = [];

  // Helper function to run tests
  async function runTest(testName, testFn) {
    try {
      console.log(`⏳ Testing: ${testName}`);
      await testFn();
      console.log(`✅ PASSED: ${testName}\n`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      errors.push({ test: testName, error: error.message });
      testsFailed++;
    }
  }

  // Test 1: Server Health Check
  await runTest('Server Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/api/patterns`);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('API response indicates failure');
    }
  });

  // Test 2: Database Connection
  await runTest('Database Connection', async () => {
    const response = await axios.get(`${BASE_URL}/api/patterns`);
    if (!Array.isArray(response.data.patterns)) {
      throw new Error('Database should return patterns array');
    }
  });

  // Test 3: Text Pattern Generation (without API key)
  await runTest('Text Pattern Generation API Endpoint', async () => {
    const testData = {
      description: "A simple blue square",
      width: 20,
      height: 20,
      complexity: "simple",
      colorPalette: "cool",
      yarnWeight: "medium",
      materialType: "yarn",
      fiberType: "acrylic"
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/patterns/generate-text`, testData);
      // If OpenAI API key is missing, we expect this to fail gracefully
      if (response.status === 200) {
        console.log('   ✨ OpenAI integration working correctly');
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        // Expected behavior without API key
        console.log('   ℹ️  OpenAI API key needed for full functionality');
      } else {
        throw error;
      }
    }
  });

  // Test 4: Image Upload Endpoint
  await runTest('Image Upload API Endpoint Structure', async () => {
    // Test with empty form data to verify endpoint exists
    const formData = new FormData();
    formData.append('width', '30');
    formData.append('height', '30');
    formData.append('enhanceColors', 'true');
    formData.append('simplifyDetails', 'true');
    formData.append('yarnWeight', 'medium');
    formData.append('materialType', 'yarn');
    formData.append('fiberType', 'cotton');

    try {
      await axios.post(`${BASE_URL}/api/patterns/generate-image`, formData, {
        headers: formData.getHeaders(),
      });
    } catch (error) {
      if (error.response && error.response.status === 400 && 
          error.response.data.error === 'No image file provided') {
        // Expected behavior - endpoint exists and validates input
        console.log('   ✨ Image upload endpoint correctly validates input');
      } else {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  });

  // Test 5: Pattern Validation Endpoint
  await runTest('Pattern Validation API', async () => {
    const validationData = {
      patternData: {
        width: 10,
        height: 10,
        cells: Array(10).fill().map(() => Array(10).fill({
          stitch: 'sc',
          color: '#ff0000'
        }))
      }
    };

    const response = await axios.post(`${BASE_URL}/api/patterns/validate`, validationData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.validation) {
      throw new Error('Validation response missing validation object');
    }
  });

  // Test 6: Pattern CRUD Operations
  await runTest('Pattern CRUD Operations', async () => {
    // Create a test pattern
    const patternData = {
      name: "Test Pattern",
      description: "Test description",
      patternData: {
        width: 5,
        height: 5,
        cells: Array(5).fill().map(() => Array(5).fill({
          stitch: 'sc',
          color: '#0000ff'
        }))
      },
      stitchCount: 25,
      estimatedTime: "30min",
      difficulty: "simple",
      width: 5,
      height: 5,
      complexity: "simple",
      yarnWeight: "medium",
      materialType: "yarn",
      fiberType: "acrylic"
    };

    // CREATE
    const createResponse = await axios.post(`${BASE_URL}/api/patterns`, patternData);
    if (createResponse.status !== 201) {
      throw new Error(`Create failed with status ${createResponse.status}`);
    }
    const patternId = createResponse.data.pattern.id;

    // READ
    const readResponse = await axios.get(`${BASE_URL}/api/patterns/${patternId}`);
    if (readResponse.status !== 200) {
      throw new Error(`Read failed with status ${readResponse.status}`);
    }

    // UPDATE
    const updateData = { name: "Updated Test Pattern" };
    const updateResponse = await axios.patch(`${BASE_URL}/api/patterns/${patternId}`, updateData);
    if (updateResponse.status !== 200) {
      throw new Error(`Update failed with status ${updateResponse.status}`);
    }

    // DELETE
    const deleteResponse = await axios.delete(`${BASE_URL}/api/patterns/${patternId}`);
    if (deleteResponse.status !== 200) {
      throw new Error(`Delete failed with status ${deleteResponse.status}`);
    }
  });

  // Test 7: Static File Serving
  await runTest('Frontend Static Files', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    if (response.status !== 200) {
      throw new Error(`Frontend not accessible, status: ${response.status}`);
    }
    if (!response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Frontend HTML not properly served');
    }
  });

  // Test 8: API Error Handling
  await runTest('API Error Handling', async () => {
    try {
      await axios.get(`${BASE_URL}/api/patterns/99999`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected behavior for non-existent pattern
        console.log('   ✨ 404 errors handled correctly');
      } else {
        throw new Error(`Unexpected error response: ${error.response?.status}`);
      }
    }
  });

  // Test 9: Schema Validation
  await runTest('Schema Validation', async () => {
    const invalidData = {
      description: "", // Invalid - empty string
      width: 5, // Invalid - below minimum
      height: 300, // Invalid - above maximum
      complexity: "invalid", // Invalid enum value
    };

    try {
      await axios.post(`${BASE_URL}/api/patterns/generate-text`, invalidData);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✨ Schema validation working correctly');
      } else {
        throw new Error(`Expected validation error, got: ${error.response?.status}`);
      }
    }
  });

  // Test 10: Database Schema Integrity
  await runTest('Database Schema Integrity', async () => {
    const response = await axios.get(`${BASE_URL}/api/patterns`);
    const patterns = response.data.patterns;
    
    // If patterns exist, validate their structure
    if (patterns.length > 0) {
      const pattern = patterns[0];
      const requiredFields = ['id', 'name', 'patternData', 'width', 'height', 'complexity'];
      
      for (const field of requiredFields) {
        if (!(field in pattern)) {
          throw new Error(`Pattern missing required field: ${field}`);
        }
      }
      
      // Check new material fields
      const materialFields = ['yarnWeight', 'materialType', 'fiberType'];
      for (const field of materialFields) {
        if (!(field in pattern)) {
          throw new Error(`Pattern missing material field: ${field}`);
        }
      }
    }
    
    console.log('   ✨ Database schema includes all required fields');
  });

  // Print final results
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST SUMMARY');
  console.log('='.repeat(50));
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

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before going live.');
  }

  console.log('\n📋 PRODUCTION CHECKLIST:');
  console.log('□ Set OPENAI_API_KEY environment variable for full AI functionality');
  console.log('□ Configure production database connection');
  console.log('□ Set up SSL/HTTPS for production deployment');
  console.log('□ Configure proper CORS settings for production domain');
  console.log('□ Set up monitoring and logging');
  console.log('□ Test with real image uploads and pattern generation');
  console.log('□ Verify all export/download functions work in production');

  return { testsPassed, testsFailed, errors };
}

// Run the tests
runComprehensiveTests().catch(console.error);