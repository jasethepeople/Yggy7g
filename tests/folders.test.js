import { expect } from 'chai';

const API_BASE = 'http://localhost:5000';

async function testFolderManagement() {
  console.log('📁 Testing Folder Management System...');
  
  const testUser = {
    username: `folderuser_${Date.now()}`,
    email: `foldertest${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Folder',
    lastName: 'Tester'
  };

  let authCookie = '';
  let testFolderId = null;

  async function runTest(testName, testFn) {
    try {
      await testFn();
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      console.log(`  ❌ ${testName}: ${error.message}`);
      throw error;
    }
  }

  // Setup: Create user and login
  await runTest('Setup: User Registration and Login', async () => {
    // Register
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      throw new Error('Registration failed');
    }

    // Login
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      authCookie = cookies.split(';')[0];
    }
  });

  // Test folder creation
  await runTest('Folder Creation', async () => {
    const folderData = {
      name: 'Test Folder',
      description: 'A test folder for patterns',
      isPublic: false
    };

    const response = await fetch(`${API_BASE}/api/folders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': authCookie 
      },
      body: JSON.stringify(folderData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Folder creation failed');
    }

    if (!data.success || !data.folder) {
      throw new Error('Folder creation response invalid');
    }

    if (data.folder.name !== folderData.name) {
      throw new Error('Folder name mismatch');
    }

    testFolderId = data.folder.id;
  });

  // Test folder retrieval
  await runTest('Folder Retrieval', async () => {
    const response = await fetch(`${API_BASE}/api/folders`, {
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Folder retrieval failed');
    }

    if (!data.success || !Array.isArray(data.folders)) {
      throw new Error('Folder retrieval response invalid');
    }

    const folder = data.folders.find(f => f.id === testFolderId);
    if (!folder) {
      throw new Error('Created folder not found in list');
    }
  });

  // Test folder update
  await runTest('Folder Update', async () => {
    const updateData = {
      name: 'Updated Test Folder',
      description: 'Updated description'
    };

    const response = await fetch(`${API_BASE}/api/folders/${testFolderId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': authCookie 
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Folder update failed');
    }

    if (!data.success || !data.folder) {
      throw new Error('Folder update response invalid');
    }

    if (data.folder.name !== updateData.name) {
      throw new Error('Folder name not updated');
    }
  });

  // Test unauthorized folder access
  await runTest('Unauthorized Folder Access Prevention', async () => {
    const response = await fetch(`${API_BASE}/api/folders`);

    if (response.ok) {
      throw new Error('Should have prevented unauthorized folder access');
    }

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test folder deletion
  await runTest('Folder Deletion', async () => {
    const response = await fetch(`${API_BASE}/api/folders/${testFolderId}`, {
      method: 'DELETE',
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Folder deletion failed');
    }

    if (!data.success) {
      throw new Error('Folder deletion response invalid');
    }
  });

  // Test deleted folder not found
  await runTest('Deleted Folder Not Found', async () => {
    const response = await fetch(`${API_BASE}/api/folders`, {
      headers: { 'Cookie': authCookie }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to fetch folders after deletion');
    }

    const folder = data.folders.find(f => f.id === testFolderId);
    if (folder) {
      throw new Error('Deleted folder still found in list');
    }
  });

  console.log('📁 Folder management tests completed successfully!');
  return true;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFolderManagement().catch(console.error);
}

export { testFolderManagement };