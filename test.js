import bcrypt from 'bcryptjs';

const hashedPassword = "$2b$10$aO.FP/SK/D3abJW/o/i6HOUAHU4Yfjrspd.itEtDCfQ9e.GBkhmPG";
const inputPassword = "12345678";

const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
const datee= new Date()
console.log(datee)

console.log(isMatch ? "✅ Match!" : "❌ Not a match.");
