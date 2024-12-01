const GEMINI_API_KEY = 'AIzaSyCdwQcplfR35WCjlDRg559WfmEEOkEceRg'; // قم بتغيير هذا المفتاح بمفتاح API الخاص بك
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function convertToTasks(text) {
    try {
        const prompt = `
        قم بتحويل النص التالي إلى مهام قابلة للتنفيذ مع تقسيمها إلى مجموعات منطقية.
        أعد النتيجة بتنسيق JSON فقط، بالشكل التالي:
        [
            {
                "group": "اسم المجموعة",
                "tasks": ["المهمة 1", "المهمة 2", "المهمة 3"]
            }
        ]
        
        النص: ${text}`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Gemini Response:', data); // للتشخيص

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response structure from Gemini API');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        console.log('Response Text:', responseText); // للتشخيص

        try {
            // البحث عن النص JSON في الاستجابة
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tasksData = JSON.parse(jsonMatch[0]);
                if (Array.isArray(tasksData) && tasksData.length > 0) {
                    return tasksData;
                }
            }
            throw new Error('Could not find valid JSON in response');
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            // إذا فشل التحليل، نحاول تنظيم النص كمجموعة واحدة
            return [{
                group: "مهام عامة",
                tasks: responseText.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^[-*•]\s*/, '').trim())
            }];
        }
    } catch (error) {
        console.error('Error in convertToTasks:', error);
        // في حالة أي خطأ، نعيد النص الأصلي كمهمة واحدة
        return [{
            group: "مهام عامة",
            tasks: [text]
        }];
    }
}
