const https = require('https');

https.get('https://chatgpt.com/backend-api/share/t_69d0be9bea6081919ed0ae38e0893bcc', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Got JSON Response:', Object.keys(json));
      if (json.mapping) {
         Object.values(json.mapping).forEach(node => {
            if (node.message && node.message.content && node.message.content.parts) {
               console.log('--- Message ---');
               console.log(node.message.content.parts.join('\n'));
            }
         });
      } else {
         console.log(data.substring(0, 500));
      }
    } catch(e) {
      console.log('Raw data preview:', data.substring(0, 1000));
    }
  });
}).on('error', err => console.log('Error:', err.message));
