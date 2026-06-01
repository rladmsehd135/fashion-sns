/**
 * 수집된 패션 데이터를 바탕으로 AI 분석 리포트를 생성합니다.
 * 실제 운영 단계에서는 여기서 Google Gemini API 등을 호출하여 실시간 분석을 수행할 수 있습니다.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai'); // 실제 연동 시 필요
require('dotenv').config(); // .env 파일 로드

// Gemini API 키 (실제 키로 교체 필요)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini 클라이언트 초기화 (실제 연동 시 주석 해제)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 성능과 속도가 좋은 1.5-flash 모델 권장

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

    [요청 사항]
    위 데이터를 바탕으로 한국어로 친절하게 분석해주세요. 
    응답은 반드시 아래 JSON 형식으로만 답변하고, 다른 설명은 생략하세요.
    {
      "summary": "스타일 요약 (50자 이내)",
      "advice": "스타일 제안이나 도전해볼만한 팁 (50자 이내)",
      "colorAnalysis": "데이터 기반의 색상 매치나 무드 조언 (50자 이내)"
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
    // API 오류 시 보여줄 기본(Fallback) 데이터
    return {
      summary: `${styles[0]?.style || '다양한'} 스타일을 즐겨 입으시는군요!`,
      advice: "새로운 스타일 아이템을 믹스매치 해보는 건 어떨까요?",
      colorAnalysis: "자신만의 고유한 컬러 팔레트를 찾아보세요."
    };
  }
};

module.exports = {
  generateStyleSummary
};