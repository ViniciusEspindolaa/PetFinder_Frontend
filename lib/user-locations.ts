type UserLocation = {
  lat: number
  lng: number
  address?: string
  city?: string
}

const userLocations = new Map<string, UserLocation>()

export function setUserLocation(userId: string, loc: UserLocation) {
  userLocations.set(userId, loc)
}

export function getUserLocation(userId: string): UserLocation | null {
  return userLocations.get(userId) ?? null
}

export function getAllUserLocations() {
  return Array.from(userLocations.entries()).map(([userId, loc]) => ({ userId, ...loc }))
}

export default userLocations
