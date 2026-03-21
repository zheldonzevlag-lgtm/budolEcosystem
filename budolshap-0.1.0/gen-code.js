import bcrypt from 'bcryptjs';

async function generate() {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('777888', salt);
    console.log(hash);
}

generate();
