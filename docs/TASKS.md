# Toasté Bike Polo - Order System Implementation Tasks

## Project Overview
Implement a complete order system for Toasté Bike Polo wheel covers using Airtable as the backend database, with enhanced form functionality including quantity selection, multiple cover configurations, and comprehensive order management.

## Technical Stack
- **Frontend**: HTML/CSS/JavaScript (existing)
- **Backend**: Airtable (Database + API)
- **Payment**: Manual processing (Interac/PayPal)
- **Order Management**: Airtable dashboard + export functionality

---

## Phase 1: Airtable Setup & Configuration

### Task 1.1: Airtable Base Setup
**User Story**: As a developer, I want to set up an Airtable base so that I can store and manage order data.

**Acceptance Criteria**:
- [ ] Create Airtable account and new base
- [ ] Set up base structure with required tables
- [ ] Get API key and base ID
- [ ] Set up environment variables for frontend
- [ ] Test API connection

**Technical Details**:
- Base name: `Toasté Bike Polo Orders`
- Database: Airtable (cloud-based)
- Connection: API key + Base ID
- Free tier: 1,200 records per base (more than enough for small projects)

### Task 1.2: Airtable Base Structure Design
**User Story**: As a business owner, I want to store comprehensive order information so that I can track and fulfill orders efficiently.

**Acceptance Criteria**:
- [ ] Create `Orders` table with all required fields
- [ ] Create `Order Items` table with proper relationships
- [ ] Set up field types and validation rules
- [ ] Create views for different order statuses
- [ ] Set up sharing permissions and access controls

**Airtable Base Structure**:

**Orders Table**:
- `Order Code` (Single line text, unique)
- `Customer Name` (Single line text)
- `Customer Email` (Email)
- `Shipping Address` (Long text)
- `Notes` (Long text)
- `Order Date` (Date)
- `Status` (Single select: waiting_for_payment, to_produce, to_send, done, cancelled, refunded)
- `Total Price CAD` (Currency)
- `Tax Amount CAD` (Currency)
- `Created Time` (Created time, auto-generated)
- `Last Modified Time` (Last modified time, auto-generated)

**Order Items Table**:
- `Order` (Link to Orders table)
- `Spoke Count` (Number)
- `Wheel Size` (Single line text)
- `Quantity` (Number)
- `Unit Price CAD` (Currency)
- `Created Time` (Created time, auto-generated)

**Status Options**: waiting_for_payment, to_produce, to_send, done, cancelled, refunded

### Task 1.3: Airtable API Integration
**User Story**: As a developer, I want to integrate Airtable API so that the frontend can submit orders to the database.

**Acceptance Criteria**:
- [ ] Install Airtable JavaScript library
- [ ] Configure API connection in frontend
- [ ] Create order submission function
- [ ] Handle API errors gracefully
- [ ] Test order creation flow

**Technical Implementation**:
- Use Airtable JavaScript SDK or fetch API
- API endpoint: `https://api.airtable.com/v0/{baseId}/{tableName}`
- Authentication: Bearer token with API key
- Rate limiting: 5 requests per second (free tier)

---

## Phase 2: Enhanced Form Functionality

### Task 2.1: Quantity Selection System
**User Story**: As a customer, I want to select the quantity of wheel covers I need so that I can order multiple covers in one transaction.

**Acceptance Criteria**:
- [ ] Add quantity selector to product configuration
- [ ] Update form validation to include quantity
- [ ] Display quantity in order summary
- [ ] Calculate total price based on quantity

**UI Changes**:
- Add quantity input field (1-10 range)
- Update form validation
- Modify order summary display

### Task 2.2: Multiple Cover Configuration
**User Story**: As a customer, I want to configure different wheel covers in the same order so that I can order covers for different wheels or bikes.

**Acceptance Criteria**:
- [ ] Add "Add Another Cover" functionality
- [ ] Allow different spoke count/wheel size combinations
- [ ] Display all configured covers in summary
- [ ] Calculate total price for all covers
- [ ] Allow removal of individual cover configurations

**UI Changes**:
- Dynamic form sections for multiple covers
- Cover configuration list with edit/remove options
- Updated order summary with all covers

### Task 2.3: Pricing System Implementation
**User Story**: As a customer, I want to see the total price including taxes so that I know exactly how much to pay.

**Acceptance Criteria**:
- [ ] Define base prices for different configurations
- [ ] Implement tax calculation (Canadian tax rates)
- [ ] Display price breakdown (subtotal, tax, total)
- [ ] Update prices in real-time as configuration changes
- [ ] Apply quantity discounts if applicable

**Pricing Structure**:
- Base price per cover: $40 CAD (all models)
- Tax rate: 15% (Quebec tax rate)
- Quantity discounts: 5% discount per pair of the same cover (2+ covers of same configuration)

### Task 2.4: Pre-Confirmation Page
**User Story**: As a customer, I want to review my complete order before submitting so that I can ensure everything is correct.

**Acceptance Criteria**:
- [ ] Create order summary page
- [ ] Display all configured covers with details
- [ ] Show complete price breakdown
- [ ] Add production time disclaimer
- [ ] Include edit/back functionality
- [ ] Final confirmation before submission

**Content Requirements**:
- Complete order summary
- Price breakdown (subtotal, tax, total)
- Production time notice
- Edit order option
- Final submit button

---

## Phase 3: Order Management & Confirmation

### Task 3.1: Enhanced Order Confirmation
**User Story**: As a customer, I want to receive clear payment instructions after placing my order so that I can complete my purchase.

**Acceptance Criteria**:
- [ ] Display unique order code prominently
- [ ] Show payment email address
- [ ] Provide clear payment instructions
- [ ] Include warning about no automatic emails
- [ ] Display order summary for reference
- [ ] Add contact information for questions

