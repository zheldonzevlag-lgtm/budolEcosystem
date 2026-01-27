
import fs from 'fs';
import path from 'path';

const filePath = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/app/store/orders/page.jsx';

async function testFix() {
    console.log('--- Testing StoreOrders Search Fix ---');
    
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    const searchTermDefined = content.includes("const [searchTerm, setSearchTerm] = useState('')");
    const searchTermUsed = content.includes("value={searchTerm}");
    const setSearchTermUsed = content.includes("setSearchTerm(e.target.value)");

    if (searchTermDefined && searchTermUsed && setSearchTermUsed) {
        console.log('SUCCESS: searchTerm state is defined and used correctly.');
    } else {
        console.error('FAILURE: Missing searchTerm definition or usage.');
        console.log('searchTermDefined:', searchTermDefined);
        console.log('searchTermUsed:', searchTermUsed);
        console.log('setSearchTermUsed:', setSearchTermUsed);
        process.exit(1);
    }
}

testFix();
