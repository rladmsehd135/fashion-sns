const BAD_WORDS = [
  '씨발', '씨팔', '시발', '시팔', '씨빨', '시빨',
  '개새끼', '개새', '새끼', '개새기',
  '병신', '빙신',
  '지랄', '존나', '졸라',
  '창녀', '창년', '걸레',
  '보지', '자지',
  '개년', '개놈', '개소리',
  '미친놈', '미친년', '미친새끼',
  '뒤져', '뒤지라', '죽어라',
  '잡년', '잡놈',
  '호로새끼', '호로년',
];

export function filterProfanity(text) {
  if (!text) return text;
  let result = text;
  BAD_WORDS.forEach(word => {
    result = result.split(word).join('*'.repeat(word.length));
  });
  return result;
}

export function hasProfanity(text) {
  if (!text) return false;
  return BAD_WORDS.some(word => text.includes(word));
}
