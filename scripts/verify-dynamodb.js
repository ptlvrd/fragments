const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// Create DynamoDB client for DynamoDB Local
const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://dynamodb-local:8000',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  }
});

async function verifyTable() {
  try {
    const command = new ListTablesCommand({});
    const result = await dynamoDBClient.send(command);
    console.log('Available tables:', result.TableNames);
    
    if (!result.TableNames.includes('fragments')) {
      throw new Error('fragments table not found');
    }
    
    console.log('✅ DynamoDB table verification successful');
  } catch (error) {
    console.error('❌ DynamoDB table verification failed:', error);
    process.exit(1);
  }
}

verifyTable(); 