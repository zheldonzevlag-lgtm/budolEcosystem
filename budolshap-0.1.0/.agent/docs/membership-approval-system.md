# Membership Approval System Implementation

## Overview
Implemented an admin approval system for membership applications. Users can now apply for Plus Membership and Coop Membership, but these applications require admin approval before being granted.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)
- Added `MembershipStatus` enum with values: `NONE`, `PENDING`, `APPROVED`, `REJECTED`
- Added two new fields to the `User` model:
  - `membershipStatus`: Tracks Plus Membership application status
  - `coopMembershipStatus`: Tracks Coop Membership application status

### 2. API Endpoints

#### Modified Endpoints:
- **`/api/user/membership` (POST)**: Now creates a pending application instead of immediately granting membership
  - Checks if user already has membership or pending application
  - Sets `membershipStatus` to `PENDING`
  - Returns message: "Membership application submitted. Waiting for admin approval."

- **`/api/user/coop-membership` (POST)**: Now creates a pending application for coop membership
  - Checks if user already has coop membership or pending application
  - Sets `coopMembershipStatus` to `PENDING`
  - Returns message: "Coop membership application submitted. Waiting for admin approval."

#### New Admin Endpoint:
- **`/api/admin/memberships`**
  - **GET**: Fetches all pending membership applications
  - **POST**: Approve or reject membership applications
    - Parameters: `userId`, `type` ('plus' or 'coop'), `action` ('approve' or 'reject')
    - On approval: Sets status to `APPROVED` and grants membership (`isMember` or `isCoopMember` = true)
    - On rejection: Sets status to `REJECTED`

### 3. Frontend Updates

#### Pricing Page (`app/(public)/pricing/page.jsx`)
- Updated success messages to inform users their application is pending approval
- Changed redirect from `/coupons` to `/` after application submission

#### New Admin Page (`app/admin/memberships/page.jsx`)
- Displays all pending membership applications
- Shows user information (name, email, profile image)
- Separate cards for Plus and Coop membership applications
- Approve/Reject buttons for each application type
- Real-time status updates after admin action

#### Navbar Updates (`components/Navbar.jsx`)
- Added "Membership Applications" link to admin dropdown menu (both desktop and mobile)
- Link appears after "Manage Coupons" in the admin section

### 4. Database Migration
- Migration file: `20251123023939_add_membership_approval_status`
- Adds the new status fields to existing user records with default value `NONE`

## User Flow

### For Regular Users:
1. User navigates to `/pricing`
2. Clicks "Join Plus" or "Join Coop"
3. Application is submitted with status `PENDING`
4. User sees toast message: "Your [Plus/Coop] Membership application has been submitted and is pending admin approval."
5. User is redirected to home page
6. User waits for admin approval

### For Admins:
1. Admin logs in and accesses admin menu
2. Clicks "Membership Applications" in dropdown
3. Views list of all pending applications
4. Reviews each application
5. Clicks "Approve" or "Reject" for each application
6. System updates user status and grants membership if approved
7. User can now access member-only features if approved

## Status Values

### MembershipStatus Enum:
- **NONE**: User has not applied for membership
- **PENDING**: Application submitted, waiting for admin review
- **APPROVED**: Application approved, membership granted
- **REJECTED**: Application rejected by admin

## Security
- All admin endpoints check for admin role before allowing access
- User authentication required for submitting applications
- Prevents duplicate applications (checks for existing membership or pending status)

## Testing Checklist
- [ ] User can submit Plus Membership application
- [ ] User can submit Coop Membership application
- [ ] User cannot submit duplicate applications
- [ ] Admin can view all pending applications
- [ ] Admin can approve Plus Membership
- [ ] Admin can approve Coop Membership
- [ ] Admin can reject applications
- [ ] Approved users get membership access
- [ ] Rejected users do not get membership access
- [ ] Toast notifications work correctly
- [ ] Navigation links work in admin menu
