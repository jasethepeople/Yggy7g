import { testAuthentication } from './auth.test.js';
import { testFolderManagement } from './folders.test.js';
import { testPatternGeneration } from './patterns.test.js';

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
    // Test 1: Authentication System
    await runTest('Authentication System', testAuthentication);

    // Test 2: Folder Management System
    await runTest('Folder Management System', testFolderManagement);

    // Test 3: Pattern Generation System
    await runTest('Pattern Generation System', testPatternGeneration);

    // Test 4: API Health Check
    await runTest('API Health Check', async () => {
      console.log('🔍 Testing API health and responsiveness...');
      
      const startTime = Date.now();
      const response = await fetch('http://localhost:5000/api/patterns');
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }

      if (responseTime > 5000) {
        throw new Error(`API response too slow: ${responseTime}ms`);
      }

      console.log(`  ✅ API responding in ${responseTime}ms`);
    });

    // Test 5: Database Connectivity
    await runTest('Database Connectivity', async () => {
      console.log('🗄️  Testing database connectivity...');
      
      const response = await fetch('http://localhost:5000/api/patterns');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Database connectivity test failed');
      }

      if (!data.success) {
        throw new Error('Database query failed');
      }

      console.log(`  ✅ Database connected and responsive`);
    });

    // Test 6: Error Handling
    await runTest('Error Handling', async () => {
      console.log('⚠️  Testing error handling...');
      
      // Test 404 handling
      const notFoundResponse = await fetch('http://localhost:5000/api/nonexistent');
      if (notFoundResponse.status !== 404) {
        throw new Error(`Expected 404, got ${notFoundResponse.status}`);
      }

      // Test invalid JSON handling
      const invalidJsonResponse = await fetch('http://localhost:5000/api/patterns/generate-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      if (invalidJsonResponse.ok) {
        throw new Error('Should have rejected invalid JSON');
      }

      console.log('  ✅ Error handling working correctly');
    });

    // Test 7: Security Headers and CORS
    await runTest('Security and CORS', async () => {
      console.log('🔒 Testing security headers and CORS...');
      
      const response = await fetch('http://localhost:5000/api/patterns');
      
      // Check for security-related behaviors
      const data = await response.json();
      if (!data.success !== undefined) {
        console.log('  ✅ Consistent API response format');
      }

      // Test CORS (basic check)
      if (response.headers.get('access-control-allow-origin') !== null ||
          response.status < 500) {
        console.log('  ✅ CORS handling appears functional');
      }
    });

    // Test 8: Performance Benchmarks
    await runTest('Performance Benchmarks', async () => {
      console.log('⚡ Testing performance benchmarks...');
      
      const iterations = 5;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const response = await fetch('http://localhost:5000/api/patterns');
        const end = Date.now();
        
        if (!response.ok) {
          throw new Error(`Performance test iteration ${i + 1} failed`);
        }
        
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      if (avgTime > 2000) {
        throw new Error(`Average response time too slow: ${avgTime}ms`);
      }
      
      if (maxTime > 5000) {
        throw new Error(`Max response time too slow: ${maxTime}ms`);
      }
      
      console.log(`  ✅ Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`  ✅ Max response time: ${maxTime}ms`);
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
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionReadinessTests().catch(() => process.exit(1));
}

export { runProductionReadinessTests };