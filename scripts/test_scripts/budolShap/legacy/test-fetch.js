async function testFetch() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/health');
        const data = await response.json();
        console.log('Fetch Success:', data);
    } catch (error) {
        console.error('Fetch Failed:', error.message);
    }
}
testFetch();
