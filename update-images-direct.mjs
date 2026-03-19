/**
 * Kolia — Direct Image URL Update Script
 * Updates restaurant and menu item images using Unsplash CDN URLs directly.
 * No Storage needed. Run: node update-images-direct.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axktqgrpxoucnztqqbgw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3RxZ3JweG91Y256dHFxYmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0MjY0NiwiZXhwIjoyMDg4MjE4NjQ2fQ.muYkS6zYYWE5AUvodeyvC-q-oGvSn_VroTa7JOIfLQI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const RESTAURANT_IMAGES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Sabores de Luanda',  image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&auto=format&fit=crop' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Morabeza Kitchen',   image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80&auto=format&fit=crop' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Chez Fatou',         image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&auto=format&fit=crop' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Le Ndole',           image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80&auto=format&fit=crop' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Lagos Grill House',  image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Maman Congo',        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Riad Essaouira',     image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Dakar Grenoble',     image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80&auto=format&fit=crop' },
];

const MENU_IMAGES = [
  { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Muamba de Galinha',          image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Calulu de Peixe',            image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '11111111-1111-1111-1111-111111111111', name: 'Funge com Mufete',           image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '22222222-2222-2222-2222-222222222222', name: 'Cachupa Rica',               image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '22222222-2222-2222-2222-222222222222', name: 'Buzio Grelhado',             image: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Thiéboudienne',              image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Yassa Poulet',               image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '33333333-3333-3333-3333-333333333333', name: 'Mafé Boeuf',                 image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Ndolé',                      image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Poulet DG',                  image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '44444444-4444-4444-4444-444444444444', name: 'Soya Brochettes',            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Jollof Rice',                image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Egusi Soup avec Igname Pilé',image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '55555555-5555-5555-5555-555555555555', name: 'Suya',                       image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Poulet à la Moambé',         image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Pondu',                      image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '66666666-6666-6666-6666-666666666666', name: 'Maboke de Poisson',          image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '77777777-7777-7777-7777-777777777777', name: "Tajine d'Agneau",            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '77777777-7777-7777-7777-777777777777', name: 'Couscous Royal',             image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '77777777-7777-7777-7777-777777777777', name: 'Pastilla au Poulet',         image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '88888888-8888-8888-8888-888888888888', name: 'Yassa Poulet',               image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '88888888-8888-8888-8888-888888888888', name: 'Thiéboudienne',              image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80&auto=format&fit=crop' },
  { restaurant: '88888888-8888-8888-8888-888888888888', name: "Mafé de Bœuf",               image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop' },
];

async function main() {
  console.log('\nKolia — Direct Image URL Update\n');

  // Update restaurants
  console.log('Updating restaurant images...');
  let ok = 0;
  for (const r of RESTAURANT_IMAGES) {
    const { error } = await supabase
      .from('restaurants')
      .update({ image_url: r.image, logo_url: r.image })
      .eq('id', r.id);
    if (error) {
      console.log(`  x ${r.name}: ${error.message}`);
    } else {
      console.log(`  + ${r.name}`);
      ok++;
    }
  }
  console.log(`${ok}/8 restaurants updated.\n`);

  // Update menu items
  console.log('Updating menu item images...');
  let menuOk = 0;
  for (const m of MENU_IMAGES) {
    const { error } = await supabase
      .from('menu_items')
      .update({ image_url: m.image })
      .eq('restaurant_id', m.restaurant)
      .eq('name', m.name);
    if (error) {
      console.log(`  x ${m.name}: ${error.message}`);
    } else {
      console.log(`  + ${m.name}`);
      menuOk++;
    }
  }
  console.log(`${menuOk}/${MENU_IMAGES.length} menu items updated.\n`);

  console.log(`Done! ${ok} restaurants + ${menuOk} menu items now have images.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
