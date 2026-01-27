const { UserRole } = require('@prisma/client');
console.log('UserRole Enum in Generated Client:', UserRole);
if (UserRole.STAFF) {
  console.log('STAFF role found!');
} else {
  console.log('STAFF role NOT found!');
}