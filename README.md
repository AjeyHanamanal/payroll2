# Employee Payroll Management System

A complete web-based payroll management system built with React, Node.js, Express, and MongoDB. This system provides comprehensive employee management, salary calculation, leave tracking, and payslip generation capabilities.

## Features

### 🔐 Authentication
- JWT-based admin authentication
- Secure login/logout functionality
- Protected routes

### 👥 Employee Management
- Add, view, edit, and delete employees (CRUD operations)
- Employee profile management with detailed information
- Department and designation tracking
- Employee status management (active/inactive/terminated)

### 💰 Salary Calculation
- **Base Salary + Bonuses**: Performance and attendance bonuses
- **Deductions**: 
  - Tax (10%)
  - PF (12%)
  - ESI (1.75%)
  - Loan deductions
  - Leave-based deductions (per-day salary × unpaid leaves)
- **Customizable Increments**:
  - Admin configurable increment intervals (e.g., every 1 year, 2 years)
  - Percentage or fixed amount increments
  - Automatic application based on Date of Joining

### 📅 Leave Management
- Multiple leave types (sick, casual, annual, maternity, paternity, other)
- Leave approval workflow
- Leave statistics and tracking
- Paid vs unpaid leave management

### 📄 Payslip Generation
- Detailed salary breakdown
- PDF and Excel export options
- Professional payslip formatting
- Company branding support

### 📊 Admin Dashboard
- Real-time statistics and analytics
- Employee distribution charts
- Payroll summaries
- Leave status tracking
- Recent activity monitoring

### ⚙️ Admin Settings
- Increment configuration
- System-wide settings management
- Bulk operations support

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **React Toastify** - Notifications
- **Formik & Yup** - Form handling and validation
- **Date-fns** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **jsPDF** - PDF generation
- **SheetJS (xlsx)** - Excel generation
- **Moment.js** - Date handling
- **Express Validator** - Input validation

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/payroll_system
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Usage

### Initial Setup

1. **Access the application**: Open your browser and navigate to `http://localhost:3000`

2. **Create admin account**: The system will prompt you to create an admin account on first run

3. **Default credentials** (if using demo data):
   - Username: `admin`
   - Password: `admin123`

### Adding Employees

1. Navigate to **Employees** section
2. Click **Add Employee**
3. Fill in employee details:
   - Personal information
   - Employment details
   - Salary information
   - Contact details

### Generating Payroll

1. Navigate to **Payroll** section
2. Click **Generate Payroll**
3. Select employee and month/year
4. System will automatically calculate:
   - Basic salary
   - Allowances (HRA, DA, TA)
   - Bonuses
   - Deductions (Tax, PF, ESI, Leave)
   - Net salary

### Managing Leaves

1. Navigate to **Leaves** section
2. Click **Add Leave Request**
3. Select employee and leave details
4. Approve/reject leave requests
5. Track leave statistics

### Admin Settings

1. Navigate to **Admin Settings**
2. Configure increment settings:
   - Interval (years)
   - Increment type (percentage/fixed)
   - Increment value
3. Apply increments to all employees

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration
- `GET /api/auth/me` - Get current admin

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Payroll
- `POST /api/payroll/generate` - Generate payroll
- `GET /api/payroll/employee/:id` - Get employee payroll history
- `GET /api/payroll/:id` - Get payroll by ID
- `GET /api/payroll/download/pdf/:id` - Download PDF payslip
- `GET /api/payroll/download/excel/:id` - Download Excel payslip

### Leaves
- `GET /api/leaves` - Get all leaves
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id/approve` - Approve/reject leave
- `GET /api/leaves/employee/:id` - Get employee leaves

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/increment-settings` - Get increment settings
- `POST /api/admin/increment-settings` - Update increment settings
- `POST /api/admin/apply-increments` - Apply increments

## Database Schema

### Employee
```javascript
{
  employeeId: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  dateOfJoining: Date,
  department: String,
  designation: String,
  baseSalary: Number,
  currentSalary: Number,
  status: String,
  address: Object,
  emergencyContact: Object,
  bankDetails: Object
}
```

### Payroll
```javascript
{
  employeeId: ObjectId,
  month: Number,
  year: Number,
  basicSalary: Number,
  allowances: Object,
  bonuses: Object,
  deductions: Object,
  grossSalary: Number,
  netSalary: Number,
  workingDays: Number,
  paidLeaves: Number,
  unpaidLeaves: Number,
  status: String
}
```

### Leave
```javascript
{
  employeeId: ObjectId,
  leaveType: String,
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  reason: String,
  status: String,
  isPaid: Boolean
}
```

## Salary Calculation Logic

### Basic Structure
```
Gross Salary = Basic Salary + Allowances + Bonuses
Net Salary = Gross Salary - Deductions
```

### Allowances
- **HRA**: 40% of basic salary
- **DA**: 50% of basic salary
- **TA**: Fixed ₹2,000
- **Other**: Fixed ₹1,000

### Bonuses
- **Performance**: 10% of basic salary
- **Attendance**: Fixed ₹500
- **Other**: Configurable

### Deductions
- **Tax**: 10% of basic salary
- **PF**: 12% of basic salary
- **ESI**: 1.75% of basic salary
- **Loan**: Configurable per employee
- **Leave**: Per-day salary × unpaid leaves

### Increment Logic
- Applied based on years of service
- Configurable interval (e.g., every 1 year)
- Percentage or fixed amount
- Applied to current salary

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Screenshots

*Add screenshots of the application here*

## Roadmap

- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Multi-company support
- [ ] Integration with accounting software
- [ ] Automated payroll processing
- [ ] Employee self-service portal 