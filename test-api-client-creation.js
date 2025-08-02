import fetch from 'node-fetch';

async function testClientCreation() {
  try {
    console.log('Testing client creation API...');
    
    const testData = {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '123-456-7890',
      company: 'Test Company'
    };

    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    const result = await response.text();
    console.log('Response body:', result);

    if (!response.ok) {
      console.error('❌ API call failed');
      return false;
    }

    console.log('✅ API call successful');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testClientCreation().then(success => {
  process.exit(success ? 0 : 1);
});