import { expect } from 'chai';

const API_BASE = 'http://localhost:5000';

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  };

  let authCookie = '';

  async function runTest(testName, testFn) {
    try {
      await testFn();
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      console.log(`  ❌ ${testName}: ${error.message}`);
      throw error;
    }
  }

  // Test user registration
  await runTest('User Registration', async () => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (!data.success || !data.user) {
      throw new Error('Registration response invalid');
    }

    if (data.user.email !== testUser.email) {
      throw new Error('User email mismatch');
    }
  });

  // Test duplicate registration prevention
  await runTest('Duplicate Registration Prevention', async () => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (response.ok) {
      throw new Error('Should have prevented duplicate registration');
    }
  });

  // Test user login
  await runTest('User Login', async () => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (!data.success || !data.user) {
      throw new Error('Login response invalid');
    }

    // Store session cookie
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      authCookie = cookies.split(';')[0];
    }
  });

  // Test invalid login
  await runTest('Invalid Login Prevention', async () => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrongpassword'
      })
    });

    if (response.ok) {
      throw new Error('Should have prevented invalid login');
    }
  });

  // Test authenticated user retrieval
  await runTest('Authenticated User Retrieval', async () => {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user');
    }

    if (!data.success || !data.user) {
      throw new Error('User retrieval response invalid');
    }

    if (data.user.email !== testUser.email) {
      throw new Error('User data mismatch');
    }
  });

  // Test protected route access
  await runTest('Protected Route Access', async () => {
    const response = await fetch(`${API_BASE}/api/folders`, {
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to access protected route');
    }

    if (!data.success) {
      throw new Error('Protected route response invalid');
    }
  });

  // Test unauthorized access prevention
  await runTest('Unauthorized Access Prevention', async () => {
    const response = await fetch(`${API_BASE}/api/folders`);

    if (response.ok) {
      throw new Error('Should have prevented unauthorized access');
    }

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test logout
  await runTest('User Logout', async () => {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }

    if (!data.success) {
      throw new Error('Logout response invalid');
    }
  });

  // Test post-logout access prevention
  await runTest('Post-logout Access Prevention', async () => {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      headers: { 'Cookie': authCookie }
    });

    if (response.ok) {
      throw new Error('Should have prevented post-logout access');
    }
  });

  console.log('🔐 Authentication tests completed successfully!');
  return true;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthentication().catch(console.error);
}

export { testAuthentication };