**Confirmation Page Content**:
- Order code (large, prominent display)
- Payment instructions (Interac/PayPal)
- Warning about saving order code
- Complete order summary
- Contact information
- Production time estimate

### Task 3.2: Order Status Management
**User Story**: As a business owner, I want to track order statuses so that I can manage production and fulfillment efficiently.

**Acceptance Criteria**:
- [ ] Implement status update functionality in Airtable
- [ ] Create admin interface for status management
- [ ] Set up email notifications for new orders (Airtable Automations)
- [ ] Add status history tracking
- [ ] Create customer order tracking page with unique URL

**Status Workflow**:
1. `waiting_for_payment` - Order created, awaiting payment
2. `to_produce` - Payment received, ready for production
3. `to_send` - Production complete, ready to ship
4. `done` - Order delivered and completed
5. `cancelled` - Order cancelled
6. `refunded` - Order refunded

### Task 3.3: Error Handling & Validation
**User Story**: As a customer, I want clear error messages and validation so that I can successfully complete my order.

**Acceptance Criteria**:
- [ ] Implement comprehensive form validation
- [ ] Add error handling for API failures
- [ ] Provide user-friendly error messages
- [ ] Implement retry mechanisms
- [ ] Add loading states for better UX

---

## Phase 4: Testing & Deployment

### Task 4.1: Frontend Testing
**User Story**: As a developer, I want to test all form functionality so that I can ensure a smooth user experience.

**Acceptance Criteria**:
- [ ] Test all form validation scenarios
- [ ] Test multiple cover configurations
- [ ] Test price calculations
- [ ] Test order submission flow
- [ ] Test error handling scenarios

### Task 4.2: Airtable API Integration Testing
**User Story**: As a developer, I want to test the Airtable API integration so that I can ensure data is stored correctly.

**Acceptance Criteria**:
- [ ] Test order creation via API
- [ ] Test order item creation
- [ ] Test status updates
- [ ] Test data retrieval
- [ ] Test error scenarios and rate limiting

### Task 4.3: Production Deployment
**User Story**: As a business owner, I want the order system deployed to production so that customers can place orders.

**Acceptance Criteria**:
- [ ] Deploy frontend to production
- [ ] Configure production Airtable environment
- [ ] Set up monitoring and logging
- [ ] Test production order flow
- [ ] Document deployment process

---

## Phase 5: Documentation & Maintenance

### Task 5.1: User Documentation
**User Story**: As a business owner, I want documentation for managing orders so that I can operate the system effectively.

**Acceptance Criteria**:
- [ ] Create order management guide
- [ ] Document status update process
- [ ] Create troubleshooting guide
- [ ] Document pricing configuration

### Task 5.2: Technical Documentation
**User Story**: As a developer, I want technical documentation so that I can maintain and extend the system.

**Acceptance Criteria**:
- [ ] Document database schema
- [ ] Document API endpoints
- [ ] Create deployment guide
- [ ] Document configuration options

---

## Priority Order
1. **High Priority**: Tasks 1.1-1.3 (Airtable setup)
2. **High Priority**: Tasks 2.1-2.4 (Enhanced forms)
3. **Medium Priority**: Tasks 3.1-3.3 (Order management)
4. **Medium Priority**: Tasks 4.1-4.3 (Testing & deployment)
5. **Low Priority**: Tasks 5.1-5.2 (Documentation)

## Estimated Timeline
- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days
- **Phase 5**: 1-2 days

**Total Estimated Time**: 10-15 days

---

### Task 3.4: Customer Order Tracking Page
**User Story**: As a customer, I want to track my order status using a unique URL so that I can see the progress of my order.

**Acceptance Criteria**:
- [ ] Create order tracking page with unique URL format: `/track/{order_code}`
- [ ] Display order details and current status
- [ ] Show order history and status changes
- [ ] Add contact information for questions
- [ ] Implement proper error handling for invalid order codes

**Technical Implementation**:
- URL format: `https://toastebikepolo.com/track/ABC12345`
- Public read access to order status (no authentication required)
- Display order code, status, order date, and estimated timeline

---

## Airtable Email Notifications

**Answer to Question 4**: Airtable has built-in automation features that can handle email notifications:

1. **Airtable Automations** (recommended):
   - Trigger-based automations when new records are created
   - Can send emails directly or via webhooks to email services
   - Built-in integration with email providers
   - Simple and reliable for small projects

2. **Webhook + Email Service**:
   - Airtable webhooks that call external email services
   - More flexible but requires additional setup

3. **Third-party integrations**:
   - Zapier integration with Airtable
   - Make.com (formerly Integromat) integration
   - Built-in Airtable integrations with email services

**Recommended Approach**: Airtable Automations with built-in email integration (simple, reliable, and cost-effective for email sending).

---

## Updated Pricing Examples

**Example Calculations**:
- 1 cover: $40.00 + $6.00 tax = $46.00 CAD
- 2 covers (same config): $76.00 + $11.40 tax = $87.40 CAD (5% discount applied)
- 3 covers (same config): $114.00 + $17.10 tax = $131.10 CAD (5% discount applied)
- 2 covers (different configs): $80.00 + $12.00 tax = $92.00 CAD (no discount)

---

## Questions for Clarification
1. ✅ Base price: $40 CAD per cover
2. ✅ Quantity discounts: 5% per pair of same configuration
3. ✅ Tax rate: 15% (Quebec)
4. ✅ Email notifications: Yes, via Airtable Automations
5. ✅ Order tracking: Yes, unique URL page
6. ✅ Inventory management: No, covers are produced on demand
