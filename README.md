# 📍 ExplorifyTrips - Travel Planning Platform

> A modern travel planning and booking platform built with Next.js 14, AWS DynamoDB, and NextAuth.

## 🌐 Project Ecosystem

This project is part of a dual-platform ecosystem:

- **Main Website**: [explorifytrips.com](https://explorifytrips.com) - Customer-facing platform for browsing and booking travel plans
- **Vendor Portal**: [vendor.explorifytrips.com](https://vendor.explorifytrips.com) - Separate platform for travel vendors to manage their offerings
  - Repository: [github.com/Suryansh-Dey/market-place](https://github.com/Suryansh-Dey/market-place)

## 🏗️ Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: AWS DynamoDB
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

### Key Features

- 🔐 Multi-role authentication (User, Vendor, Admin)
- 🌓 Dark mode support
- 📱 Responsive design
- 🗺️ Travel plan browsing and booking
- 💳 RazorPay payment integration with refund rules
- 💰 Automated vendor payouts with platform commission
- 🔄 Refund management with configurable rules
- 🔒 Secure session management

## 📦 Database Schema

### DynamoDB Tables

#### 1. **Users Table** (`DYNAMODB_USERS_TABLE`)

```typescript
{
  userId: string;           // Partition Key
  name: string;
  email: string;
  password?: string;        // Optional - for email/password auth
  image?: string;
  role: "user" | "vendor" | "admin";
  vendorVerified: boolean;
  vendorInfo?: {
    organizationName?: string;
    address?: string;
    phoneNumber?: string;
  };
  createdAt: string;
}
```

#### 2. **TravelPlans Table** (`DYNAMODB_PLANS_TABLE`)

```typescript
{
  planId: string;          // Partition Key
  vendorId: string;
  name: string;
  image: string;
  route: string[];
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Payment & Refund Configuration
  refundPercentage?: number;      // Percentage refundable (80 for 80%)
  refundDaysBeforeTrip?: number;  // Days before trip start for refund eligibility
  vendorCut?: number;             // Percentage cut for vendor (85 for 85%, rest goes to platform)
}
```

#### 3. **Bookings Table** (`DYNAMODB_BOOKINGS_TABLE`)

```typescript
{
  bookingId: string; // Partition Key
  planId: string;
  userId: string;
  dateBooked: string;
  numPeople: number;
  paymentStatus: "pending" | "completed" | "failed";
  totalAmount: number;
  createdAt: string;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  
  // Trip and Refund Management
  tripStartDate: string;           // When the trip actually starts
  refundStatus?: "none" | "requested" | "processing" | "completed" | "rejected";
  refundAmount?: number;
  refundDate?: string;


  // Vendor Payout Management
  vendorPayoutStatus?: "pending" | "processing" | "completed" | "failed";
  vendorPayoutAmount?: number;
  vendorPayoutDate?: string;
  platformCut?: number;           // Amount kept by platform
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- AWS Account with DynamoDB access
- AWS Access Keys

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/explorifytrips.git
   cd explorifytrips
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key

   # DynamoDB Tables
   DYNAMODB_USERS_TABLE=Users
   DYNAMODB_PLANS_TABLE=TravelPlans
   DYNAMODB_BOOKINGS_TABLE=Bookings

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key_here

   # OAuth Providers (if using)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # RazorPay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Authentication & Authorization

### User Roles

The platform supports three user roles:

1. **User** (Default)

   - Browse travel plans
   - Make bookings
   - Manage personal bookings
   - Assigned when signing up from `explorifytrips.com`

2. **Vendor**

   - All user permissions
   - Create and manage travel plans
   - View bookings for their plans
   - Assigned when signing up from `vendor.explorifytrips.com`
   - Requires admin verification (`vendorVerified: true`)

3. **Admin**
   - Full system access
   - Verify vendors
   - Manage all users and plans
   - Platform analytics

### Role Assignment Logic

```typescript
// User role is determined by the origin domain:
// - explorifytrips.com → role: "user"
// - vendor.explorifytrips.com → role: "vendor"
```

## 📁 Project Structure

```
explorifytrips/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── trips/             # Trips browsing page
│   └── layout.tsx         # Root layout with ThemeProvider
├── components/
│   ├── common/            # Shared components
│   │   └── Navbar.tsx     # Navigation bar
│   ├── ui/                # shadcn/ui components
│   ├── theme-provider.tsx # Dark mode provider
│   └── mode-toggle.tsx    # Dark mode toggle
├── lib/
│   └── dynamodb.ts        # DynamoDB configuration
├── public/                # Static assets
└── .env.local            # Environment variables (create this)
```

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. Components are installed individually:

```bash
# Install specific components
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu
npx shadcn@latest add card
# ... etc
```

### Dark Mode

Dark mode is implemented using `next-themes`:

- Toggle component: `components/mode-toggle.tsx`
- Provider: `components/theme-provider.tsx`
- Supports: light, dark, and system preference

## 💳 Payment Flow (RazorPay Integration)

### Money Flow

1. **User Books and Pays**
   - User creates a booking and pays via RazorPay
   - Payment amount is held in the platform account until trip starts
   - Booking status: `paymentStatus: "completed"`, `vendorPayoutStatus: "pending"`

2. **Refund Before Trip Starts**
   - If refund requested before trip start date
   - Refund eligibility checked based on plan's `refundDaysBeforeTrip` and `refundPercentage`
   - Refund processed according to rules (x% refundable before y days)
   - Booking status: `refundStatus: "completed"`

3. **Vendor Payout After Trip Starts**
   - When trip starts, platform deducts commission (`platformCut`)
   - Remaining amount (`vendorPayoutAmount`) transferred to vendor account
   - Booking status: `vendorPayoutStatus: "completed"`

### API Endpoints

- `POST /api/payments/create-order` - Create RazorPay payment order
- `POST /api/payments/verify` - Verify payment and create booking
- `POST /api/payments/refund` - Process refund with rules validation
- `POST /api/payments/vendor-payout` - Transfer funds to vendor (admin/vendor only)
- `POST /api/payments/webhook` - RazorPay webhook handler for events

### Refund Rules Configuration

Each travel plan can have:
- `refundPercentage`: Percentage of amount refundable (default: 100%)
- `refundDaysBeforeTrip`: Minimum days before trip start for refund eligibility (default: 7 days)

### Vendor Commission

Each travel plan can specify:
- `vendorCut`: Percentage of payment that goes to vendor (default: 85%)
- Platform keeps: `100 - vendorCut` (default: 15%)

## 🔧 Development Guidelines

### Code Standards

- Use TypeScript for type safety
- Follow Next.js 14 App Router conventions
- Use server components by default
- Add `"use client"` only when necessary
- Implement proper error handling
- Use environment variables for sensitive data

### Git Workflow

1. Create feature branches from `main`
2. Use descriptive commit messages
3. Test thoroughly before creating PR
4. Request code review before merging

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all `.env.local` variables are added to your deployment platform.

## 🔐 Security Considerations

- ✅ Never commit `.env.local` to version control
- ✅ Use AWS IAM roles with minimum required permissions
- ✅ Enable DynamoDB encryption at rest
- ✅ Implement rate limiting on API routes
- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Rotate AWS credentials regularly

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For questions or issues, please contact:

- Email: support@explorifytrips.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/explorifytrips/issues)

---

**Note**: This is the main customer-facing website. For vendor portal documentation, see the [market-place repository](https://github.com/Suryansh-Dey/market-place).
