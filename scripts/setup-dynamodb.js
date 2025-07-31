const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// Create DynamoDB client for DynamoDB Local
const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://dynamodb-local:8000',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  },
  maxAttempts: 5,
  requestTimeout: 10000
});

async function createTable() {
  const params = {
    TableName: 'fragments',
    AttributeDefinitions: [
      {
        AttributeName: 'ownerId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'id',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'ownerId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'id',
        KeyType: 'RANGE'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 5
    }
  };

  // Retry logic for connection issues
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Attempt ${attempt} to create DynamoDB table...`);
      const command = new CreateTableCommand(params);
      const result = await dynamoDBClient.send(command);
      console.log('DynamoDB table created successfully:', result);
      return;
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('Table already exists');
        return;
      } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        console.log(`Connection error on attempt ${attempt}, retrying in 2 seconds...`);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      console.error('Error creating table:', error);
      throw error;
    }
  }
}

createTable(); 