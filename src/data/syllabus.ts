/**
 * Official Algerian Primary School Syllabus Data for English Language (3AP, 4AP, 5AP)
 * Book series: "My Book of English" (الجيل الثاني - وزارة التربية الوطنية)
 */

import { SubjectModule, Wilaya } from '../types';

export const ALGERIAN_WILAYAS: Wilaya[] = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar' },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef' },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat' },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi' },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna' },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa' },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra' },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar' },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida' },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira' },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset' },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa' },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen' },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret' },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou' },
  { code: '16', nameAr: 'الجزائر', nameFr: 'Alger' },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa' },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel' },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif' },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda' },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda' },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès' },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba' },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma' },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine' },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa' },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem' },
  { code: '28', nameAr: 'المسيلة', nameFr: "M'Sila" },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara' },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla' },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran' },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh' },
  { code: '33', nameAr: 'إليزي', nameFr: 'Illizi' },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj' },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès' },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf' },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf' },
  { code: '38', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt' },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued' },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela' },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras' },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza' },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila' },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla' },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma' },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent' },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa' },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane' },
  { code: '49', nameAr: 'المغير', nameFr: "El M'Ghair" },
  { code: '50', nameAr: 'المناعة', nameFr: 'El Meniaa' },
  { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal' },
  { code: '52', nameAr: 'برج باجي مختار', nameFr: 'Bordj Baji Mokhtar' },
  { code: '53', nameAr: 'بني عباس', nameFr: 'Béni Abbès' },
  { code: '54', nameAr: 'تيميمون', nameFr: 'Timimoun' },
  { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt' },
  { code: '56', nameAr: 'جانت', nameFr: 'Djanet' },
  { code: '57', nameAr: 'إن صالح', nameFr: 'In Salah' },
  { code: '58', nameAr: 'إن قزام', nameFr: 'In Guezzam' }
];

export const PRIMARY_SUBJECTS: SubjectModule[] = [
  {
    id: 'english_listening',
    code: 'ENG_LS',
    nameAr: 'فهم المنطوق والتفاعل الشفهي (Oral Interaction & Listening)',
    nameFr: 'Compréhension & Production Orale (Anglais)',
    grades: ['3AP', '4AP', '5AP'],
    weeklyHours: 0.75,
    coefficient: 1,
    color: 'bg-[#1E3A8A]',
    iconName: 'Globe',
    domains: [
      'Greetings, Self-Introduction & Age',
      'Asking & Answering about Family Members',
      'Classroom Rules & Daily Commands',
      'Songs, Rhymes & Oral Repetition'
    ]
  },
  {
    id: 'english_phonics',
    code: 'ENG_PH',
    nameAr: 'الصوتيات وكتابة الحروف الإنجليزية (Phonics & Alphabet)',
    nameFr: 'Phonétique & Écriture de l\'Alphabet',
    grades: ['3AP', '4AP', '5AP'],
    weeklyHours: 0.75,
    coefficient: 1,
    color: 'bg-[#0D9488]',
    iconName: 'PenTool',
    domains: [
      'Alphabet A-Z Sound-Letter Association',
      'Short & Long Vowel Sounds',
      'Consonant Sounds & Blends',
      'Handwriting & Letter Tracing'
    ]
  },
  {
    id: 'english_reading',
    code: 'ENG_RD',
    nameAr: 'القراءة الفهمية والمفردات (Reading & Vocabulary)',
    nameFr: 'Lecture & Vocabulaire d\'Anglais',
    grades: ['3AP', '4AP', '5AP'],
    weeklyHours: 0.75,
    coefficient: 1,
    color: 'bg-purple-600',
    iconName: 'BookOpen',
    domains: [
      'Reading Short Simple Words & Sentences',
      'Vocabulary Building (Home, Animals, Food)',
      'Picture-Word Matching Exercises',
      'Reading Short Illustrated Stories'
    ]
  },
  {
    id: 'english_writing',
    code: 'ENG_WR',
    nameAr: 'الإنتاج الكتابي والوضعيات الإدماجية (Writing & Integration)',
    nameFr: 'Production Écrite & Situation d\'Intégration',
    grades: ['3AP', '4AP', '5AP'],
    weeklyHours: 0.75,
    coefficient: 1,
    color: 'bg-amber-600',
    iconName: 'FileText',
    domains: [
      'Completing Missing Letters & Words',
      'Writing Short Personal Passages (My Name, My Age)',
      'Constructing Simple Sentences (S+V+O)',
      'Integrative Situations & Mini Projects'
    ]
  }
];

export const UNITS_PER_GRADE: Record<string, string[]> = {
  '3AP': [
    'Sequence 1: Me, My Family & My Friends (Greetings, Alphabet A-Z, Numbers 1-10)',
    'Sequence 2: My School (Classroom objects, Colors, School commands)',
    'Sequence 3: My Home (House rooms, Furniture, Family members)',
    'Sequence 4: My Playtime (Toys, Outdoor games, Numbers 11-20)',
    'Sequence 5: My Pets & Animals (Domestic animals, Body parts of animals)',
    'Sequence 6: My Fancy Birthday (Food, Drinks, Celebrations)'
  ],
  '4AP': [
    'Sequence 1: Family & Occupations (Jobs, Professions, Age & Nationality)',
    'Sequence 2: Food & Shopping (Fruits, Vegetables, Meals, Prices in DZD)',
    'Sequence 3: Health & Body (Body hygiene, Illnesses, Feelings)',
    'Sequence 4: Environment & Nature (Farm animals, Weather, Seasons)',
    'Sequence 5: My Town & Places (Shops, Direction words, Algerian landmarks)'
  ],
  '5AP': [
    'Sequence 1: Algerian Landmarks & Historic Figures (Monuments, Inventors)',
    'Sequence 2: Science & Technology (Computers, Gadgets, Internet safety)',
    'Sequence 3: Stories & Fables (Folk tales, Reading comprehension, Moral lessons)',
    'Sequence 4: Protecting Our Planet (Saving water, Trees, Clean environment)',
    'Sequence 5: Dreams & Future Jobs (Ambitions, Secondary school preparation)'
  ]
};
