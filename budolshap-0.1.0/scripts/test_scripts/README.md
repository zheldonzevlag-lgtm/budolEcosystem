budolShap
==========================================================================
🚀 Features
For Buyers
🛒 Multi-Store Shopping - Shop from multiple stores in a single checkout
💳 Flexible Payment - GCash & Cash on Delivery (COD) support
📦 Order Tracking - Track orders from placement to delivery
🔄 Returns & Refunds - Easy return request system
💬 Chat with Sellers - Real-time communication with store owners
📧 Email Notifications - Stay updated on order status
For Sellers
🏪 Store Management - Create and customize your store
📦 Product Management - Add, edit, and delete products
📊 Order Management - Process and track orders
🚚 Shipping Profiles - Set custom shipping rates
🎟️ Coupon System - Create discount coupons
💰 Wallet & Payouts - Track earnings and request payouts
🔄 Return Handling - Manage return requests
💬 Customer Chat - Communicate with buyers
For Admins
📈 Analytics Dashboard - Platform-wide insights
💵 Payout Management - Approve/reject payout requests
✅ Store Verification - Verify and approve stores
👥 User Management - Manage all platform users
📊 Revenue Tracking - Monitor GMV and commission
🛠️ Tech Stack
Frontend: Next.js 14, React, CSS
Backend: Next.js API Routes, Node.js
Database: MySQL with Prisma ORM
Authentication: JWT (JSON Web Tokens)
Payment: PayMongo (GCash)
Email: Nodemailer
Icons: Lucide React
Notifications: React Hot Toast
📋 Prerequisites
Before you begin, ensure you have:

Node.js 18 or higher
MySQL database
npm or yarn package manager
🚀 Quick Start
1. Clone the Repository
git clone <repository-url>
cd budolshap
2. Install Dependencies
npm install
3. Configure Environment Variables
Create a .env file in the root directory:

# Database
DATABASE_URL="mysql://user:password@localhost:3306/budolshap"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PayMongo (GCash)
PAYMONGO_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# SMTP Configuration (Optional - for email notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@budolshap.com"
4. Setup Database
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
5. Run Development Server
npm run dev
Visit http://localhost:3000 to see your application.

📚 Documentation
Complete Documentation - Comprehensive platform guide
GCash Integration - Payment implementation details
API Reference - Detailed API documentation
Project Roadmap - Development phases and tasks
🏗️ Project Structure
budolshap/
├── app/                      # Next.js app directory
│   ├── (public)/            # Public pages (home, products, cart)
│   ├── admin/               # Admin dashboard pages
│   ├── store/               # Seller dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── admin/              # Admin components
│   └── store/              # Seller components
├── lib/                     # Utility functions
│   ├── auth.js             # Authentication helpers
│   ├── adminAuth.js        # Admin authentication
│   ├── email.js            # Email utilities
│   └── prisma.js           # Prisma client
├── prisma/                  # Database schema and migrations
│   └── schema.prisma       # Prisma schema
├── public/                  # Static assets
│   └── .env                     # Environment variables
🔑 User Roles
Buyer (Default)
Browse and purchase products
Manage orders and returns
Chat with sellers
Seller
Create and manage store
Add and manage products
Process orders and returns
Manage wallet and payouts
Admin
Platform oversight
Approve payouts and stores
View analytics
Manage users
💰 Commission Model
The platform operates on a 10% commission model:

Platform takes 10% of product total (excluding shipping)
Seller receives 90% of product total
Shipping cost goes 100% to seller
Example:

Product Total: ₱1,000
Shipping: ₱100
Platform Commission: ₱100 (10% of ₱1,000)
Seller Receives: ₱900 + ₱100 = ₱1,000
🔐 Creating an Admin User
To create an admin user, update the database directly:

UPDATE User SET isAdmin = true WHERE email = 'admin@example.com';
Or use Prisma Studio:

npx prisma studio
📧 Email Configuration
Email notifications require SMTP configuration. If not configured, emails will be logged to the console.

Gmail Setup
Enable 2-factor authentication
Generate an app password
Use app password in SMTP_PASS
🗄️ Database Management
View Database
npx prisma studio
Create Migration
npx prisma migrate dev --name description_of_change
Reset Database
npx prisma migrate reset
🧪 Testing
Manual Testing Checklist
Buyer Flow:

✅ Register and login
✅ Browse products
✅ Add to cart
✅ Checkout (multi-store)
✅ Track orders
✅ Request return
✅ Chat with seller
Seller Flow:

✅ Create store
✅ Add products
✅ Manage orders
✅ Set shipping profile
✅ Create coupons
✅ Request payout
✅ Handle returns
✅ Chat with buyers
Admin Flow:

✅ View analytics
✅ Approve payouts
✅ Verify stores
✅ Manage platform
🚀 Deployment
Vercel (Recommended)
Push code to GitHub
Import project in Vercel
Add environment variables
Deploy
Other Platforms
The application can be deployed to any platform that supports Next.js:

Netlify
Railway
DigitalOcean
AWS
Heroku
🔧 Configuration
Commission Rate
To change the commission rate, update the calculation in:

app/api/orders/route.js (line ~180)
const commissionRate = 0.10 // Change to desired rate (e.g., 0.15 for 15%)
Email Templates
Email templates are in lib/email.js. Customize them to match your branding.

📈 Future Enhancements
 More Payment Gateways (PayPal, Stripe)
 Real-time chat with WebSockets
 Product reviews and ratings
 Inventory management
 Advanced analytics with charts
 Mobile app (React Native)
 Multi-language support
 Advanced search with filters
🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Next.js team for the amazing framework
Prisma team for the excellent ORM
Lucide for beautiful icons
All contributors and users
📞 Support
For support, email support@budolshap.com or open an issue on GitHub.

🔗 Links
Documentation
API Reference
Live Demo (Coming soon)
Built with ❤️ using Next.js, Prisma, and MySQL

Version: 1.0.0
