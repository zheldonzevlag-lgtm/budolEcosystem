
const phone = "+63 948-409-9389";
const cleanPhone = phone ? phone.replace(/[\s-]/g, '') : '';
const phoneRegex = /^\+\d{10,15}$/;

console.log(`Original Phone: "${phone}"`);
console.log(`Clean Phone: "${cleanPhone}"`);
console.log(`Regex: ${phoneRegex}`);

const isValid = phoneRegex.test(cleanPhone);
console.log(`Is valid? ${isValid}`);

if (!isValid) {
    console.log("Error: Invalid phone number.");
} else {
    console.log("Phone number is valid.");
}
