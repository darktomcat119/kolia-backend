/**
 * Kolia Delivery — Full Seed Script
 * Run: node scripts/seed.mjs
 * Creates auth users + profiles + restaurants + menu items + sample orders
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axktqgrpxoucnztqqbgw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3RxZ3JweG91Y256dHFxYmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0MjY0NiwiZXhwIjoyMDg4MjE4NjQ2fQ.muYkS6zYYWE5AUvodeyvC-q-oGvSn_VroTa7JOIfLQI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createUser(email, password, fullName, role, address, lat, lng) {
  const { data: existing } = await supabase
    .from('profiles').select('id').eq('email', email).single();
  if (existing) {
    console.log('  already exists: ' + email);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName }
  });
  if (error) { console.error('  FAIL ' + email + ': ' + error.message); return null; }
  const uid = data.user.id;
  await supabase.from('profiles').upsert({
    id: uid, email, full_name: fullName, role,
    address: address || null,
    latitude: lat || null,
    longitude: lng || null,
  });
  console.log('  created: ' + email + ' [' + role + ']');
  return uid;
}

function hours(open, close) {
  return {
    monday:    { open, close },
    tuesday:   { open, close },
    wednesday: { open, close },
    thursday:  { open, close },
    friday:    { open, close: '23:00' },
    saturday:  { open: '12:00', close: '23:00' },
    sunday:    { open: '12:00', close: '21:00' },
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

console.log('\nCreating users...');
const adminId     = await createUser('admin@kolia.app',     'Kolia2024!', 'Kolia Admin',       'admin');
const owner1Id    = await createUser('owner1@kolia.app',    'Kolia2024!', 'Amara Diallo',       'restaurant_owner');
const owner2Id    = await createUser('owner2@kolia.app',    'Kolia2024!', 'Fatou Ndiaye',       'restaurant_owner');
const owner3Id    = await createUser('owner3@kolia.app',    'Kolia2024!', 'Jean-Pierre Mbeki',  'restaurant_owner');
const customerId  = await createUser('customer@kolia.app',  'Kolia2024!', 'Sophie Martin',      'customer',
  '10 Rue de Rivoli, 75001 Paris', 48.8606, 2.3376);
const customer2Id = await createUser('customer2@kolia.app', 'Kolia2024!', 'Lucas Dupont',       'customer',
  '25 Rue de la Republique, 69002 Lyon', 45.7460, 4.8357);

// ── Restaurants ───────────────────────────────────────────────────────────────

const restaurants = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    owner_id: owner1Id,
    name: 'Sabores de Luanda',
    description: 'Authentique cuisine angolaise au coeur de Paris. Muamba de galinha, calulu et funge prepares selon les recettes familiales de Luanda.',
    cuisine_type: 'lusophone_african',
    address: '45 Rue du Faubourg Saint-Denis, 75010 Paris',
    city: 'Paris', country: 'FR',
    latitude: 48.8722, longitude: 2.3549,
    phone: '+33 1 42 46 12 34',
    delivery_fee: 3.00, minimum_order: 12.00,
    estimated_delivery_min: 25, estimated_delivery_max: 40,
    delivery_radius_km: 5.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.7, total_reviews: 186,
    image_url: 'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800',
    opening_hours: hours('11:00','22:00'),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    owner_id: owner1Id,
    name: 'Morabeza Kitchen',
    description: 'Saveurs du Cap-Vert en plein Paris. Cachupa, grillades et poissons marines, une cuisine creole metissee et genereuse.',
    cuisine_type: 'lusophone_african',
    address: '12 Place du Marche Saint-Honore, 75001 Paris',
    city: 'Paris', country: 'FR',
    latitude: 48.8660, longitude: 2.3310,
    phone: '+33 1 40 15 56 78',
    delivery_fee: 3.50, minimum_order: 10.00,
    estimated_delivery_min: 30, estimated_delivery_max: 45,
    delivery_radius_km: 5.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.5, total_reviews: 124,
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    opening_hours: { ...hours('11:00','22:00'), monday: null },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    owner_id: owner2Id,
    name: 'Chez Fatou',
    description: 'La meilleure cuisine senegalaise de Paris. Thieboudienne, yassa poulet et mafe prepares avec des epices importees directement de Dakar.',
    cuisine_type: 'west_african',
    address: '78 Boulevard de la Chapelle, 75018 Paris',
    city: 'Paris', country: 'FR',
    latitude: 48.8842, longitude: 2.3602,
    phone: '+33 1 46 07 23 45',
    delivery_fee: 2.50, minimum_order: 15.00,
    estimated_delivery_min: 35, estimated_delivery_max: 50,
    delivery_radius_km: 6.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.8, total_reviews: 312,
    image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    opening_hours: hours('11:30','22:30'),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    owner_id: owner2Id,
    name: 'Le Ndole',
    description: 'Restaurant camerounais authentique. Ndole aux crevettes, poulet DG et eru — la cuisine de Douala dans votre assiette.',
    cuisine_type: 'central_african',
    address: '23 Rue de la Goutte dOr, 75018 Paris',
    city: 'Paris', country: 'FR',
    latitude: 48.8852, longitude: 2.3527,
    phone: '+33 1 42 52 67 89',
    delivery_fee: 3.00, minimum_order: 12.00,
    estimated_delivery_min: 30, estimated_delivery_max: 45,
    delivery_radius_km: 5.00, pickup_available: false, is_active: true,
    language: 'fr', rating: 4.6, total_reviews: 198,
    image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',
    opening_hours: hours('12:00','22:00'),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    owner_id: owner3Id,
    name: 'Lagos Grill House',
    description: 'Grillades nigerianes et cuisine de rue a Lyon. Suya, jollof rice et egusi soup — des saveurs authentiques de Lagos en France.',
    cuisine_type: 'west_african',
    address: '15 Rue Merciere, 69002 Lyon',
    city: 'Lyon', country: 'FR',
    latitude: 45.7620, longitude: 4.8310,
    phone: '+33 4 72 41 23 56',
    delivery_fee: 2.00, minimum_order: 10.00,
    estimated_delivery_min: 20, estimated_delivery_max: 35,
    delivery_radius_km: 4.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.4, total_reviews: 89,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    opening_hours: hours('11:00','22:00'),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    owner_id: owner3Id,
    name: 'Riad Essaouira',
    description: 'Tajines, couscous et pastilla marocains a Lyon. Une invitation au voyage a travers les saveurs de Marrakech et Essaouira.',
    cuisine_type: 'north_african',
    address: '8 Rue des Marronniers, 69002 Lyon',
    city: 'Lyon', country: 'FR',
    latitude: 45.7490, longitude: 4.8340,
    phone: '+33 4 78 37 89 01',
    delivery_fee: 2.50, minimum_order: 12.00,
    estimated_delivery_min: 25, estimated_delivery_max: 40,
    delivery_radius_km: 5.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.6, total_reviews: 143,
    image_url: 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=800',
    opening_hours: hours('11:30','22:30'),
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    owner_id: owner3Id,
    name: 'Maman Congo',
    description: 'Cuisine congolaise maison a Grenoble. Poulet moambe, saka saka et liboke — les plats qui font le bonheur des dimanches a Kinshasa.',
    cuisine_type: 'central_african',
    address: '34 Rue Felix Poulat, 38000 Grenoble',
    city: 'Grenoble', country: 'FR',
    latitude: 45.1885, longitude: 5.7245,
    phone: '+33 4 76 48 67 23',
    delivery_fee: 1.50, minimum_order: 10.00,
    estimated_delivery_min: 20, estimated_delivery_max: 35,
    delivery_radius_km: 3.00, pickup_available: true, is_active: true,
    language: 'fr', rating: 4.9, total_reviews: 67,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    opening_hours: { ...hours('12:00','21:30'), monday: null, tuesday: null },
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    owner_id: owner1Id,
    name: 'Dakar-Grenoble',
    description: 'Restaurant senegalais moderne a Grenoble. Thieboudienne de la mer, poulet yassa grille et bissap frais.',
    cuisine_type: 'west_african',
    address: '56 Avenue Alsace-Lorraine, 38000 Grenoble',
    city: 'Grenoble', country: 'FR',
    latitude: 45.1882, longitude: 5.7245,
    phone: '+33 4 76 21 34 78',
    delivery_fee: 2.00, minimum_order: 12.00,
    estimated_delivery_min: 25, estimated_delivery_max: 40,
    delivery_radius_km: 4.00, pickup_available: false, is_active: true,
    language: 'fr', rating: 4.5, total_reviews: 52,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    opening_hours: hours('11:00','22:00'),
  },
];

console.log('\nInserting restaurants...');
for (const r of restaurants) {
  const { error } = await supabase.from('restaurants').upsert(r, { onConflict: 'id' });
  if (error) console.error('  FAIL ' + r.name + ': ' + error.message);
  else console.log('  OK ' + r.name + ' (' + r.city + ')');
}

// ── Menu Categories & Items ───────────────────────────────────────────────────

const menus = {
  '11111111-1111-1111-1111-111111111111': {
    cats: ['Entrees', 'Plats Principaux', 'Accompagnements', 'Boissons', 'Desserts'],
    items: [
      ['Entrees',          'Rissois de Crevettes',  'Beignets croustillants fourres aux crevettes fraiches',           6.50, []],
      ['Entrees',          'Banana Pane',            'Banane plantain panee et frite, sauce pimentee',                  4.50, ['vegan','spicy']],
      ['Entrees',          'Pasteis de Bacalhau',    'Beignets de morue avec une touche pimentee',                      5.50, ['spicy']],
      ['Plats Principaux', 'Muamba de Galinha',      'Poulet mijote sauce palme avec gombos et gindungo',               15.50, ['spicy']],
      ['Plats Principaux', 'Calulu de Peixe',        'Poisson seche et frais mijote avec gombos et tomates',            14.50, []],
      ['Plats Principaux', 'Funge com Mufete',       'Funge traditionnel avec poisson grille et haricots a la palme',   13.00, []],
      ['Plats Principaux', 'Feijao de Oleo de Palma','Haricots cuits a la palme avec viande sechee et legumes',         14.00, ['spicy']],
      ['Accompagnements',  'Funje',                  'Farine de manioc traditionnelle',                                 4.00, ['vegan','gluten_free']],
      ['Accompagnements',  'Banana da Terra Frite',  'Plantain frit dore',                                              4.50, ['vegan','gluten_free']],
      ['Accompagnements',  'Arroz de Tomate',        'Riz cuit aux tomates fraiches et epices',                         3.50, ['vegan']],
      ['Boissons',         'Sumo de Mucua',          'Jus de fruit du baobab',                                          3.50, ['vegan']],
      ['Boissons',         'Eau Minerale',           'Eau minerale 50cl',                                               1.50, ['vegan']],
      ['Boissons',         'Coca-Cola',              '33cl',                                                            2.50, ['vegan']],
      ['Desserts',         'Cocada',                 'Douceur noix de coco et sucre caramelise',                        5.50, ['vegetarian','gluten_free']],
      ['Desserts',         'Bolo de Mandioca',       'Gateau moelleux de manioc a la noix de coco',                     6.00, ['vegetarian']],
    ]
  },
  '22222222-2222-2222-2222-222222222222': {
    cats: ['Entrees', 'Plats du Jour', 'Grillades', 'Boissons'],
    items: [
      ['Entrees',     'Pasteis de Atum',     'Chaussons au thon et legumes',                                5.00, []],
      ['Entrees',     'Caldo de Peixe',      'Bouillon de poisson aux legumes capo-verdiens',               6.50, []],
      ['Plats du Jour','Cachupa Rica',       'Ragout de mais, haricots, legumes et viande fume',            15.00, []],
      ['Plats du Jour','Cachupa Refogada',   'Cachupa rechauffee a la poele avec oeuf',                     13.50, []],
      ['Plats du Jour','Frango Grelhado',    'Poulet grille marine aux epices creoles, riz et haricots',    14.00, []],
      ['Plats du Jour','Xerem de Milho',     'Porridge de mais concasse aux haricots et viande',            13.00, []],
      ['Grillades',   'Grelhada Mista',      'Assortiment de viandes et poissons grilles',                  18.00, []],
      ['Grillades',   'Atum Grelhado',       'Thon frais grille aux herbes, salade et cachupa',             16.50, []],
      ['Boissons',    'Ponche',              'Punch traditionnel cap-verdien a la canne',                   4.00, []],
      ['Boissons',    'Grogue',              'Eau-de-vie de canne artisanale',                              3.50, []],
      ['Boissons',    'Eau Minerale',        '50cl',                                                        1.50, ['vegan']],
    ]
  },
  '33333333-3333-3333-3333-333333333333': {
    cats: ['Entrees', 'Plats du Jour', 'Grillades', 'Boissons', 'Desserts'],
    items: [
      ['Entrees',     'Accras de Niebe',     'Beignets de haricots niebe epicés',                           5.00, ['vegan']],
      ['Entrees',     'Salade Tiep',         'Salade fraiche avec legumes et vinaigrette citronnee',         6.50, ['vegan']],
      ['Plats du Jour','Thieboudienne Rouge', 'Le plat national senegalais : riz au poisson sauce tomate',   16.00, []],
      ['Plats du Jour','Yassa Poulet',        'Poulet marine a l oignon et citron, riz basmati',             14.50, []],
      ['Plats du Jour','Mafe Boeuf',          'Ragout de boeuf a la pate d arachide',                        15.00, []],
      ['Plats du Jour','Ceebu Yapp',          'Riz a la viande avec legumes senegalais',                     15.50, []],
      ['Plats du Jour','Domoda',              'Ragout d arachide au poulet et legumes',                      14.00, []],
      ['Grillades',   'Poulet Yassa Grille', 'Demi-poulet grille marine, oignons confits',                  17.00, []],
      ['Grillades',   'Brochettes de Boeuf', 'Brochettes de boeuf marinees aux epices',                     13.00, []],
      ['Boissons',    'Bissap',              'Jus d hibiscus artisanal',                                     3.50, ['vegan']],
      ['Boissons',    'Bouye',               'Jus de pain de singe (baobab)',                                3.50, ['vegan']],
      ['Boissons',    'Eau Minerale',        '50cl',                                                         1.50, ['vegan']],
      ['Desserts',    'Thiakry',             'Creme de mil avec yaourt et noix de coco',                     5.50, ['vegetarian']],
      ['Desserts',    'Ngalakh',             'Dessert festif a la pate d arachide et baobab',                5.00, ['vegetarian']],
    ]
  },
  '44444444-4444-4444-4444-444444444444': {
    cats: ['Entrees', 'Plats Principaux', 'Boissons'],
    items: [
      ['Entrees',          'Beignets Camerounais', 'Beignets moelleux a la farine de manioc',              4.50, ['vegan']],
      ['Entrees',          'Salade Camerounaise',  'Salade de legumes frais, tomates, concombres',         5.50, ['vegan']],
      ['Plats Principaux', 'Ndole',                'Feuilles de ndole aux crevettes et arachides broyees', 15.50, []],
      ['Plats Principaux', 'Poulet DG',            'Poulet saute aux legumes, plantain frit et riz',       16.00, []],
      ['Plats Principaux', 'Eru',                  'Feuilles d eru avec waterleaf et crevettes fumees',    14.50, []],
      ['Plats Principaux', 'Koki',                 'Gateau de haricots cuit dans des feuilles de bananier',12.00, ['vegan']],
      ['Plats Principaux', 'Bongo Chop',           'Riz jollof camerounais avec poulet frit',              14.00, []],
      ['Boissons',         'Jus de Gingembre',     'Gingembre frais presse avec citron et miel',           3.50, ['vegan']],
      ['Boissons',         'Eau Minerale',         '50cl',                                                  1.50, ['vegan']],
    ]
  },
  '55555555-5555-5555-5555-555555555555': {
    cats: ['Starters', 'Mains', 'Grills', 'Sides', 'Drinks'],
    items: [
      ['Starters', 'Puff Puff',       'Beignets nigerians sucres et moelleux',                            4.00, ['vegan']],
      ['Starters', 'Moi Moi',         'Gateau vapeur de haricots black-eye',                              5.50, ['vegetarian']],
      ['Starters', 'Akara',           'Beignets de haricots frits, sauce tomate pimentee',                5.00, ['vegan']],
      ['Mains',    'Jollof Rice',     'Riz jollof epice, poulet et legumes — le classique nigerian',      14.00, []],
      ['Mains',    'Egusi Soup',      'Soupe aux graines de melon avec viande et epinards',               15.50, []],
      ['Mains',    'Pepper Soup',     'Bouillon epice au poulet, epices africaines',                      13.00, ['spicy']],
      ['Mains',    'Ofe Onugbu',      'Soupe amere aux feuilles de bitter leaf et viande',                14.50, []],
      ['Grills',   'Suya Beef',       'Brochettes de boeuf aux epices suya grillees',                     15.00, ['spicy']],
      ['Grills',   'Suya Chicken',    'Poulet grille epice suya, oignons et tomates',                     14.00, ['spicy']],
      ['Sides',    'Fried Plantain',  'Banane plantain sucree frite',                                     4.00, ['vegan','gluten_free']],
      ['Sides',    'Fufu',            'Pate d igname ou de manioc traditionnelle',                        4.50, ['vegan','gluten_free']],
      ['Drinks',   'Zobo',            'Jus d hibiscus epice nigerian',                                    3.00, ['vegan']],
      ['Drinks',   'Chapman',         'Cocktail sans alcool nigerian a la grenadine',                     4.00, ['vegan']],
    ]
  },
  '66666666-6666-6666-6666-666666666666': {
    cats: ['Entrees', 'Tajines', 'Couscous', 'Grillades', 'Patisseries', 'Boissons'],
    items: [
      ['Entrees',     'Briouates Crevettes',      'Feuilletes croustillants aux crevettes et vermicelles',  7.50, []],
      ['Entrees',     'Zaalouk',                  'Caviar d aubergines aux tomates et epices',              5.50, ['vegan']],
      ['Entrees',     'Taktouka',                 'Salade tiede de poivrons et tomates grilles',            5.00, ['vegan']],
      ['Tajines',     'Tajine Poulet Citron',      'Poulet fondant au citron confit et olives vertes',       16.50, []],
      ['Tajines',     'Tajine Agneau Pruneaux',    'Agneau mijote aux pruneaux, amandes et miel',            18.00, []],
      ['Tajines',     'Tajine Kefta',              'Boulettes de viande en sauce tomate epicee',             14.50, []],
      ['Tajines',     'Tajine Legumes',            'Legumes de saison a la chermoula',                       13.00, ['vegan']],
      ['Couscous',    'Couscous Royal',            'Semoule aux 7 legumes, agneau, poulet et merguez',       19.00, []],
      ['Couscous',    'Couscous Vegetarien',       'Semoule aux 7 legumes de saison',                        14.00, ['vegan']],
      ['Grillades',   'Brochettes Agneau',         'Brochettes marinees aux herbes, riz et legumes',         16.00, []],
      ['Grillades',   'Merguez Grillees',          '4 merguez grillees, frites et harissa',                  13.00, ['spicy']],
      ['Patisseries', 'Pastilla au Lait',          'Feuilletes a la creme d amandes et eau de fleur d oranger', 6.50, ['vegetarian']],
      ['Patisseries', 'Cornes de Gazelle',         'Patisseries aux amandes et eau de rose',                 5.50, ['vegetarian']],
      ['Boissons',    'The a la Menthe',           'The vert marocain a la menthe fraiche',                  3.50, ['vegan']],
      ['Boissons',    'Jus d Orange Frais',        'Oranges pressees fraiches',                              4.00, ['vegan']],
    ]
  },
  '77777777-7777-7777-7777-777777777777': {
    cats: ['Entrees', 'Plats Principaux', 'Legumes', 'Boissons'],
    items: [
      ['Entrees',          'Beignets de Banane',  'Banane plantain en beignets sucres-sales',                4.50, ['vegan']],
      ['Entrees',          'Salade Verte',        'Salade fraiche tomates, concombres, carottes',            4.00, ['vegan']],
      ['Plats Principaux', 'Poulet Moambe',       'Poulet mijote a la sauce moambe (noix de palme)',         15.00, []],
      ['Plats Principaux', 'Saka Saka',           'Feuilles de manioc pilees avec poisson fume',             13.50, []],
      ['Plats Principaux', 'Liboke de Poisson',   'Poisson enveloppe dans des feuilles, cuit a l ettouffee', 16.00, []],
      ['Plats Principaux', 'Makayabu',            'Morue salee frite avec saka saka et riz',                 14.50, []],
      ['Plats Principaux', 'Mwamba de Poulet',    'Poulet en sauce aux arachides et piment',                 14.00, ['spicy']],
      ['Legumes',          'Pondu',               'Feuilles de manioc cuites au lait de coco',               6.00, ['vegan','gluten_free']],
      ['Legumes',          'Riz Blanc',           'Riz blanc nature',                                        3.00, ['vegan','gluten_free']],
      ['Legumes',          'Plantain Frit',       'Banane plantain doree',                                   4.00, ['vegan','gluten_free']],
      ['Boissons',         'Jus de Maracuja',     'Jus de fruit de la passion maison',                       3.50, ['vegan']],
      ['Boissons',         'Eau Minerale',        '50cl',                                                    1.50, ['vegan']],
    ]
  },
  '88888888-8888-8888-8888-888888888888': {
    cats: ['Entrees', 'Plats du Jour', 'Grillades', 'Boissons'],
    items: [
      ['Entrees',     'Accras de Morue',    'Beignets de morue croustillants',                               5.50, []],
      ['Entrees',     'Salade d Avocat',    'Avocat, crevettes, vinaigrette citronnee',                      7.00, []],
      ['Plats du Jour','Thieboudienne Mer', 'Riz au poisson sauce tomate, legumes senegalais',               16.50, []],
      ['Plats du Jour','Yassa Poulet',      'Poulet marine citron-oignon, riz basmati',                      14.50, []],
      ['Plats du Jour','Mafe Agneau',       'Ragout d agneau a la pate d arachide',                          15.50, []],
      ['Plats du Jour','Thiou Boeuf',       'Ragout de boeuf tomate avec legumes et riz',                    14.00, []],
      ['Grillades',   'Brochettes Mixtes', 'Assortiment boeuf, poulet et agneau grilles',                   16.00, []],
      ['Grillades',   'Poulet Braise',     'Demi-poulet braise aux epices africaines',                       15.00, []],
      ['Boissons',    'Bissap Maison',     'Jus d hibiscus frais avec menthe',                               3.50, ['vegan']],
      ['Boissons',    'Gingembre Citron',  'Jus de gingembre frais au citron',                               3.50, ['vegan']],
      ['Boissons',    'Eau Minerale',      '50cl',                                                           1.50, ['vegan']],
    ]
  },
};

console.log('\nInserting menu categories and items...');
for (const [restaurantId, menu] of Object.entries(menus)) {
  const catMap = {};
  for (let i = 0; i < menu.cats.length; i++) {
    const catId = 'cat-' + restaurantId.slice(0,8) + '-' + String(i).padStart(3,'0');
    const { error } = await supabase.from('menu_categories').upsert(
      { id: catId, restaurant_id: restaurantId, name: menu.cats[i], sort_order: i },
      { onConflict: 'id' }
    );
    if (!error) catMap[menu.cats[i]] = catId;
  }
  const countBycat = {};
  for (const [cat, name, desc, price, tags] of menu.items) {
    countBycat[cat] = (countBycat[cat] || 0);
    const { error } = await supabase.from('menu_items').upsert({
      restaurant_id: restaurantId,
      category_id: catMap[cat],
      name, description: desc, price,
      is_available: true,
      dietary_tags: tags,
      sort_order: countBycat[cat]++,
    }, { onConflict: 'restaurant_id,name' });
    if (error) console.error('  FAIL item ' + name + ': ' + error.message);
  }
  const r = restaurants.find(x => x.id === restaurantId);
  console.log('  OK ' + r.name + ' — ' + menu.cats.length + ' cats, ' + menu.items.length + ' items');
}

// ── Sample Orders ─────────────────────────────────────────────────────────────

console.log('\nCreating sample orders...');

const { data: itemsFatou } = await supabase
  .from('menu_items').select('id, name, price')
  .eq('restaurant_id', '33333333-3333-3333-3333-333333333333')
  .limit(3);

const { data: itemsLagos } = await supabase
  .from('menu_items').select('id, name, price')
  .eq('restaurant_id', '55555555-5555-5555-5555-555555555555')
  .limit(3);

const { data: itemsLuanda } = await supabase
  .from('menu_items').select('id, name, price')
  .eq('restaurant_id', '11111111-1111-1111-1111-111111111111')
  .limit(2);

async function insertOrder(customerId, restaurantId, items, deliveryFee, address, status) {
  if (!items?.length || !customerId) return;
  const orderItems = items.map(i => ({ menu_item_id: i.id, name: i.name, price: i.price, quantity: 1 }));
  const subtotal = orderItems.reduce((s, i) => s + i.price, 0);
  const { error } = await supabase.from('orders').insert({
    customer_id: customerId,
    restaurant_id: restaurantId,
    status,
    items: orderItems,
    subtotal,
    delivery_fee: deliveryFee,
    total: subtotal + deliveryFee,
    delivery_address: address,
    payment_method: 'card',
    payment_status: 'paid',
  });
  if (error) console.error('  FAIL order: ' + error.message);
  else console.log('  OK order [' + status + '] at restaurant ' + restaurantId.slice(0,8));
}

await insertOrder(customerId,  '33333333-3333-3333-3333-333333333333', itemsFatou,  2.50, '10 Rue de Rivoli, 75001 Paris',              'completed');
await insertOrder(customerId,  '11111111-1111-1111-1111-111111111111', itemsLuanda, 3.00, '10 Rue de Rivoli, 75001 Paris',              'completed');
await insertOrder(customer2Id, '55555555-5555-5555-5555-555555555555', itemsLagos,  2.00, '25 Rue de la Republique, 69002 Lyon',        'preparing');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n=========================================');
console.log('Seed complete!');
console.log('=========================================');
console.log('');
console.log('Test accounts (password: Kolia2024!):');
console.log('  admin@kolia.app      [admin]');
console.log('  owner1@kolia.app     [restaurant_owner] — 3 restaurants');
console.log('  owner2@kolia.app     [restaurant_owner] — 2 restaurants');
console.log('  owner3@kolia.app     [restaurant_owner] — 3 restaurants');
console.log('  customer@kolia.app   [customer - Paris]');
console.log('  customer2@kolia.app  [customer - Lyon]');
console.log('');
console.log('Data created:');
console.log('  8 restaurants (Paris, Lyon, Grenoble)');
console.log('  8 menus with ~10 items each');
console.log('  3 sample orders');
console.log('');
