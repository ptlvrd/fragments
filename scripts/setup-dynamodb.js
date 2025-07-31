const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// Create DynamoDB client for DynamoDB Local
const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  }
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

  try {
    const command = new CreateTableCommand(params);
    const result = await dynamoDBClient.send(command);
    console.log('DynamoDB table created successfully:', result);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
    }
  }
}

createTable(); 