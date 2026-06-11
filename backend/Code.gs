function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // 1. 요청 데이터 파싱
    var requestData = JSON.parse(e.postData.contents);
    var studentId = requestData.studentId; 
    var studentName = requestData.studentName; 
    var emotion = requestData.emotion; 
    var diaryText = requestData.diaryText; 
    
    // 2. Gemini API 호출
    var geminiResult = callGeminiAPI(studentId, studentName, emotion, diaryText);
    
    // 3. 스프레드시트 기록
    saveToSheet(studentId, studentName, emotion, diaryText, geminiResult);
    
    // 4. 성공 응답 반환
    return output.setContent(JSON.stringify({
      status: "success",
      studentFeedback: geminiResult.studentFeedback
    }));
    
  } catch (error) {
    return output.setContent(JSON.stringify({
      status: "error",
      message: error.toString()
    }));
  }
}

function callGeminiAPI(studentId, studentName, emotion, diaryText) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  
  // Gemini 2.5 Pro 모델 사용
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" + apiKey;
  
  var systemInstruction = "당신은 초등학교 선생님입니다. 학생이 쓴 감정 일기를 보고 두 가지를 작성해야 합니다.\n" +
"1. studentFeedback: 초등학생 입장에서 이해하기 쉬운 어휘를 사용하고, 아주 따뜻하고 다정하며 공감해 주는 위로/격려 메시지. (존댓말 사용)\n" +
"2. teacherAnalysis: 교사를 위한 분석 데이터. (주요 감정 키워드, 감정 패턴, 잠재적 문제, 교사 제안)\n" +
"반드시 다음 JSON 형식으로만 응답하세요.\n" +
"{\n" +
"  \"studentFeedback\": \"선생님의 따뜻한 피드백 메시지\",\n" +
"  \"teacherAnalysis\": {\n" +
"    \"keywords\": [\"키워드1\", \"키워드2\"],\n" +
"    \"pattern\": \"감정 패턴 설명\",\n" +
"    \"potentialIssue\": \"잠재적 우려 사항 (없으면 '특이사항 없음')\",\n" +
"    \"teacherSuggestion\": \"교사 지도 및 대화 제안\"\n" +
"  }\n" +
"}";

  var userPrompt = "학생 번호: " + studentId + "\n학생 이름: " + studentName + "\n선택한 감정: " + emotion + "\n일기 내용: " + diaryText;

  var payload = {
    "system_instruction": {
      "parts": { "text": systemInstruction }
    },
    "contents": [
      {
        "parts": [
          { "text": userPrompt }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "responseMimeType": "application/json"
    }
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  var textResponse = json.candidates[0].content.parts[0].text;
  
  return JSON.parse(textResponse);
}

function saveToSheet(studentId, studentName, emotion, diaryText, geminiResult) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = studentId === "미입력" ? "미입력" : studentId + "번"; // 예: "1번" 또는 "미입력"
  var sheet = ss.getSheetByName(sheetName);
  
  // 시트가 없으면 생성하고 헤더 추가
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      "타임스탬프", "이름", "선택한 감정", "일기 원문", 
      "학생용 AI 피드백", "주요 감정 키워드", "감정 패턴", "잠재적 문제", "교사 제안"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setColumnWidth(4, 300); // 일기 원문
    sheet.setColumnWidth(5, 400); // 학생용 AI 피드백
  }
  
  var timestamp = new Date();
  var row = [
    timestamp,
    studentName,
    emotion,
    diaryText,
    geminiResult.studentFeedback,
    geminiResult.teacherAnalysis.keywords.join(", "),
    geminiResult.teacherAnalysis.pattern,
    geminiResult.teacherAnalysis.potentialIssue,
    geminiResult.teacherAnalysis.teacherSuggestion
  ];
  
  sheet.appendRow(row);
}
