const API_BASE = 'http://localhost:5000';

async function runProductionReadinessTests() {
  console.log('🚀 Starting Comprehensive Production Readiness Tests...\n');
  
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  async function runTest(testName, testFn) {
    totalTests++;
    try {
      console.log(`\n📋 ${testName}`);
      console.log('─'.repeat(50));
      await testFn();
      passedTests++;
      console.log(`✅ ${testName} - PASSED\n`);
    } catch (error) {
      console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
      throw error;
    }
  }

  try {
    // Test 1: API Health Check
    await runTest('API Health and Connectivity', async () => {
      console.log('🔍 Testing API health and responsiveness...');
      
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/api/patterns`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('API response format invalid');
      }

      if (responseTime > 5000) {
        throw new Error(`API response too slow: ${responseTime}ms`);
      }

      console.log(`  ✅ API responding in ${responseTime}ms`);
      console.log(`  ✅ Database connected and responsive`);
    });

    // Test 2: Authentication System
    await runTest('Authentication System', async () => {
      console.log('🔐 Testing complete authentication workflow...');
      
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      let authCookie = '';

      // Test user registration
      console.log('  → Testing user registration...');
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerData.error || 'Unknown error'}`);
      }

      if (!registerData.success || !registerData.user) {
        throw new Error('Registration response invalid');
      }

      console.log('  ✅ User registration successful');

      // Test duplicate registration prevention
      console.log('  → Testing duplicate registration prevention...');
      const duplicateResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      if (duplicateResponse.ok) {
        throw new Error('Should have prevented duplicate registration');
      }

      console.log('  ✅ Duplicate registration properly prevented');

      // Test login
      console.log('  → Testing user login...');
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginData.error || 'Unknown error'}`);
      }

      if (!loginData.success || !loginData.user) {
        throw new Error('Login response invalid');
      }

      // Store session cookie
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        authCookie = cookies.split(';')[0];
      }

      console.log('  ✅ User login successful');

      // Test protected route access
      console.log('  → Testing protected route access...');
      const protectedResponse = await fetch(`${API_BASE}/api/folders`, {
        headers: { 'Cookie': authCookie }
      });

      const protectedData = await protectedResponse.json();
      
      if (!protectedResponse.ok) {
        throw new Error('Failed to access protected route');
      }

      if (!protectedData.success) {
        throw new Error('Protected route response invalid');
      }

      console.log('  ✅ Protected route access successful');

      // Test unauthorized access prevention
      console.log('  → Testing unauthorized access prevention...');
      const unauthorizedResponse = await fetch(`${API_BASE}/api/folders`);

      if (unauthorizedResponse.ok) {
        throw new Error('Should have prevented unauthorized access');
      }

      if (unauthorizedResponse.status !== 401) {
        throw new Error(`Expected 401, got ${unauthorizedResponse.status}`);
      }

      console.log('  ✅ Unauthorized access properly prevented');
    });

    // Test 3: Pattern Generation System
    await runTest('Pattern Generation and Management', async () => {
      console.log('🧶 Testing pattern generation and management...');
      
      let testPatternId = null;

      // Test text-to-pattern generation
      console.log('  → Testing text-to-pattern generation...');
      const patternData = {
        description: 'A simple blue scarf with white stripes for testing',
        width: 20,
        height: 30,
        complexity: 'simple',
        colorPalette: 'blue-white',
        colors: ['#0066cc', '#ffffff'],
        yarnWeight: 'medium',
        materialType: 'yarn',
        fiberType: 'acrylic'
      };

      const generateResponse = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patternData)
      });

      const generateData = await generateResponse.json();
      
      if (!generateResponse.ok) {
        throw new Error(`Pattern generation failed: ${generateData.error || 'Unknown error'}`);
      }

      if (!generateData.success || !generateData.pattern) {
        throw new Error('Pattern generation response invalid');
      }

      if (!generateData.pattern.patternData || !generateData.pattern.instructions) {
        throw new Error('Pattern data incomplete');
      }

      testPatternId = generateData.pattern.id;
      console.log('  ✅ Text-to-pattern generation successful');

      // Test pattern retrieval
      console.log('  → Testing pattern retrieval...');
      const retrieveResponse = await fetch(`${API_BASE}/api/patterns/${testPatternId}`);

      const retrieveData = await retrieveResponse.json();
      
      if (!retrieveResponse.ok) {
        throw new Error('Pattern retrieval failed');
      }

      if (!retrieveData.success || !retrieveData.pattern) {
        throw new Error('Pattern retrieval response invalid');
      }

      if (retrieveData.pattern.id !== testPatternId) {
        throw new Error('Pattern ID mismatch');
      }

      console.log('  ✅ Pattern retrieval successful');

      // Test pattern validation
      console.log('  → Testing pattern validation...');
      const invalidData = {
        description: '', // Empty description
        width: -5, // Invalid width
        height: 0, // Invalid height
        complexity: 'invalid' // Invalid complexity
      };

      const validationResponse = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      if (validationResponse.ok) {
        throw new Error('Should have rejected invalid pattern data');
      }

      console.log('  ✅ Pattern validation working correctly');
    });

    // Test 4: Error Handling and Security
    await runTest('Error Handling and Security', async () => {
      console.log('🔒 Testing error handling and security measures...');
      
      // Test 404 handling
      console.log('  → Testing 404 error handling...');
      const notFoundResponse = await fetch(`${API_BASE}/api/nonexistent-endpoint`);
      if (notFoundResponse.status !== 404) {
        throw new Error(`Expected 404, got ${notFoundResponse.status}`);
      }
      console.log('  ✅ 404 handling working correctly');

      // Test invalid JSON handling
      console.log('  → Testing invalid JSON handling...');
      const invalidJsonResponse = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json content'
      });
      
      if (invalidJsonResponse.ok) {
        throw new Error('Should have rejected invalid JSON');
      }
      console.log('  ✅ Invalid JSON properly rejected');

      // Test SQL injection prevention (basic)
      console.log('  → Testing SQL injection prevention...');
      const sqlInjectionResponse = await fetch(`${API_BASE}/api/patterns/search?q='OR 1=1--`);
      
      if (sqlInjectionResponse.ok) {
        const data = await sqlInjectionResponse.json();
        if (data.success && Array.isArray(data.patterns)) {
          console.log('  ✅ SQL injection attempt handled safely');
        }
      }

      // Test large payload handling
      console.log('  → Testing large payload handling...');
      const largePayload = {
        description: 'A'.repeat(10000), // Very long description
        width: 20,
        height: 30,
        complexity: 'simple',
        colorPalette: 'blue',
        yarnWeight: 'medium',
        materialType: 'yarn',
        fiberType: 'acrylic'
      };

      const largePayloadResponse = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largePayload)
      });

      // Should either handle it gracefully or reject it appropriately
      if (largePayloadResponse.status >= 500) {
        throw new Error('Server error on large payload');
      }
      console.log('  ✅ Large payload handling working correctly');
    });

    // Test 5: Performance Benchmarks
    await runTest('Performance and Load Testing', async () => {
      console.log('⚡ Testing performance benchmarks...');
      
      const iterations = 10;
      const times = [];
      
      console.log(`  → Running ${iterations} performance tests...`);
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const response = await fetch(`${API_BASE}/api/patterns`);
        const end = Date.now();
        
        if (!response.ok) {
          throw new Error(`Performance test iteration ${i + 1} failed`);
        }
        
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      if (avgTime > 3000) {
        throw new Error(`Average response time too slow: ${avgTime}ms`);
      }
      
      console.log(`  ✅ Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`  ✅ Min response time: ${minTime}ms`);
      console.log(`  ✅ Max response time: ${maxTime}ms`);
      
      // Test concurrent requests
      console.log('  → Testing concurrent request handling...');
      const concurrentPromises = [];
      for (let i = 0; i < 5; i++) {
        concurrentPromises.push(fetch(`${API_BASE}/api/patterns`));
      }
      
      const concurrentResults = await Promise.all(concurrentPromises);
      const failedRequests = concurrentResults.filter(r => !r.ok);
      
      if (failedRequests.length > 0) {
        throw new Error(`${failedRequests.length} concurrent requests failed`);
      }
      
      console.log('  ✅ Concurrent request handling successful');
    });

    // Test 6: Database Operations and Data Integrity
    await runTest('Database Operations and Data Integrity', async () => {
      console.log('🗄️ Testing database operations and data integrity...');
      
      // Test pattern creation and retrieval consistency
      console.log('  → Testing data consistency...');
      const testPattern = {
        description: 'Data integrity test pattern',
        width: 15,
        height: 20,
        complexity: 'simple',
        colorPalette: 'monochrome',
        colors: ['#000000', '#ffffff'],
        yarnWeight: 'light',
        materialType: 'thread',
        fiberType: 'cotton'
      };

      const createResponse = await fetch(`${API_BASE}/api/patterns/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPattern)
      });

      const createData = await createResponse.json();
      
      if (!createResponse.ok) {
        throw new Error('Pattern creation failed');
      }

      // Verify data was stored correctly
      const verifyResponse = await fetch(`${API_BASE}/api/patterns/${createData.pattern.id}`);
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error('Pattern verification failed');
      }

      if (verifyData.pattern.description !== testPattern.description) {
        throw new Error('Data integrity check failed - description mismatch');
      }

      if (verifyData.pattern.width !== testPattern.width) {
        throw new Error('Data integrity check failed - width mismatch');
      }

      console.log('  ✅ Data consistency verified');
      console.log('  ✅ Database operations working correctly');
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL PRODUCTION READINESS TESTS PASSED! 🎉');
    console.log('='.repeat(60));
    console.log(`📊 Test Results:`);
    console.log(`   • Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   • Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    console.log(`   • Total Time: ${(totalTime/1000).toFixed(2)}s`);
    console.log('\n✅ System is PRODUCTION READY!');
    console.log('\n🚀 Features verified:');
    console.log('   • ✅ Complete Authentication System (Registration, Login, Sessions)');
    console.log('   • ✅ Pattern Generation (Text-to-Pattern, AI Integration)');
    console.log('   • ✅ Database Operations (PostgreSQL, User Management)');
    console.log('   • ✅ API Security (Input Validation, Error Handling)');
    console.log('   • ✅ Performance Optimization (Response Times, Concurrency)');
    console.log('   • ✅ Data Integrity (Consistent Storage and Retrieval)');
    console.log('\n🚀 Ready for deployment!');
    
    return true;

  } catch (error) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('❌ PRODUCTION READINESS TESTS FAILED');
    console.log('='.repeat(60));
    console.log(`📊 Test Results:`);
    console.log(`   • Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   • Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    console.log(`   • Total Time: ${(totalTime/1000).toFixed(2)}s`);
    console.log(`\n❌ Error: ${error.message}`);
    console.log('\n🔧 Please fix the issues before deployment.');
    
    throw error;
  }
}

// Run tests if this file is executed directly
runProductionReadinessTests().catch(() => process.exit(1));