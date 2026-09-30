// Get selected language
const selectedLanguage =
    localStorage.getItem("cleanCityLanguage") || "en";

// Translation data
const translations = {

    en: {
        home: "Home",
        report: "Report Waste",
        learn: "Learn",
        nearby: "Nearby Waste",
        myReports: "My Reports",
        profile: "Profile",
        notifications: "Notifications",
        language: "Language",
        back: "Back to Home",
        search: "Search",
        submit: "Submit",
        description: "Description"
    },

    ta: {
        home: "முகப்பு",
        report: "குப்பையைப் புகாரளிக்கவும்",
        learn: "கற்றுக்கொள்ளுங்கள்",
        nearby: "அருகிலுள்ள குப்பைகள்",
        myReports: "எனது புகார்கள்",
        profile: "சுயவிவரம்",
        notifications: "அறிவிப்புகள்",
        language: "மொழி",
        back: "முகப்புக்குத் திரும்பு",
        search: "தேடுக",
        submit: "சமர்ப்பிக்கவும்",
        description: "விளக்கம்"
    },

    hi: {
        home: "होम",
        report: "कचरे की रिपोर्ट करें",
        learn: "सीखें",
        nearby: "पास का कचरा",
        myReports: "मेरी रिपोर्ट",
        profile: "प्रोफ़ाइल",
        notifications: "सूचनाएं",
        language: "भाषा",
        back: "होम पर वापस जाएं",
        search: "खोजें",
        submit: "जमा करें",
        description: "विवरण"
    },

    ml: {
        home: "ഹോം",
        report: "മാലിന്യം റിപ്പോർട്ട് ചെയ്യുക",
        learn: "പഠിക്കുക",
        nearby: "സമീപത്തുള്ള മാലിന്യം",
        myReports: "എന്റെ റിപ്പോർട്ടുകൾ",
        profile: "പ്രൊഫൈൽ",
        notifications: "അറിയിപ്പുകൾ",
        language: "ഭാഷ",
        back: "ഹോമിലേക്ക് മടങ്ങുക",
        search: "തിരയുക",
        submit: "സമർപ്പിക്കുക",
        description: "വിവരണം"
    },

    te: {
        home: "హోమ్",
        report: "వ్యర్థాలను నివేదించండి",
        learn: "నేర్చుకోండి",
        nearby: "సమీపంలోని వ్యర్థాలు",
        myReports: "నా నివేదికలు",
        profile: "ప్రొఫైల్",
        notifications: "నోటిఫికేషన్లు",
        language: "భాష",
        back: "హోమ్‌కు తిరిగి వెళ్లండి",
        search: "వెతకండి",
        submit: "సమర్పించండి",
        description: "వివరణ"
    },

    kn: {
        home: "ಮುಖಪುಟ",
        report: "ತ್ಯಾಜ್ಯವನ್ನು ವರದಿ ಮಾಡಿ",
        learn: "ಕಲಿಯಿರಿ",
        nearby: "ಹತ್ತಿರದ ತ್ಯಾಜ್ಯ",
        myReports: "ನನ್ನ ವರದಿಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        notifications: "ಅಧಿಸೂಚನೆಗಳು",
        language: "ಭಾಷೆ",
        back: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
        search: "ಹುಡುಕಿ",
        submit: "ಸಲ್ಲಿಸಿ",
        description: "ವಿವರಣೆ"
    }
};


// Translate elements
function applyLanguage() {

    const data = translations[selectedLanguage];

    if (!data) return;

    document.querySelectorAll("[data-lang]").forEach(element => {

        const key = element.getAttribute("data-lang");

        if (data[key]) {
            element.textContent = data[key];
        }

    });

}


// Run after page loads
document.addEventListener("DOMContentLoaded", applyLanguage);