const axios = require('axios');

class PocketBaseClient {
  constructor() {
    this.baseURL = process.env.POCKETBASE_URL || 'http://localhost:8090';
    this.adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    this.adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
    this.authToken = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/api/admins/auth-with-password`, {
        identity: this.adminEmail,
        password: this.adminPassword
      });
      
      this.authToken = response.data.token;
      console.log('✅ PocketBase authentication successful');
      return true;
    } catch (error) {
      console.error('❌ PocketBase authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async createCollection(name, schema) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/collections`,
        {
          name,
          type: 'base',
          schema
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Collection '${name}' created successfully`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  Collection '${name}' already exists`);
        return null;
      }
      console.error(`❌ Failed to create collection '${name}':`, error.response?.data || error.message);
      throw error;
    }
  }

  async createRecord(collection, data) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/collections/${collection}/records`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create record in '${collection}':`, error.response?.data || error.message);
      throw error;
    }
  }

  async getRecord(collection, id) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/collections/${collection}/records/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to get record from '${collection}':`, error.response?.data || error.message);
      throw error;
    }
  }

  async updateRecord(collection, id, data) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/api/collections/${collection}/records/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update record in '${collection}':`, error.response?.data || error.message);
      throw error;
    }
  }

  async listRecords(collection, options = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await axios.get(
        `${this.baseURL}/api/collections/${collection}/records?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to list records from '${collection}':`, error.response?.data || error.message);
      throw error;
    }
  }
}

// Initialize PocketBase and create collections
async function initializePocketBase() {
  const pb = new PocketBaseClient();
  
  // Authenticate
  await pb.authenticate();

  // Define Orders collection schema
  const ordersSchema = [
    {
      name: 'order_code',
      type: 'text',
      required: true,
      unique: true
    },
    {
      name: 'customer_name',
      type: 'text',
      required: true
    },
    {
      name: 'customer_email',
      type: 'email',
      required: true
    },
    {
      name: 'shipping_address',
      type: 'text',
      required: true
    },
    {
      name: 'notes',
      type: 'text',
      required: false
    },
    {
      name: 'order_date',
      type: 'date',
      required: true
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: {
        values: ['waiting_for_payment', 'to_produce', 'to_send', 'done', 'cancelled', 'refunded']
      }
    },
    {
      name: 'total_price_cad',
      type: 'number',
      required: true
    },
    {
      name: 'tax_amount_cad',
      type: 'number',
      required: true
    }
  ];

  // Define Order Items collection schema
  const orderItemsSchema = [
    {
      name: 'order',
      type: 'relation',
      required: true,
      options: {
        collectionId: '', // Will be set after Orders collection is created
        cascadeDelete: true
      }
    },
    {
      name: 'spoke_count',
      type: 'number',
      required: true
    },
    {
      name: 'wheel_size',
      type: 'text',
      required: true
    },
    {
      name: 'quantity',
      type: 'number',
      required: true
    },
    {
      name: 'unit_price_cad',
      type: 'number',
      required: true
    }
  ];

  // Create Orders collection
  const ordersCollection = await pb.createCollection('orders', ordersSchema);
  
  // Get Orders collection ID for the relation
  if (ordersCollection) {
    const ordersCollectionId = ordersCollection.id;
    
    // Update Order Items schema with the correct collection ID
    orderItemsSchema[0].options.collectionId = ordersCollectionId;
    
    // Create Order Items collection
    await pb.createCollection('order_items', orderItemsSchema);
  }

  // Store the client instance globally for use in routes
  global.pocketbase = pb;
  
  return pb;
}

module.exports = {
  PocketBaseClient,
  initializePocketBase
};
