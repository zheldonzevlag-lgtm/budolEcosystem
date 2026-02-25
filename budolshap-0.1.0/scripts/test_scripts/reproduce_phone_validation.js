
const phone = "+63 948-409-9389";
const phoneRegex = /^\+\d{10,15}$/;

console.log(`Phone: "${phone}"`);
console.log(`Regex: ${phoneRegex}`);
const isValid = phoneRegex.test(phone);
console.log(`Is valid? ${isValid}`);

if (!isValid) {
    console.log("Error: Invalid phone number. Must be in E.164 format (e.g., +639xxxxxxxxx)");
} else {
    console.log("Phone number is valid.");
}

// Check stripped version
const stripped = phone.replace(/\s|-/g, '');
console.log(`Stripped: "${stripped}"`);
const isValidStripped = phoneRegex.test(stripped);
console.log(`Is stripped valid? ${isValidStripped}`);
