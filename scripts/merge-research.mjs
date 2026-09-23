// Merge research JSON files into src/data/places.json, normalising fields and dropping duplicates.
// Usage: node scripts/merge-research.mjs research
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORIES = new Set(['ข้าว/อาหารตามสั่ง','ก๋วยเตี๋ยว/เส้น','ปิ้งย่าง/หมูกระทะ','ชาบู/สุกี้','อาหารอีสาน','อาหารญี่ปุ่น','อาหารเกาหลี','อาหารจีน','อาหารฝรั่ง/ฟาสต์ฟู้ด','อาหารทะเล','คาเฟ่/เครื่องดื่ม','ของหวาน/เบเกอรี่','สตรีทฟู้ด/ของทานเล่น','บุฟเฟต์','อาหารมุสลิม/ฮาลาล','มังสวิรัติ/เจ','อื่นๆ']);
const ZONES = new Set(['ในสจล.','หน้าสจล./ฉลองกรุง','เกกีงามวงศ์วาน','หลังสจล./เลียบทางรถไฟ','หัวตะเข้','หลวงแพ่ง/อ่อนนุช-ลาดกระบัง','ถนนลาดกระบัง/แอร์พอร์ตลิงก์','ร่มเกล้า/เคหะร่มเกล้า','ห้างใกล้มอ']);

const TAG_ALIASES = { 'ริมน้ำ': 'ริมคลอง', 'ราคาไม่แพง': 'ราคาถูก', 'มีปลั๊ก': 'นั่งทำงานได้', 'ไวไฟ': 'Wi-Fi', 'wifi': 'Wi-Fi', 'Delivery': 'เดลิเวอรี่' };

const dir = process.argv[2];
const norm = (s) => (s ?? '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[\s\-_.,'"·@]+/g, '').replace(/^ร้าน/, '');
const out = new Map();
const warnings = [];

for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  for (const raw of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
    if (!raw?.name) continue;
    const p = {
      name: String(raw.name).trim(),
      nameEn: raw.nameEn ? String(raw.nameEn).trim() : null,
      zone: ZONES.has(raw.zone) ? raw.zone : null,
      location: raw.location ?? '',
      category: CATEGORIES.has(raw.category) ? raw.category : 'อื่นๆ',
      tags: [...new Set((raw.tags ?? []).map((t) => String(t).trim()).filter(Boolean))],
      dishes: [...new Set((raw.dishes ?? []).map((t) => String(t).trim()).filter(Boolean))],
      price: [1, 2, 3, 4].includes(Number(raw.price)) ? Number(raw.price) : 2,
      priceText: raw.priceText || null,
      hours: raw.hours || null,
      lat: typeof raw.lat === 'number' && raw.lat > 13.6 && raw.lat < 13.9 ? raw.lat : null,
      lng: typeof raw.lng === 'number' && raw.lng > 100.6 && raw.lng < 100.95 ? raw.lng : null,
      mapsQuery: raw.mapsQuery || `${raw.name} ลาดกระบัง`,
      source: raw.source || '',
      confidence: raw.confidence === 'high' ? 'high' : 'medium',
    };
    if (p.lat == null || p.lng == null) p.lat = p.lng = null;
    p.tags = [...new Set(p.tags.map((t) => TAG_ALIASES[t] ?? t))];
    if (p.category === 'อาหารมุสลิม/ฮาลาล' && !p.tags.includes('ฮาลาล')) p.tags.push('ฮาลาล');
    if (!p.zone) { warnings.push(`${f}: bad zone "${raw.zone}" for ${p.name}`); continue; }
    if (raw.category !== p.category) warnings.push(`${f}: category "${raw.category}" -> อื่นๆ for ${p.name}`);

    // Same shop found by two agents: keep the richer entry, union tags/dishes.
    const key = `${norm(p.name)}|${p.zone}`;
    const prev = out.get(key);
    if (prev) {
      const richer = (x) => x.dishes.length + x.tags.length + (x.hours ? 2 : 0) + (x.lat ? 2 : 0) + (x.confidence === 'high' ? 3 : 0);
      const [keep, other] = richer(p) > richer(prev) ? [p, prev] : [prev, p];
      keep.tags = [...new Set([...keep.tags, ...other.tags])];
      keep.dishes = [...new Set([...keep.dishes, ...other.dishes])];
      keep.hours ??= other.hours; keep.priceText ??= other.priceText;
      if (keep.lat == null) { keep.lat = other.lat; keep.lng = other.lng; }
      out.set(key, keep);
      warnings.push(`dup merged: ${p.name} (${p.zone})`);
    } else out.set(key, p);
  }
}

const places = [...out.values()].sort((a, b) => a.zone.localeCompare(b.zone, 'th') || a.name.localeCompare(b.name, 'th'));
writeFileSync(new URL('../src/data/places.json', import.meta.url), JSON.stringify(places, null, '\t') + '\n');
console.log(warnings.join('\n'));
console.log(`wrote ${places.length} places`);
