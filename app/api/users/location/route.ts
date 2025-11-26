import { NextResponse } from 'next/server'
import { setUserLocation, getAllUserLocations } from '@/lib/user-locations'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, lat, lng, address, city } = body as {
      userId?: string
      lat?: number
      lng?: number
      address?: string
      city?: string
    }

    if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'userId, lat and lng are required' }, { status: 400 })
    }

    setUserLocation(userId, { lat, lng, address, city })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }
}

export async function GET() {
  try {
    const all = getAllUserLocations()
    return NextResponse.json({ data: all })
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
