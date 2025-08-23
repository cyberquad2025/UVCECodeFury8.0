// translations.js
const translations = {
  en: {
    // English translations for all pages
    nav_home: "Home",
    nav_market: "Marketplace",
    nav_equip: "Equipment",
    nav_login: "Login/Signup",
    nav_dashboard: "Dashboard",
    nav_logout: "Logout",
    // Add all English strings from all your pages here
    // e.g., for login.html
    login_title: "Login",
    login_email: "Email Address",
    login_password: "Password",
    login_btn: "Login",
    login_or: "or",
    login_signup: "Create an Account",
    // e.g., for buyer.html
    buyer_title: "Buyer Dashboard",
    buyer_insights: "Market Insights",
    buyer_weather: "Weather",
    chart_avg: "Average Price",
    chart_qty: "Total Quantity"
  },
  ta: {
    // Tamil translations for all pages
    nav_home: "முகப்பு",
    nav_market: "சந்தை",
    nav_equip: "உபகரணங்கள்",
    nav_login: "உள்நுழை/பதிவு செய்",
    nav_dashboard: "டாஷ்போர்ட்",
    nav_logout: "வெளியேறு",
    // Add all Tamil strings from all your pages here
    login_title: "உள்நுழை",
    login_email: "மின்னஞ்சல் முகவரி",
    login_password: "கடவுச்சொல்",
    login_btn: "உள்நுழை",
    login_or: "அல்லது",
    login_signup: "கணக்கு உருவாக்கு",
    buyer_title: "வாங்குபவர் டாஷ்போர்டு",
    buyer_insights: "சந்தை நுண்ணறிவு",
    buyer_weather: "வானிலை",
    chart_avg: "சராசரி விலை",
    chart_qty: "மொத்த அளவு"
  }
};

function t(key) {
  const lang = localStorage.getItem("lang") || "en";
  return translations[lang][key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

// Automatically apply translations on page load
window.addEventListener("load", applyTranslations);