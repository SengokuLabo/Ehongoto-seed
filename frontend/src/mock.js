// POST /api/generate レスポンス想定のサンプルデータ

export const mockData = {
  client: 'demo',
  theme: 'life',
  title: 'ものづくりから始まった',
  spreads: [
    { sp_num: 0, text1: 'ものづくりから始まった', text2: '', img: { id: 1, img_path: "/media/images/back1.jpg", angle: "30", size: 35, ox: 10, tilt: -13 } },
    { sp_num: 1, text1: 'ぼくは ものを作るのが好きだった', text2: '', img: { id: 2, img_path: "/media/images/back2.jpg", angle: "90", size: 43, ox: -23, tilt: 10 } },
    { sp_num: 2, text1: '思い描いたものが形になるのは楽しかった', text2: '', img: { id: 3, img_path: "/media/images/back3.jpg", angle: "90", size: 45, ox: -23, tilt: 15 } },
    { sp_num: 3, text1: '真面目で愛想が良く みんなに頼られた', text2: '', img: { id: 4, img_path: "/media/images/back4.jpg", angle: "170", size: 40, ox: 1, tilt: 10 } },
    { sp_num: 4, text1: 'きょうだいが多かったから 孤独ではなかった', text2: '', img: { id: 5, img_path: "/media/images/back5.jpg", angle: "30", size: 45, ox: 10, tilt: -15 } },
    { sp_num: 5, text1: '困った時も立ち止まらず どうしたら上手くいくか考えた', text2: '', img: { id: 6, img_path: "/media/images/back6.jpg", angle: "30", size: 35, ox: 10, tilt: 5 } },
    { sp_num: 6, text1: '大人になった今 家族の時間を大切にしている', text2: '', img: { id: 7, img_path: "/media/images/back7.jpg", angle: "170", size: 25, ox: -2, tilt: -15 } },
    { sp_num: 7, text1: '子どもたちが親のぼくの背中を見て成長していく', text2: '', img: { id: 8, img_path: "/media/images/back8.jpg", angle: "0", size: 53, ox: 1, tilt: -10 } },
    { sp_num: 8, text1: '自分のやりたいことにチャレンジする姿を 見せ続けたい', text2: '', img: { id: 9, img_path: "/media/images/back9.jpg", angle: "170", size: 40, ox: 0, tilt: -5 } },
    { sp_num: 9, text1: 'おわり', text2: '', img: null },
  ],
  face_parts: {
    hair: [
      { id: 1, img_path: "/media/faces/hair1_*.png"},
      { id: 8, img_path: "/media/faces/hair3_*.png"},
      { id: 2, img_path: "/media/faces/hair2_*.png"},
    ],
    eye: [
      { id: 1, img_path: "/media/faces/eye1.png", eye_turn: true},
      { id: 2, img_path: "/media/faces/eye2.png", eye_turn: true},
      { id: 3, img_path: "/media/faces/eye3.png", eye_turn: true},
      { id: 4, img_path: "/media/faces/eye4.png", eye_turn: false},
      { id: 5, img_path: "/media/faces/eye5.png", eye_turn: false},
    ],
    nose: [
      { id: 1, img_path: "/media/faces/nose1.png" },
      { id: 2, img_path: "/media/faces/nose2.png" },
      { id: 3, img_path: "/media/faces/nose3.png" },
      { id: 4, img_path: "/media/faces/nose4.png" },
    ],
    mouth: [
      { id: 1, img_path: "/media/faces/mouth1.png" },
      { id: 2, img_path: "/media/faces/mouth2.png" },
      { id: 4, img_path: "/media/faces/mouth4.png" },
    ],
  },
  hair_colors: [
    { label: '黒',    color: '#1a1a1a' },
    { label: '焦茶',  color: '#3d1f0d' },
    { label: '茶',    color: '#7b3f00' },
    { label: '金',    color: '#d4a017' },
    { label: '赤茶',  color: '#8b3a2a' },
    { label: '灰色',  color: '#808080' },
    { label: '白',    color: '#f5f5f5' },
  ],
  skin_colors: [
    { label: '色白', color: '#fde8d0' },
    { label: '肌色', color: '#f0c08a' },
    { label: '小麦色', color: '#c8956c' },
    { label: '褐色', color: '#8b5e3c' },
    { label: '色黒',  color: '#4a2f1a' },
  ],
  images: [
    { id: 1, img_path: "/media/images/back1.jpg", angle: "30", size: 35, ox: 10, tilt: -13 },
    { id: 2, img_path: "/media/images/back2.jpg", angle: "90", size: 43, ox: -23, tilt: 10 },
    { id: 3, img_path: "/media/images/back3.jpg", angle: "90", size: 45, ox: -23, tilt: 15 },
    { id: 4, img_path: "/media/images/back4.jpg", angle: "170", size: 40, ox: 1, tilt: 10 },
    { id: 5, img_path: "/media/images/back5.jpg", angle: "30", size: 45, ox: 10, tilt: -15 },
    { id: 6, img_path: "/media/images/back6.jpg", angle: "30", size: 35, ox: 10, tilt: 5 },
    { id: 7, img_path: "/media/images/back7.jpg", angle: "170", size: 25, ox: -2, tilt: -15 },
    { id: 8, img_path: "/media/images/back8.jpg", angle: "0", size: 53, ox: 1, tilt: -10 },
    { id: 9, img_path: "/media/images/back9.jpg", angle: "170", size: 40, ox: 0, tilt: -5 },
    { id: 10, img_path: "/media/images/back10.jpg", angle: "170", size: 40, ox: 0, tilt: -15 },
    { id: 11, img_path: "/media/images/back11.jpg", angle: "30", size: 42, ox: 10, tilt: -10 },
    { id: 12, img_path: "/media/images/back12.jpg", angle: "0", size: 0, ox: 0, tilt: 0 },
  ],
  face: {
    hair: 1,
    eye: 1,
    nose: 1,
    mouth: 1,
    hairColor: '#3d1f0d',
    skinColor: '#f0c08a',
    eyeTurn: true,
  },
  log_id: 3,
  price: { pdf: 300, soft: 3000, hard: 8000 },
}



  // HAIR_BLACK = '#1a1a1a'
  // HAIR_DKBROWN = '#3d1f0d'
  // HAIR_BROWN = '#7b3f00'
  // HAIR_GOLD = '#d4a017'
  // HAIR_RDBROWN = '#8b3a2a'
  // HAIR_GRAY = '#808080'
  // HAIR_WHITE = '#f5f5f5'
  // HAIR_COLOR = [
  //   (HAIR_BLACK, '黒'),
  //   (HAIR_DKBROWN, '焦茶'),
  //   (HAIR_BROWN, '茶'),
  //   (HAIR_GOLD, '金'),
  //   (HAIR_RDBROWN, '赤茶'),
  //   (HAIR_GRAY, '灰色'),
  //   (HAIR_WHITE, '白'),
  // ]
  // SKIN_1 = '#fde8d0'
  // SKIN_2 = '#f0c08a'
  // SKIN_3 = '#c8956c'
  // SKIN_4 = '#8b5e3c'
  // SKIN_5 = '#4a2f1a'
  // SKIN = [
  //   (SKIN_1, '色白'),
  //   (SKIN_2, '肌色'),
  //   (SKIN_3, '小麦色'),
  //   (SKIN_4, '褐色'),
  //   (SKIN_5, '色黒'),
  // ]
