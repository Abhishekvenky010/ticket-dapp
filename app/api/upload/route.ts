import { NextRequest, NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called with PINATA_API_KEY:', !!PINATA_API_KEY, 'PINATA_API_SECRET:', !!PINATA_API_SECRET);

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return NextResponse.json(
        { error: 'Pinata API key and secret are not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create FormData for Pinata API
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    console.log('Uploading file to Pinata via API route...');

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: pinataFormData,
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
      return NextResponse.json(
        { error: `Pinata upload failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log('Pinata success data:', data);

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
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}