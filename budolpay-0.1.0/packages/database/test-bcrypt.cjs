const bcrypt = require('bcryptjs');

async function test() {
    const hash = "$2b$10$sOPvfGwRqlSobAfb0svBjOGX6iJF5iZG0j6GUTO/SDaDR2D7p/Zeq";
    const password = "B@$t@rd!";
    const isValid = await bcrypt.compare(password, hash);
    console.log('bcryptjs test:', isValid);
}
test();
