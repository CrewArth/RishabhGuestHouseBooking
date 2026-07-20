import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import User from '../models/User.js';

// Resolve environment variables path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('🔌 MongoDB Connected Successfully');
  } catch (error) {
    console.error(`❌ Error Connecting MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const seedDefaults = async () => {
  console.log('\n--- Seeding Default Administrators ---');

  const defaultUsers = [
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@guesthouse.com',
      phone: 9999999999,
      password: 'SuperAdmin@123',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    {
      firstName: 'General',
      lastName: 'Admin',
      email: 'admin@guesthouse.com',
      phone: 8888888888,
      password: 'AdminUser@123',
      role: 'ADMIN',
      isActive: true,
    }
  ];

  for (const userData of defaultUsers) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ User with email "${userData.email}" already exists. Skipping.`);
        continue;
      }

      // Check phone uniqueness
      const existingPhone = await User.findOne({ phone: userData.phone });
      if (existingPhone) {
        console.log(`⚠️ User with phone "${userData.phone}" already exists. Skipping.`);
        continue;
      }

      const newUser = new User(userData);
      await newUser.save();
      console.log(`✅ Created ${userData.role}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    } catch (err) {
      console.error(`❌ Failed to create ${userData.email}: ${err.message}`);
    }
  }
};

const promptInteractive = async () => {
  const rl = readline.createInterface({ input, output });

  console.log('\n--- Create Custom Admin/Super Admin ---');

  try {
    // 1. Choose Role
    let role = '';
    while (true) {
      const roleChoice = await rl.question('Choose Role:\n 1. SUPER_ADMIN\n 2. ADMIN\nEnter choice (1 or 2): ');
      if (roleChoice.trim() === '1') {
        role = 'SUPER_ADMIN';
        break;
      } else if (roleChoice.trim() === '2') {
        role = 'ADMIN';
        break;
      }
      console.log('❌ Invalid choice. Please enter 1 or 2.');
    }

    // 2. First Name
    let firstName = '';
    while (true) {
      firstName = (await rl.question('Enter First Name (min 2 chars): ')).trim();
      if (firstName.length >= 2) break;
      console.log('❌ First name must be at least 2 characters.');
    }

    // 3. Last Name
    let lastName = '';
    while (true) {
      lastName = (await rl.question('Enter Last Name: ')).trim();
      if (lastName.length > 0) break;
      console.log('❌ Last name is required.');
    }

    // 4. Email
    let email = '';
    while (true) {
      email = (await rl.question('Enter Email: ')).trim().toLowerCase();
      if (validateEmail(email)) {
        const emailExists = await User.findOne({ email });
        if (!emailExists) break;
        console.log('❌ Email already registered. Please choose another email.');
      } else {
        console.log('❌ Please enter a valid email address.');
      }
    }

    // 5. Phone
    let phoneNum = NaN;
    while (true) {
      const phoneInput = (await rl.question('Enter Phone Number (numeric digits only, min 6 digits): ')).trim();
      phoneNum = Number(phoneInput);
      if (!isNaN(phoneNum) && phoneInput.length >= 6) {
        const phoneExists = await User.findOne({ phone: phoneNum });
        if (!phoneExists) break;
        console.log('❌ Phone number already registered. Please enter a different number.');
      } else {
        console.log('❌ Please enter a valid numeric phone number (minimum 6 digits).');
      }
    }

    // 6. Address
    const address = (await rl.question('Enter Address (optional, press Enter to skip): ')).trim();

    // 7. Password
    let password = '';
    while (true) {
      password = await rl.question('Enter Password (min 6 chars): ');
      if (password.length >= 6) break;
      console.log('❌ Password must be at least 6 characters.');
    }

    const customUser = new User({
      firstName,
      lastName,
      email,
      phone: phoneNum,
      address: address || undefined,
      role,
      password,
      isActive: true,
    });

    await customUser.save();
    console.log(`\n🎉 Successfully created ${role} user:`);
    console.log(`   Name:  ${firstName} ${lastName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Phone: ${phoneNum}`);
  } catch (err) {
    console.error(`❌ Error saving user: ${err.message}`);
  } finally {
    rl.close();
  }
};

const run = async () => {
  await connectDB();

  const isDefaultFlag = process.argv.includes('--default') || process.argv.includes('-d');

  if (isDefaultFlag) {
    await seedDefaults();
  } else {
    await promptInteractive();
  }

  await mongoose.disconnect();
  console.log('🔌 MongoDB Disconnected');
};

run().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
