/**
 * Kolia Image Upload Script
 * Downloads food images from Unsplash and uploads them to Supabase Storage.
 * Run: node scripts/upload-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://axktqgrpxoucnztqqbgw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3RxZ3JweG91Y256dHFxYmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0MjY0NiwiZXhwIjoyMDg4MjE4NjQ2fQ.muYkS6zYYWE5AUvodeyvC-q-oGvSn_VroTa7JOIfLQI';
const BUCKET = 'kolia-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IMAGES = [
  // ---- RESTAURANT COVERS ----
  { id: 'restaurant/sabores-de-luanda.jpg',    url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/morabeza-kitchen.jpg',     url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/chez-fatou.jpg',           url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/le-ndole.jpg',             url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/lagos-grill-house.jpg',    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/maman-congo.jpg',          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/riad-essaouira.jpg',       url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85&auto=format&fit=crop' },
  { id: 'restaurant/dakar-grenoble.jpg',       url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=85&auto=format&fit=crop' },

  // ---- MENU ITEMS ----
  // Sabores de Luanda
  { id: 'menu/muamba-de-galinha.jpg',          url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/calulu-de-peixe.jpg',            url: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/funge-com-mufete.jpg',           url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=85&auto=format&fit=crop' },
  // Morabeza Kitchen
  { id: 'menu/cachupa-rica.jpg',               url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/buzio-grelhado.jpg',             url: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=85&auto=format&fit=crop' },
  // Chez Fatou
  { id: 'menu/thieboudienne.jpg',              url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/yassa-poulet.jpg',               url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/mafe-boeuf.jpg',                 url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=85&auto=format&fit=crop' },
  // Le Ndolé
  { id: 'menu/ndole.jpg',                      url: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/poulet-dg.jpg',                  url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/soya-brochettes.jpg',            url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=85&auto=format&fit=crop' },
  // Lagos Grill House
  { id: 'menu/jollof-rice.jpg',               url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/egusi-soup.jpg',                url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/suya.jpg',                      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=85&auto=format&fit=crop' },
  // Maman Congo
  { id: 'menu/poulet-moambe.jpg',             url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/pondu.jpg',                     url: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/maboke-de-poisson.jpg',         url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=85&auto=format&fit=crop' },
  // Riad Essaouira
  { id: 'menu/tajine-agneau.jpg',             url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/couscous-royal.jpg',            url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/pastilla-poulet.jpg',           url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=85&auto=format&fit=crop' },
  // Dakar Grenoble
  { id: 'menu/yassa-poulet-dakar.jpg',        url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/thieboudienne-dakar.jpg',       url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=85&auto=format&fit=crop' },
  { id: 'menu/mafe-de-boeuf.jpg',            url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=85&auto=format&fit=crop' },
];

function download(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const chunks = [];
    const req = protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`✓ Created bucket: ${BUCKET}`);
  } else {
    console.log(`✓ Bucket exists: ${BUCKET}`);
  }
}

async function uploadImage(img) {
  process.stdout.write(`  Downloading ${img.id}... `);
  let buffer;
  try {
    buffer = await download(img.url);
  } catch (err) {
    console.log(`FAIL (download): ${err.message}`);
    return null;
  }

  process.stdout.write(`uploading... `);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(img.id, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.log(`FAIL (upload): ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(img.id);
  console.log(`OK`);
  return { id: img.id, publicUrl: data.publicUrl };
}

async function main() {
  console.log('\n🚀 Kolia Image Upload Script\n');

  await ensureBucket();
  console.log(`\nUploading ${IMAGES.length} images...\n`);

  const results = [];
  for (const img of IMAGES) {
    const result = await uploadImage(img);
    if (result) results.push(result);
  }

  console.log(`\n✅ ${results.length}/${IMAGES.length} images uploaded.\n`);

  // ---- Auto-update database ----
  const restaurantMap = {
    'sabores-de-luanda':  '11111111-1111-1111-1111-111111111111',
    'morabeza-kitchen':   '22222222-2222-2222-2222-222222222222',
    'chez-fatou':         '33333333-3333-3333-3333-333333333333',
    'le-ndole':           '44444444-4444-4444-4444-444444444444',
    'lagos-grill-house':  '55555555-5555-5555-5555-555555555555',
    'maman-congo':        '66666666-6666-6666-6666-666666666666',
    'riad-essaouira':     '77777777-7777-7777-7777-777777777777',
    'dakar-grenoble':     '88888888-8888-8888-8888-888888888888',
  };

  console.log('Updating restaurant images in database...');
  let updated = 0;
  for (const [slug, id] of Object.entries(restaurantMap)) {
    const r = results.find((r) => r.id === `restaurant/${slug}.jpg`);
    if (r) {
      const { error } = await supabase
        .from('restaurants')
        .update({ image_url: r.publicUrl, logo_url: r.publicUrl })
        .eq('id', id);
      if (error) {
        console.log(`  ✗ ${slug}: ${error.message}`);
      } else {
        console.log(`  ✓ ${slug}`);
        updated++;
      }
    }
  }
  console.log(`${updated} restaurants updated.\n`);

  const menuMap = {
    'menu/muamba-de-galinha.jpg':    { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Muamba de Galinha' },
    'menu/calulu-de-peixe.jpg':      { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Calulu de Peixe' },
    'menu/funge-com-mufete.jpg':     { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Funge com Mufete' },
    'menu/cachupa-rica.jpg':         { restaurant: '22222222-2222-2222-2222-222222222222', name: 'Cachupa Rica' },
    'menu/buzio-grelhado.jpg':       { restaurant: '22222222-2222-2222-2222-222222222222', name: 'Buzio Grelhado' },
    'menu/thieboudienne.jpg':        { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Thiéboudienne' },
    'menu/yassa-poulet.jpg':         { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Yassa Poulet' },
    'menu/mafe-boeuf.jpg':           { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Mafé Boeuf' },
    'menu/ndole.jpg':                { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Ndolé' },
    'menu/poulet-dg.jpg':            { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Poulet DG' },
    'menu/soya-brochettes.jpg':      { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Soya Brochettes' },
    'menu/jollof-rice.jpg':          { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Jollof Rice' },
    'menu/egusi-soup.jpg':           { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Egusi Soup avec Igname Pilé' },
    'menu/suya.jpg':                 { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Suya' },
    'menu/poulet-moambe.jpg':        { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Poulet à la Moambé' },
    'menu/pondu.jpg':                { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Pondu' },
    'menu/maboke-de-poisson.jpg':    { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Maboke de Poisson' },
    'menu/tajine-agneau.jpg':        { restaurant: '77777777-7777-7777-7777-777777777777', name: "Tajine d'Agneau" },
    'menu/couscous-royal.jpg':       { restaurant: '77777777-7777-7777-7777-777777777777', name: 'Couscous Royal' },
    'menu/pastilla-poulet.jpg':      { restaurant: '77777777-7777-7777-7777-777777777777', name: 'Pastilla au Poulet' },
    'menu/yassa-poulet-dakar.jpg':   { restaurant: '88888888-8888-8888-8888-888888888888', name: 'Yassa Poulet' },
    'menu/thieboudienne-dakar.jpg':  { restaurant: '88888888-8888-8888-8888-888888888888', name: 'Thiéboudienne' },
    'menu/mafe-de-boeuf.jpg':        { restaurant: '88888888-8888-8888-8888-888888888888', name: "Mafé de Bœuf" },
  };

  console.log('Updating menu item images in database...');
  let menuUpdated = 0;
  for (const [imgId, info] of Object.entries(menuMap)) {
    const r = results.find((r) => r.id === imgId);
    if (r) {
      const { error } = await supabase
        .from('menu_items')
        .update({ image_url: r.publicUrl })
        .eq('restaurant_id', info.restaurant)
        .eq('name', info.name);
      if (error) {
        console.log(`  ✗ ${info.name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${info.name}`);
        menuUpdated++;
      }
    }
  }
  console.log(`${menuUpdated} menu items updated.\n`);

  console.log(`\n🎉 All done! ${updated} restaurants + ${menuUpdated} menu items now have images.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
