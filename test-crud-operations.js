// Test script for CRUD operations
// Run this with: node test-crud-operations.js

const BASE_URL = 'http://localhost:3000/api/clients';

async function testCrudOperations() {
  console.log('🧪 Testing Client CRUD Operations...\n');

  let createdClientId = null;

  try {
    // 1. CREATE - Test creating a new client
    console.log('1️⃣ Testing CREATE operation...');
    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Client CRUD',
        email: 'testcrud@example.com',
        phone: '555-0199',
        company: 'CRUD Test Company',
        address: '123 Test Street, Test City, TC 12345'
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      createdClientId = createData.id;
      console.log('✅ CREATE successful:', createData);
    } else {
      const error = await createResponse.json();
      console.log('❌ CREATE failed:', error);
      return;
    }

    // 2. READ ALL - Test fetching all clients
    console.log('\n2️⃣ Testing READ ALL operation...');
    const readAllResponse = await fetch(BASE_URL);
    
    if (readAllResponse.ok) {
      const readAllData = await readAllResponse.json();
      console.log(`✅ READ ALL successful: Found ${readAllData.clients.length} clients`);
      console.log('First few clients:', readAllData.clients.slice(0, 2));
    } else {
      const error = await readAllResponse.json();
      console.log('❌ READ ALL failed:', error);
    }

    // 3. READ ONE - Test fetching a specific client
    console.log('\n3️⃣ Testing READ ONE operation...');
    const readOneResponse = await fetch(`${BASE_URL}/${createdClientId}`);
    
    if (readOneResponse.ok) {
      const readOneData = await readOneResponse.json();
      console.log('✅ READ ONE successful:', readOneData);
    } else {
      const error = await readOneResponse.json();
      console.log('❌ READ ONE failed:', error);
    }

    // 4. UPDATE - Test updating the client
    console.log('\n4️⃣ Testing UPDATE operation...');
    const updateResponse = await fetch(`${BASE_URL}/${createdClientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Test Client CRUD',
        email: 'updated-testcrud@example.com',
        phone: '555-0299',
        company: 'Updated CRUD Test Company',
        address: '456 Updated Street, Updated City, UC 54321'
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ UPDATE successful:', updateData);
    } else {
      const error = await updateResponse.json();
      console.log('❌ UPDATE failed:', error);
    }

    // 5. DELETE - Test deleting the client
    console.log('\n5️⃣ Testing DELETE operation...');
    const deleteResponse = await fetch(`${BASE_URL}/${createdClientId}`, {
      method: 'DELETE'
    });

    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ DELETE successful:', deleteData);
    } else {
      const error = await deleteResponse.json();
      console.log('❌ DELETE failed:', error);
    }

    // 6. VERIFY DELETE - Test that the client is gone
    console.log('\n6️⃣ Verifying DELETE operation...');
    const verifyResponse = await fetch(`${BASE_URL}/${createdClientId}`);
    
    if (verifyResponse.status === 404) {
      console.log('✅ DELETE verified: Client not found (as expected)');
    } else {
      console.log('❌ DELETE verification failed: Client still exists');
    }

    console.log('\n🎉 All CRUD operations completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testCrudOperations();