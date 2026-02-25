# Budolshap V2

**Version 2.0** - Multi-vendor E-commerce Platform with Advanced Features

## 🚀 New Features in V2

### WYSIWYG Product Descriptions
- Advanced rich text editor for product descriptions
- Support for formatting, colors, emojis, and more
- Resizable editor interface
- HTML content storage and rendering

### Enhanced Order Management
- Improved order tracking UI
- Better delivery status visualization
- Lalamove integration for delivery
- Real-time order updates

### Store Management
- Multiple store address support
- Store geocoding for accurate locations
- Enhanced store dashboard
- Product management improvements

### Payment Integration
- GCash payment support via PayMongo
- COD (Cash on Delivery) option
- Secure payment processing
- Payment status tracking

### User Experience
- Responsive design improvements
- Better loading states
- Enhanced error handling
- Improved navigation

## 📋 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Vercel) / MySQL (Local)
- **Authentication**: JWT-based auth
- **Payment**: PayMongo (GCash)
- **Delivery**: Lalamove API
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/derflanoj2/budolshap-v2.git

# Navigate to project directory
cd budolshap-v2

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

## 📝 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="your-database-url"

# Authentication
JWT_SECRET="your-jwt-secret"

# PayMongo
PAYMONGO_SECRET_KEY="your-paymongo-secret"
PAYMONGO_PUBLIC_KEY="your-paymongo-public"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Lalamove
LALAMOVE_API_KEY="your-lalamove-key"
LALAMOVE_API_SECRET="your-lalamove-secret"
LALAMOVE_ENVIRONMENT="sandbox" # or "production"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_CURRENCY_SYMBOL="₱"
```

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## 📚 Documentation

- [WYSIWYG Implementation Guide](./WYSIWYG_FINAL_IMPLEMENTATION.html)
- [Lalamove Integration](./LALAMOVE_COMPLETE_DOCUMENTATION.html)
- [Payment Setup](./GCASH_PAYMENT_SETUP.html)
- [Database Configuration](./DATABASE_CONFIG_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Test credentials (Development)
Email: peter.parker@budolshap.com
Password: budolshap
```

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributors

- Jon Galvez (@derflanoj2)

## 🔗 Links

- [Production Site](https://budolshap-tjt44zj9f-derflanoj2s-projects.vercel.app)
- [Documentation](./DOCUMENTATION.md)
- [API Reference](./API_REFERENCE.md)

## 📧 Support

For support, email support@budolshap.com or create an issue in this repository.

---

**Version 2.0** - Built with ❤️ using Next.js and React
