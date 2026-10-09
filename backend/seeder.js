const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
    try {
        // 🔑 WAIT for DB connection
        await connectDB();

        await User.deleteMany();

        const hashedPassword = await bcrypt.hash('Rajesh@2026', 10);

        const adminUser = await User.create({
            name: 'Rajesh Thakur',
            email: 'rajeshthakur2006@gmail.com',
            password: hashedPassword,
            isAdmin: true,
            role: 'admin',
        });

        console.log(`✅ Admin created: ${adminUser.email}`);
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

const destroyAdmin = async () => {
    try {
        await connectDB();
        await User.deleteMany();
        console.log('🧹 All users removed');
        process.exit();
    } catch (error) {
        console.error('❌ Error destroying users:', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyAdmin();
} else {
    seedAdmin();
}
