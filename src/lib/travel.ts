import fares from '../data/fares.json';

export interface LatLng {
	lat: number;
	lng: number;
}

export interface Origin extends LatLng {
	id: string;
	label: string;
}

// Coordinates from OpenStreetMap (Nominatim).
export const ORIGINS: Origin[] = [
	{ id: 'kmitl', label: 'สจล. (กลางมอ)', lat: 13.7299, lng: 100.783 },
	{ id: 'station', label: 'สถานีรถไฟพระจอมเกล้า', lat: 13.72818, lng: 100.77547 },
	{ id: 'keki', label: 'หอเกกี (ศูนย์อาหารเกกีงาม 4)', lat: 13.72737, lng: 100.76953 },
	{ id: 'arl', label: 'แอร์พอร์ตลิงก์ ลาดกระบัง', lat: 13.72765, lng: 100.74783 },
];

type Tier = { upToKm: number | null; perKm: number };

export interface FareService {
	id: string;
	label: string;
	base: number;
	baseKm: number;
	perKm: number | Tier[];
	perMin: number;
	minFare: number;
	bookingFee: number;
}

export const SERVICES = (fares.services as FareService[]).filter((s) => s.id === 'bike' || s.id === 'car');
export const SURGE = fares.surge.typical as [number, number];
const SPEED = fares.speedKmh as Record<string, number>;
const DETOUR = fares.detourFactor as number;
const WALK_KMH = 4.5;

export function straightKm(a: LatLng, b: LatLng) {
	const R = 6371;
	const rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad;
	const dLng = (b.lng - a.lng) * rad;
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road distance estimate: straight line times a detour factor. */
export function roadKm(a: LatLng, b: LatLng) {
	return straightKm(a, b) * DETOUR;
}

function distanceCharge(s: FareService, km: number) {
	let rest = Math.max(0, km - s.baseKm);
	if (typeof s.perKm === 'number') return rest * s.perKm;
	let charge = 0;
	let from = s.baseKm;
	for (const t of s.perKm) {
		const span = t.upToKm == null ? rest : Math.min(rest, Math.max(0, t.upToKm - from));
		charge += span * t.perKm;
		rest -= span;
		if (t.upToKm != null) from = Math.max(from, t.upToKm);
		if (rest <= 0) break;
	}
	return charge;
}

export interface Quote {
	service: FareService;
	minutes: number;
	low: number;
	high: number;
}

export function quote(s: FareService, km: number): Quote {
	const minutes = (km / (SPEED[s.id] ?? SPEED.car)) * 60;
	const meter = s.base + distanceCharge(s, km) + s.perMin * minutes;
	const fare = Math.max(s.minFare, meter) + s.bookingFee;
	const round = (n: number) => Math.round(n / 5) * 5;
	return { service: s, minutes, low: round(fare * SURGE[0]), high: round(fare * SURGE[1]) };
}

export function walkMinutes(km: number) {
	return (km / WALK_KMH) * 60;
}
