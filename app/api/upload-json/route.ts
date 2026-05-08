import { NextRequest, NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    console.log('Upload-JSON API called with PINATA_API_KEY:', !!PINATA_API_KEY, 'PINATA_API_SECRET:', !!PINATA_API_SECRET);

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return NextResponse.json(
        { error: 'Pinata API key and secret are not configured' },
        { status: 500 }
      );
    }

    const json = await request.json();

    console.log('Uploading JSON to Pinata via API route...', json);

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
      return NextResponse.json(
        { error: `Pinata JSON upload failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log('Pinata JSON success data:', data);

    if (!data.IpfsHash) {
      return NextResponse.json(
        { error: 'Invalid response from Pinata: missing IpfsHash' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      ipfsHash: data.IpfsHash
    });

  } catch (error) {
    console.error('JSON Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}