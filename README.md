#  E-Commerce API

A production-ready microservice backend for e-commerce with complex state management, transactional integrity, and asynchronous processing.

## 🚀 Features

- **JWT Authentication** with role-based access control (User/Admin)
- **Complex Order State Management** (PENDING_PAYMENT → PAID → SHIPPED → DELIVERED)
- **Inventory Reservation System** preventing race conditions
- **Database Transactions** for atomic operations
- **Automatic Order Expiration** (15-minute payment window)
- **Mock Payment Processing** with success/failure simulation
- **Asynchronous Email Notifications** (queued background jobs)
- **Pagination, Filtering & Sorting** on all list endpoints
- **Comprehensive Validation** using Joi
- **Centralized Error Handling**

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/poojamore24/ecommerce.git 
cd ecommerce-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# If using MongoDB locally
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
ecommerce-api/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── constants.js         # Application constants
│   ├── models/
│   │   ├── User.js              # User model with bcrypt
│   │   ├── Product.js           # Product with stock management
│   │   ├── Cart.js              # Shopping cart
│   │   ├── Order.js             # Order with status enum
│   │   └── Payment.js           # Payment records
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── validate.js          # Joi validation
│   │   └── roleCheck.js         # Role-based authorization
│   ├── controllers/
│   │   ├── authController.js   # Auth logic
│   │   ├── productController.js # Product CRUD
│   │   ├── cartController.js    # Cart management
│   │   ├── orderController.js   # Order processing
│   │   └── adminController.js   # Admin operations
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   └── adminRoutes.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── productValidator.js
│   │   ├── cartValidator.js
│   │   └── orderValidator.js
│   ├── services/
│   │   ├── emailService.js      # Email notifications
│   │   ├── orderService.js      # Order business logic
│   │   └── stockService.js      # Stock management
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   └── responseHandler.js   # Response formatting
│   └── server.js                # Application entry point
├── .env
├── .gitignore
├── package.json
└── README.md
```

# ecommerce
