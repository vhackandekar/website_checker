import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import weather from 'openweather-apis';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

createServer(async (req, res) => {
  let filepath = '';
  let contenttype = '';

  if (req.method === 'GET') {
    console.log("Requested URL:", req.url);

    if (req.url === '/' || req.url === '/index.html') {
      filepath = join(__dirname, 'index.html');
      contenttype = 'text/html';
    } else if (req.url === '/style.css') {
      filepath = join(__dirname, 'style.css');
      contenttype = 'text/css';
    } else if (req.url.startsWith('/weatherdisplay.html')) {
      filepath = join(__dirname, 'weatherdisplay.html');
      contenttype = 'text/html';
    } else if (req.url === '/weatherdisplay.css') {
      filepath = join(__dirname, 'weatherdisplay.css');
      contenttype = 'text/css';
    }
    else if (req.url.startsWith('/Images/')) {
      filepath = join(__dirname, req.url);
      console.log('Attempting to load image:', filepath); // Add debug logging
      
      try {
        const imageData = await readFile(filepath);
        const contenttype = req.url.endsWith('.png') ? 'image/png' : 
                           req.url.endsWith('.jpg') || req.url.endsWith('.jpeg') ? 'image/jpeg' : 
                           'application/octet-stream';
                           
        res.writeHead(200, { 
          'Content-Type': contenttype,
          'Cache-Control': 'public, max-age=31536000'
        });
        return res.end(imageData);
      } catch (err) {
        console.error('Image loading error:', err, 'Path:', filepath);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Image not found');
      }
    }
     else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Route not found');
    }

    try {
      const data = await readFile(filepath, 'utf8');
      res.writeHead(200, { 'Content-Type': contenttype });
      return res.end(data);
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }
  }

  // Handle POST /getweather
  else if (req.method === 'POST' && req.url === '/getweather') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const { city } = JSON.parse(body);

      weather.setLang('en');
      weather.setCity(city);
      weather.setUnits('metric');
      weather.setAPPID('8ae202660c670615481a4bf8b09efbb8'); // Use your API key here

      weather.getSmartJSON((err, data) => {
        if (err || !data) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Failed to get weather' }));
        }

        const weatherInfo = {
          city,
          temp: data.temp,
          humidity: data.humidity,
          pressure: data.pressure,
          description: data.description,
          
        };
        console.log('Weather Info:', weatherInfo);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(weatherInfo));
      });
    });
  }

  else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }

}).listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
