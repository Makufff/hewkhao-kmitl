export interface Place {
	name: string;
	nameEn: string | null;
	zone: string;
	location: string;
	category: string;
	tags: string[];
	dishes: string[];
	price: number;
	priceText: string | null;
	hours: string | null;
	lat: number | null;
	lng: number | null;
	mapsQuery: string;
	source: string;
	confidence: 'high' | 'medium';
}

// Ordered roughly by distance from the KMITL campus.
export const ZONES = [
	'ในสจล.',
	'หน้าสจล./ฉลองกรุง',
	'เกกีงามวงศ์วาน',
	'หลังสจล./เลียบทางรถไฟ',
	'หัวตะเข้',
	'หลวงแพ่ง/อ่อนนุช-ลาดกระบัง',
	'ถนนลาดกระบัง/แอร์พอร์ตลิงก์',
	'ร่มเกล้า/เคหะร่มเกล้า',
	'ห้างใกล้มอ',
];

export const CATEGORY_EMOJI: Record<string, string> = {
	'ข้าว/อาหารตามสั่ง': '🍛',
	'ก๋วยเตี๋ยว/เส้น': '🍜',
	'ปิ้งย่าง/หมูกระทะ': '🥓',
	'ชาบู/สุกี้': '🍲',
	'อาหารอีสาน': '🌶️',
	'อาหารญี่ปุ่น': '🍣',
	'อาหารเกาหลี': '🥘',
	'อาหารจีน': '🥟',
	'อาหารฝรั่ง/ฟาสต์ฟู้ด': '🍔',
	'อาหารทะเล': '🦐',
	'คาเฟ่/เครื่องดื่ม': '☕',
	'ของหวาน/เบเกอรี่': '🍧',
	'สตรีทฟู้ด/ของทานเล่น': '🍢',
	'บุฟเฟต์': '🍱',
	'อาหารมุสลิม/ฮาลาล': '🍗',
	'มังสวิรัติ/เจ': '🥗',
	'อื่นๆ': '🍽️',
};

export const PRICE_LABEL: Record<string, string> = {
	'1': '฿ ต่ำกว่า 60',
	'2': '฿฿ 60–150',
	'3': '฿฿฿ 150–350',
	'4': '฿฿฿฿ 350+',
};

export function mapsUrl(p: Place) {
	const q = p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : p.mapsQuery || `${p.name} ลาดกระบัง`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
