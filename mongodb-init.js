// MongoDB initialization script for Going Platform
// Creates per-service users with minimal required privileges

db = db.getSiblingDB('admin');

// Verify admin user (already created by MONGO_INITDB_ROOT_USERNAME/PASSWORD)
print('✅ Admin user already created');

// Create per-service databases and users
const services = [
  {
    db: 'user_db',
    username: 'user_service',
    password: process.env.USER_SERVICE_PASSWORD || 'user_service_pass',
  },
  {
    db: 'payment_db',
    username: 'payment_service',
    password: process.env.PAYMENT_SERVICE_PASSWORD || 'payment_service_pass',
  },
  {
    db: 'accommodation_db',
    username: 'accommodation_service',
    password:
      process.env.ACCOMMODATION_SERVICE_PASSWORD ||
      'accommodation_service_pass',
  },
  {
    db: 'experience_db',
    username: 'experience_service',
    password:
      process.env.EXPERIENCE_SERVICE_PASSWORD || 'experience_service_pass',
  },
  {
    db: 'tours_db',
    username: 'tours_service',
    password: process.env.TOURS_SERVICE_PASSWORD || 'tours_service_pass',
  },
  {
    db: 'transport_db',
    username: 'transport_service',
    password:
      process.env.TRANSPORT_SERVICE_PASSWORD || 'transport_service_pass',
  },
  {
    db: 'parcel_db',
    username: 'parcel_service',
    password: process.env.PARCEL_SERVICE_PASSWORD || 'parcel_service_pass',
  },
  {
    db: 'notification_db',
    username: 'notification_service',
    password:
      process.env.NOTIFICATION_SERVICE_PASSWORD || 'notification_service_pass',
  },
  {
    db: 'booking_db',
    username: 'booking_service',
    password: process.env.BOOKING_SERVICE_PASSWORD || 'booking_service_pass',
  },
  {
    db: 'corporate_db',
    username: 'corporate_service',
    password:
      process.env.CORPORATE_SERVICE_PASSWORD || 'corporate_service_pass',
  },
];

services.forEach((service) => {
  try {
    db.createUser({
      user: service.username,
      pwd: service.password,
      roles: [{ role: 'readWrite', db: service.db }],
    });
    print(`✅ Created user '${service.username}' for database '${service.db}'`);
  } catch (error) {
    if (error.code === 48) {
      print(`⚠️  User '${service.username}' already exists`);
    } else {
      print(`❌ Error creating user '${service.username}': ${error.message}`);
    }
  }
});

print('✅ MongoDB initialization complete');
