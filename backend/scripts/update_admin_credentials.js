const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function updateAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const targetEmail = 'rajeshthakur2006@gmail.com';
    const plainPassword = 'Rajesh@2026';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 1. Demote any other admin users if desired
    const demoteResult = await User.updateMany(
      { email: { $ne: targetEmail }, isAdmin: true },
      { $set: { isAdmin: false, role: 'customer' } }
    );
    console.log(`Demoted previous admin accounts: ${demoteResult.modifiedCount}`);

    // 2. Check if target user exists
    let user = await User.findOne({ email: targetEmail });

    if (user) {
      user.password = hashedPassword;
      user.isAdmin = true;
      user.role = 'admin';
      user.isEmailVerified = true;
      user.failedLoginAttempts = 0;
      user.accountLockUntil = null;
      user.isBlocked = false;
      user.lastPasswordChange = new Date();
      await user.save();
      console.log(`✅ Updated existing user ${targetEmail} to Admin with new password.`);
    } else {
      user = await User.create({
        name: 'Rajesh Thakur',
        email: targetEmail,
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        isEmailVerified: true,
        failedLoginAttempts: 0,
        isBlocked: false,
      });
      console.log(`✅ Created new Admin user ${targetEmail} with new password.`);
    }

    // 3. Verify authentication
    const verifyUser = await User.findOne({ email: targetEmail });
    const isPasswordValid = await bcrypt.compare(plainPassword, verifyUser.password);

    console.log('\n--- VERIFICATION RESULT ---');
    console.log('Email:', verifyUser.email);
    console.log('isAdmin:', verifyUser.isAdmin);
    console.log('Role:', verifyUser.role);
    console.log('Password Match:', isPasswordValid ? 'PASSED ✅' : 'FAILED ❌');
    console.log('Account Blocked:', verifyUser.isBlocked ? 'YES' : 'NO');
    console.log('Failed Login Attempts:', verifyUser.failedLoginAttempts);

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    process.exit(1);
  }
}

updateAdmin();
