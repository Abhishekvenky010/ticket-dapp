const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

console.log('Pinata API environment check:', {
  PINATA_API_KEY_EXISTS: !!PINATA_API_KEY,
  PINATA_API_SECRET_EXISTS: !!PINATA_API_SECRET,
  PINATA_API_KEY_START: PINATA_API_KEY?.substring(0, 10)
});

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error('Pinata API key and secret are not configured!');
}

export const uploadToPinata = async (file: File): Promise<string> => {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error('Pinata API key and secret are not configured. Please check your .env.local file.');
  }

  const formData = new FormData();
  formData.append('file', file);

  console.log('Uploading file to Pinata...');

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_API_SECRET,
    },
    body: formData,
  });

  console.log('Pinata response status:', res.status);

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      console.error('Pinata error details:', errorData);
      if (errorData.error) {
        errorMessage = errorData.error.details || errorData.error.reason || errorMessage;
      }
    } catch (e) {
      const text = await res.text();
      console.error('Pinata error text:', text);
      errorMessage = text || errorMessage;
    }
    throw new Error(`Pinata upload failed: ${errorMessage}`);
  }

  const data = await res.json();
  console.log('Pinata success data:', data);

  if (!data.IpfsHash) {
    throw new Error('Invalid response from Pinata: missing IpfsHash');
  }

  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
};

export const uploadJSONToPinata = async (json: object): Promise<string> => {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error('Pinata API key and secret are not configured. Please check your .env.local file.');
  }

  console.log('Uploading JSON to Pinata...', json);

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_API_SECRET,
    },
    body: JSON.stringify(json),
  });

  console.log('Pinata JSON response status:', res.status);

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      console.error('Pinata JSON error details:', errorData);
      if (errorData.error) {
        errorMessage = errorData.error.details || errorData.error.reason || errorMessage;
      }
    } catch (e) {
      const text = await res.text();
      console.error('Pinata JSON error text:', text);
      errorMessage = text || errorMessage;
    }
    throw new Error(`Pinata JSON upload failed: ${errorMessage}`);
  }

  const data = await res.json();
  console.log('Pinata JSON success data:', data);

  if (!data.IpfsHash) {
    throw new Error('Invalid response from Pinata: missing IpfsHash');
  }

  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
};