export type Side = 'north' | 'south' | 'east' | 'west';
export type RoomSpec = {
  id: string; name: string; x: number; z: number; width: number; depth: number;
  openings?: Partial<Record<Side, number>>; accent: string;
};
export type CorridorSpec = { id: string; x: number; z: number; width: number; depth: number; label: string; accent: string };

export const DOOR_WIDTH = 3.2;
export const DOOR_HEIGHT = 2.65;
export const WALL_HEIGHT = 4.2;
export const WALL_THICKNESS = 0.18;
export const ROOMS: RoomSpec[] = [
  { id: 'main', name: 'MAIN TEACHING / SYNTHESIS LAB', x: 0, z: 0, width: 16, depth: 16, openings: { north: 3.4, south: 3.4, east: 3.4, west: 3.4 }, accent: '#25c4d9' },
  { id: 'storage', name: 'CHEMICAL STORAGE', x: 20, z: 0, width: 12, depth: 12, openings: { west: DOOR_WIDTH, south: 3.2 }, accent: '#f5b942' },
  { id: 'weighing', name: 'WEIGHING ROOM', x: 0, z: 20, width: 10, depth: 10, openings: { north: DOOR_WIDTH }, accent: '#7dd3fc' },
  { id: 'instrument', name: 'INSTRUMENT ROOM', x: -20, z: 0, width: 14, depth: 14, openings: { east: DOOR_WIDTH, south: 3.2 }, accent: '#a78bfa' },
  { id: 'safety', name: 'SAFETY & PPE', x: -20, z: 14, width: 10, depth: 8, openings: { north: 3.2 }, accent: '#4ade80' },
  { id: 'waste', name: 'WASTE DISPOSAL', x: 20, z: 13, width: 10, depth: 8, openings: { north: 3.2 }, accent: '#fb923c' },
  { id: 'office', name: 'OFFICE / RESEARCH LOG', x: 0, z: -19, width: 12, depth: 10, openings: { south: 3.4 }, accent: '#60a5fa' },
];
export const CORRIDORS: CorridorSpec[] = [
  { id: 'east-link', x: 11, z: 0, width: 6, depth: 3.4, label: 'STORAGE CORRIDOR', accent: '#f5b942' },
  { id: 'west-link', x: -10.5, z: 0, width: 5, depth: 3.2, label: 'INSTRUMENT CORRIDOR', accent: '#a78bfa' },
  { id: 'south-link', x: 0, z: 11.5, width: 3.4, depth: 7, label: 'WEIGHING CORRIDOR', accent: '#7dd3fc' },
  // Exactly spans from main north wall z=-8 to office south wall z=-14.
  { id: 'north-link', x: 0, z: -11, width: 3.4, depth: 6, label: 'OFFICE CORRIDOR', accent: '#60a5fa' },
  { id: 'safety-link', x: -20, z: 8.5, width: 3.2, depth: 3, label: 'SAFETY CORRIDOR', accent: '#4ade80' },
  { id: 'waste-link', x: 20, z: 7.5, width: 3.2, depth: 3, label: 'WASTE CORRIDOR', accent: '#fb923c' },
];


export const LOCKED_DOORS: Record<string, { side: Side; requiredProtocols: number; width: number }> = {
  storage: { side: 'west', requiredProtocols: 1, width: 3.1 },
  instrument: { side: 'east', requiredProtocols: 2, width: 3.1 },
  waste: { side: 'north', requiredProtocols: 3, width: 3.1 },
};
export const ROOM_LOCK_THRESHOLDS: Record<string, number> = Object.fromEntries(Object.entries(LOCKED_DOORS).map(([roomId, door]) => [roomId, door.requiredProtocols]));
export const ROOM_ADJACENCY: Record<LabRoomId, LabRoomId | null> = {
  main: 'storage', storage: 'main', weighing: 'main', instrument: 'safety', safety: 'instrument', waste: 'storage', office: 'main',
};
export type LabRoomId = 'main' | 'storage' | 'weighing' | 'instrument' | 'safety' | 'waste' | 'office';
export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room])) as Record<LabRoomId, RoomSpec>;

/** Returns the room containing a world-space X/Z position, falling back to the closest room through a corridor. */
export function detectRoomId(x: number, z: number): LabRoomId {
  for (const room of ROOMS) {
    if (x >= room.x - room.width / 2 && x <= room.x + room.width / 2 && z >= room.z - room.depth / 2 && z <= room.z + room.depth / 2) return room.id as LabRoomId;
  }
  let nearest = ROOMS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const room of ROOMS) {
    const dx = Math.max(Math.abs(x - room.x) - room.width / 2, 0);
    const dz = Math.max(Math.abs(z - room.z) - room.depth / 2, 0);
    const distance = dx * dx + dz * dz;
    if (distance < bestDistance) { bestDistance = distance; nearest = room; }
  }
  return nearest.id as LabRoomId;
}

export function getFootstepFloor(roomId: LabRoomId): 'tile' | 'rubber' | 'concrete' {
  if (roomId === 'waste' || roomId === 'storage') return 'rubber';
  if (roomId === 'instrument' || roomId === 'safety') return 'concrete';
  return 'tile';
}
