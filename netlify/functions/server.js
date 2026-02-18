const fs = require('fs');
const path = require('path');

// Simple file-based JSON storage
const dataDir = path.join(__dirname, '..', 'data');
const offersFile = path.join(dataDir, 'offers.json');
const talentFile = path.join(dataDir, 'talent.json');
const applicationsFile = path.join(dataDir, 'applications.json');

function readJSON(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          resolve([]);
        }
      }
    });
  });
}

function writeJSON(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Parse path
  const apiPath = path.replace('/api/', '').split('?')[0];
  const pathParts = apiPath.split('/');
  let reqBody = {};
  
  if (body) {
    try {
      reqBody = JSON.parse(body);
    } catch (e) {
      reqBody = {};
    }
  }
  
  try {
    // GET /api/offers - List all offers
    if (httpMethod === 'GET' && pathParts[0] === 'offers') {
      const offers = await readJSON(offersFile);
      // Filter out expired offers
      const now = new Date();
      const validOffers = offers.filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(validOffers)
      };
    }
    
    // GET /api/offers/:id - Get single offer
    if (httpMethod === 'GET' && pathParts[0] === 'offers' && pathParts[1]) {
      const offers = await readJSON(offersFile);
      const offer = offers.find(o => o.id === Number(pathParts[1]));
      if (!offer) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Oferta no encontrada' })
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(offer)
      };
    }
    
    // GET /api/talent - List all talent
    if (httpMethod === 'GET' && pathParts[0] === 'talent') {
      const talent = await readJSON(talentFile);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(talent)
      };
    }
    
    // GET /api/talent/:id - Get single talent
    if (httpMethod === 'GET' && pathParts[0] === 'talent' && pathParts[1]) {
      const talent = await readJSON(talentFile);
      const person = talent.find(t => t.id === Number(pathParts[1]));
      if (!person) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Candidato no encontrado' })
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(person)
      };
    }
    
    // POST /api/offers - Create new offer
    if (httpMethod === 'POST' && pathParts[0] === 'offers') {
      const offers = await readJSON(offersFile);
      const newOffer = reqBody;
      newOffer.id = Math.max(0, ...offers.map(o => o.id)) + 1;
      newOffer.createdAt = new Date().toISOString();
      offers.push(newOffer);
      await writeJSON(offersFile, offers);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newOffer)
      };
    }
    
    // POST /api/apply - Apply to a job
    if (httpMethod === 'POST' && pathParts[0] === 'apply') {
      const applications = await readJSON(applicationsFile);
      const application = reqBody;
      application.id = Math.max(0, ...applications.map(a => a.id), 0) + 1;
      application.createdAt = new Date().toISOString();
      applications.push(application);
      await writeJSON(applicationsFile, applications);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, id: application.id })
      };
    }
    
    // DELETE /api/offers/:id - Delete offer
    if (httpMethod === 'DELETE' && pathParts[0] === 'offers' && pathParts[1]) {
      const offers = await readJSON(offersFile);
      const id = Number(pathParts[1]);
      const filtered = offers.filter(o => o.id !== id);
      await writeJSON(offersFile, filtered);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }
    
    // PUT /api/offers/:id - Update offer
    if (httpMethod === 'PUT' && pathParts[0] === 'offers' && pathParts[1]) {
      const offers = await readJSON(offersFile);
      const id = Number(pathParts[1]);
      const index = offers.findIndex(o => o.id === id);
      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Oferta no encontrada' })
        };
      }
      offers[index] = { ...offers[index], ...reqBody };
      await writeJSON(offersFile, offers);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(offers[index])
      };
    }
    
    // POST /api/telegram/publish - Publish from Telegram bot
    if (httpMethod === 'POST' && pathParts[0] === 'telegram' && pathParts[1] === 'publish') {
      const offers = await readJSON(offersFile);
      const newOffer = reqBody;
      newOffer.id = Math.max(0, ...offers.map(o => o.id)) + 1;
      newOffer.createdAt = new Date().toISOString();
      offers.push(newOffer);
      await writeJSON(offersFile, offers);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, id: newOffer.id })
      };
    }
    
    // Default: 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint no encontrado' })
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
