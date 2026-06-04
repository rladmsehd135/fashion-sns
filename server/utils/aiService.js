/**
 * 수집된 패션 데이터를 바탕으로 AI 분석 리포트를 생성합니다.
 * 실제 운영 단계에서는 여기서 Google Gemini API 등을 호출하여 실시간 분석을 수행할 수 있습니다.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai'); // 실제 연동 시 필요
require('dotenv').config(); // .env 파일 로드

// Gemini API 키 (실제 키로 교체 필요)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// 스타일 분석용: 가벼운 모델
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
// 코디 추천용: 더 강력한 모델 + 창의성 높임 (v1beta 기본값 사용)
const outfitModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const generateStyleSummary = async (styles, fits) => { // async 함수로 변경
  const fitMap = {
    'small': '슬림한',
    'true': '정사이즈',
    'large': '오버사이즈'
  };

  // AI에게 보낼 프롬프트 구성
  const styleInfo = styles.map(s => `${s.style}(${s.score}점)`).join(', ');
  const fitInfo = fits.map(f => `${fitMap[f.fit_review] || f.fit_review}(${f.cnt}회)`).join(', ');

  const prompt = `
    패션 SNS 사용자의 활동 데이터를 분석하여 스타일 리포트를 작성해주세요.
    
    [사용자 데이터]
    - 선호 스타일 분포: ${styleInfo}
    - 아이템 핏 선호도: ${fitInfo}
    - 데이터가 부족할 경우 사용자의 잠재적인 스타일을 예측해서 답변해주세요.

    [요청 사항]
    위 데이터를 바탕으로 한국어로 매우 구체적이고 독창적으로 분석해주세요. 
    페르소나 명칭(archetype)은 'STYLISH LOGER'와 같이 흔한 표현을 피하고, 
    사용자의 패션 정체성을 관통하는 아주 유니크하고 멋진 영문 명칭으로 지어주세요.
    응답은 반드시 아래 JSON 형식으로만 답변하고, 다른 설명은 생략하세요.
    {
      "summary": "사용자의 패션 특징을 한 문장으로 요약 (50자 이내)",
      "advice": "스타일링 팁이나 추천 아이템 (50자 이내)",
      "colorAnalysis": "데이터 기반의 색상 매치나 무드 조언 (50자 이내)",
      "archetype": "영문으로 된 짧고 강렬한 스타일 페르소나 명칭 (예: MINIMAL ARCHITECT, STREET REBEL)",
      "archetypeDescription": "이 페르소나가 사용자의 어떤 특성을 반영하는지 설명하는 한국어 문장 (50자 이내)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // AI 응답에서 JSON만 추출 (가끔씩 마크다운 형식이 섞일 수 있음)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  } catch (error) {
    console.error('AI Style Analysis Error:', error);
    
    // API 오류 시 사용자의 첫 번째 선호 스타일을 기반으로 동적 기본값 생성
    const topStyle = styles[0]?.style ? styles[0].style.toUpperCase() : 'FASHION';

    return {
      summary: `${styles[0]?.style || '다양한'} 스타일을 즐겨 입으시는군요!`,
      advice: "새로운 스타일 아이템을 믹스매치 해보는 건 어떨까요?",
      colorAnalysis: "자신만의 고유한 컬러 팔레트를 찾아보세요.",
      archetype: `${topStyle} EXPLORER`,
      archetypeDescription: `자신만의 ${styles[0]?.style || '고유한'} 감성을 바탕으로 패션의 지평을 넓혀가는 탐험가`
    };
  }
};

// JSON 안전 추출 (마크다운 코드블록 포함 처리)
const extractJSON = (text) => {
  // ```json ... ``` 혹은 ``` ... ``` 블록 안 JSON 우선 추출
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const target = codeBlock ? codeBlock[1] : text;
  const jsonMatch = target.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON을 찾을 수 없습니다.');
  return JSON.parse(jsonMatch[0]);
};

// 카테고리 매핑
const CAT_KR = { top:'상의', bottom:'하의', outer:'아우터', shoes:'신발', bag:'가방', acc:'액세서리', etc:'기타' };
// 기준 아이템 카테고리 제외한 나머지 카테고리 목록
const remainingCats = (cat) => {
  const all = ['top','bottom','outer','shoes','bag','acc'];
  return all.filter(c => c !== cat).map(c => CAT_KR[c]).join(', ');
};

// 아이템 1개 기반 AI 코디 완성
const generateOutfitComplete = async (item, userProfile = {}) => {
  const { style_archetype, preferred_style, height, weight } = userProfile;
  const catKr = CAT_KR[item.category] || item.category;
  const leftoverCats = remainingCats(item.category);

  const styleContext = [
    preferred_style && `선호 스타일: ${preferred_style}`,
    style_archetype && `스타일 페르소나: ${style_archetype}`,
    height && weight && `체형: ${height}cm / ${weight}kg`,
  ].filter(Boolean).join('\n') || '스타일 정보 없음 (기준 아이템만 고려)';

  const prompt = `당신은 대한민국 MZ세대 패션 전문 스타일리스트입니다.
아래 아이템 하나로 완성된 코디를 만들어주세요.

■ 기준 아이템
카테고리: ${catKr}
브랜드: ${item.brand || '브랜드 미상'}
아이템명: "${item.name}"

■ 착용자 정보
${styleContext}

■ 반드시 지켜야 할 조건
1. "${item.name}"의 소재·색상·핏·무드를 구체적으로 분석해서 어울리는 코디를 추천하세요.
2. 추천 카테고리는 반드시 기준 아이템이 없는 것들(${leftoverCats})로 구성하세요. 기준 아이템과 같은 카테고리는 절대 추천하지 마세요.
3. 모든 아이템 추천은 반드시 "${item.name}"에 특화된 설명이어야 합니다. 일반적인 추천 금지.
4. 3~4가지 카테고리를 추천하세요.

■ 응답 형식 (반드시 아래 JSON만, 다른 텍스트 없이)
{
  "concept": "이 코디의 컨셉 (예: 도쿄 스트릿 빈티지 무드) — 20자 이내",
  "reason": "${item.name}에 이 코디가 어울리는 구체적인 이유 — 70자 이내",
  "items": [
    {
      "category": "top or bottom or outer or shoes or bag or acc",
      "categoryKr": "한국어 카테고리",
      "recommendation": "${item.name}에 특화된 구체적인 아이템 설명",
      "brandSuggestion": "어울리는 실제 브랜드 1~2개",
      "tip": "이 조합만의 스타일링 포인트 — 30자 이내"
    }
  ],
  "colorPalette": ["색상1", "색상2", "색상3"],
  "season": "봄 or 여름 or 가을 or 겨울 or 사계절"
}`;

  try {
    const result = await outfitModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    const text = result.response.text();
    console.log('[AI Outfit] Raw response:', text.slice(0, 300));
    return extractJSON(text);
  } catch (err) {
    console.error('[AI Outfit] Error:', err.message);
    // 에러 시 아이템 정보를 반영한 동적 fallback
    return {
      concept: `${item.name} 기반 코디`,
      reason: `AI 서버 오류로 기본 추천을 드립니다. 잠시 후 다시 시도해보세요. (${err.message?.slice(0, 40)})`,
      items: [
        item.category !== 'bottom' && { category: 'bottom', categoryKr: '하의', recommendation: '미드 라이즈 슬랙스', brandSuggestion: 'Zara, H&M', tip: '깔끔한 핏으로 정돈하세요' },
        item.category !== 'shoes' && { category: 'shoes', categoryKr: '신발', recommendation: '클린 토 로퍼 or 스니커즈', brandSuggestion: 'New Balance, Vans', tip: '발끝으로 스타일 마무리' },
      ].filter(Boolean),
      colorPalette: ['뉴트럴', '베이지', '블랙'],
      season: '사계절',
    };
  }
};

module.exports = {
  generateStyleSummary,
  generateOutfitComplete,
};