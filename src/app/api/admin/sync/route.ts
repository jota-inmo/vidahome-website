import { syncSinglePropertyAction, syncAllPropertiesAction } from '@/app/actions/sync-properties';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/sync/single?property_id=12345
 * Sync a single property from Inmovilla to property_metadata
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id query parameter is required' },
        { status: 400 }
      );
    }

    const result = await syncSinglePropertyAction(parseInt(propertyId));
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync/all
 * Sync all properties from Inmovilla to property_metadata
 */
export async function GET(request: NextRequest) {
  try {
    const result = await syncAllPropertiesAction();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
