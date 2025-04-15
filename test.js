import bcrypt from 'bcryptjs';

const hashedPassword = "$2b$10$ozOYMSBbZQGJRWGKSjwg5.V3biyfVYZpTfK7qmXI7.4WwlGHmesli";
const inputPassword = "12345678";

const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
const datee= new Date()
console.log(datee)

console.log(isMatch ? "✅ Match!" : "❌ Not a match.");
