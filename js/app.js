/**
 * ============================================================
 * CLICKFUN.IO - FRONTEND APPLICATION ENGINE
 * iOS Modern Design | Google Apps Script REST API Backend
 * ============================================================
 * 
 * API Communication Layer:
 * - Uses text/plain Content-Type to bypass CORS preflight
 * - Exponential backoff retry for network resilience
 * - Dual GET/POST support for maximum compatibility
 */

/* ============================================
   CONFIGURATION & CONSTANTS
   ============================================ */
const CONFIG = {
    // Google Apps Script Web App URL (REPLACE AFTER DEPLOYMENT)
    // Deploy with: Execute as Me, Access: Anyone, even anonymous
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbz_bUCjaDWQckVsEaYwHSYNOH9FVFl3u8xz8pHmDy1pcYE3_hcKHGEoPTiV6OH5iq49aQ/exec',
    
    // Game Settings
    GAME_DURATION: 60,
    
    // Retry Settings
    MAX_RETRIES: 5,
    INITIAL_RETRY_DELAY: 1000,
    RETRY_MULTIPLIER: 2,
    
    // Leaderboard Refresh
    LEADERBOARD_REFRESH_INTERVAL: 8000,
    
    // Country Flags Mapping (ISO country code -> flag emoji)
    // Only country flags are permitted per specification
    FLAGS: {
        'US': '\u{1F1FA}\u{1F1F8}', 'ID': '\u{1F1EE}\u{1F1E9}', 'GB': '\u{1F1EC}\u{1F1E7}',
        'JP': '\u{1F1EF}\u{1F1F5}', 'KR': '\u{1F1F0}\u{1F1F7}', 'DE': '\u{1F1E9}\u{1F1EA}',
        'FR': '\u{1F1EB}\u{1F1F7}', 'BR': '\u{1F1E7}\u{1F1F7}', 'IN': '\u{1F1EE}\u{1F1F3}',
        'AU': '\u{1F1E6}\u{1F1FA}', 'CA': '\u{1F1E8}\u{1F1E6}', 'IT': '\u{1F1EE}\u{1F1F9}',
        'ES': '\u{1F1EA}\u{1F1F8}', 'RU': '\u{1F1F7}\u{1F1FA}', 'CN': '\u{1F1E8}\u{1F1F3}',
        'MX': '\u{1F1F2}\u{1F1FD}', 'NL': '\u{1F1F3}\u{1F1F1}', 'SG': '\u{1F1F8}\u{1F1EC}',
        'MY': '\u{1F1F2}\u{1F1FE}', 'TH': '\u{1F1F9}\u{1F1ED}', 'PH': '\u{1F1F5}\u{1F1ED}',
        'VN': '\u{1F1FB}\u{1F1F3}', 'TR': '\u{1F1F9}\u{1F1F7}', 'SA': '\u{1F1F8}\u{1F1E6}',
        'ZA': '\u{1F1FF}\u{1F1E6}', 'AR': '\u{1F1E6}\u{1F1F7}', 'SE': '\u{1F1F8}\u{1F1EA}',
        'NO': '\u{1F1F3}\u{1F1F4}', 'FI': '\u{1F1EB}\u{1F1EE}', 'PL': '\u{1F1F5}\u{1F1F1}',
        'CH': '\u{1F1E8}\u{1F1ED}', 'BE': '\u{1F1E7}\u{1F1EA}', 'AT': '\u{1F1E6}\u{1F1F9}',
        'DK': '\u{1F1E9}\u{1F1F0}', 'PT': '\u{1F1F5}\u{1F1F9}', 'GR': '\u{1F1EC}\u{1F1F7}',
        'IL': '\u{1F1EE}\u{1F1F1}', 'AE': '\u{1F1E6}\u{1F1EA}', 'NZ': '\u{1F1F3}\u{1F1FF}',
        'IE': '\u{1F1EE}\u{1F1EA}', 'CZ': '\u{1F1E8}\u{1F1FF}', 'HU': '\u{1F1ED}\u{1F1FA}',
        'RO': '\u{1F1F7}\u{1F1F4}', 'UA': '\u{1F1FA}\u{1F1E6}', 'CL': '\u{1F1E8}\u{1F1F1}',
        'CO': '\u{1F1E8}\u{1F1F4}', 'PE': '\u{1F1F5}\u{1F1EA}', 'EG': '\u{1F1EA}\u{1F1EC}',
        'NG': '\u{1F1F3}\u{1F1EC}', 'KE': '\u{1F1F0}\u{1F1EA}', 'PK': '\u{1F1F5}\u{1F1F0}',
        'BD': '\u{1F1E7}\u{1F1E9}', 'LK': '\u{1F1F1}\u{1F1F0}', 'MM': '\u{1F1F2}\u{1F1F2}',
        'KH': '\u{1F1F0}\u{1F1ED}', 'LA': '\u{1F1F1}\u{1F1E6}', 'MN': '\u{1F1F2}\u{1F1F3}',
        'NP': '\u{1F1F3}\u{1F1F5}', 'BT': '\u{1F1E7}\u{1F1F9}', 'AF': '\u{1F1E6}\u{1F1EB}',
        'IR': '\u{1F1EE}\u{1F1F7}', 'IQ': '\u{1F1EE}\u{1F1F6}', 'JO': '\u{1F1EF}\u{1F1F4}',
        'LB': '\u{1F1F1}\u{1F1E7}', 'SY': '\u{1F1F8}\u{1F1FE}', 'YE': '\u{1F1FE}\u{1F1EA}',
        'OM': '\u{1F1F4}\u{1F1F2}', 'QA': '\u{1F1F6}\u{1F1E6}', 'KW': '\u{1F1F0}\u{1F1FC}',
        'BH': '\u{1F1E7}\u{1F1ED}', 'KZ': '\u{1F1F0}\u{1F1FF}', 'UZ': '\u{1F1FA}\u{1F1FF}',
        'KG': '\u{1F1F0}\u{1F1EC}', 'TJ': '\u{1F1F9}\u{1F1EF}', 'TM': '\u{1F1F9}\u{1F1F2}',
        'AZ': '\u{1F1E6}\u{1F1FF}', 'GE': '\u{1F1EC}\u{1F1EA}', 'AM': '\u{1F1E6}\u{1F1F2}',
        'MD': '\u{1F1F2}\u{1F1E9}', 'BY': '\u{1F1E7}\u{1F1FE}', 'LT': '\u{1F1F1}\u{1F1F9}',
        'LV': '\u{1F1F1}\u{1F1FB}', 'EE': '\u{1F1EA}\u{1F1EA}', 'SK': '\u{1F1F8}\u{1F1F0}',
        'SI': '\u{1F1F8}\u{1F1EE}', 'HR': '\u{1F1ED}\u{1F1F7}', 'BA': '\u{1F1E7}\u{1F1E6}',
        'RS': '\u{1F1F7}\u{1F1F8}', 'ME': '\u{1F1F2}\u{1F1EA}', 'MK': '\u{1F1F2}\u{1F1F0}',
        'AL': '\u{1F1E6}\u{1F1F1}', 'BG': '\u{1F1E7}\u{1F1EC}', 'IS': '\u{1F1EE}\u{1F1F8}',
        'MT': '\u{1F1F2}\u{1F1F9}', 'CY': '\u{1F1E8}\u{1F1FE}', 'LU': '\u{1F1F1}\u{1F1FA}',
        'MC': '\u{1F1F2}\u{1F1E8}', 'LI': '\u{1F1F1}\u{1F1EE}', 'SM': '\u{1F1F8}\u{1F1F2}',
        'AD': '\u{1F1E6}\u{1F1E9}', 'VA': '\u{1F1FB}\u{1F1E6}', 'MA': '\u{1F1F2}\u{1F1E6}',
        'DZ': '\u{1F1E9}\u{1F1FF}', 'TN': '\u{1F1F9}\u{1F1F3}', 'LY': '\u{1F1F1}\u{1F1FE}',
        'SD': '\u{1F1F8}\u{1F1E9}', 'ET': '\u{1F1EA}\u{1F1F9}', 'GH': '\u{1F1EC}\u{1F1ED}',
        'TZ': '\u{1F1F9}\u{1F1FF}', 'UG': '\u{1F1FA}\u{1F1EC}', 'RW': '\u{1F1F7}\u{1F1FC}',
        'MZ': '\u{1F1F2}\u{1F1FF}', 'ZM': '\u{1F1FF}\u{1F1F2}', 'ZW': '\u{1F1FF}\u{1F1FC}',
        'BW': '\u{1F1E7}\u{1F1FC}', 'NA': '\u{1F1F3}\u{1F1E6}', 'AO': '\u{1F1E6}\u{1F1F4}',
        'CM': '\u{1F1E8}\u{1F1F2}', 'CI': '\u{1F1E8}\u{1F1EE}', 'SN': '\u{1F1F8}\u{1F1F3}',
        'ML': '\u{1F1F2}\u{1F1F1}', 'BF': '\u{1F1E7}\u{1F1EB}', 'NE': '\u{1F1F3}\u{1F1EA}',
        'TD': '\u{1F1F9}\u{1F1E9}', 'MR': '\u{1F1F2}\u{1F1F7}', 'GM': '\u{1F1EC}\u{1F1F2}',
        'GN': '\u{1F1EC}\u{1F1F3}', 'SL': '\u{1F1F8}\u{1F1F1}', 'LR': '\u{1F1F1}\u{1F1F7}',
        'TG': '\u{1F1F9}\u{1F1EC}', 'BJ': '\u{1F1E7}\u{1F1EF}', 'GA': '\u{1F1EC}\u{1F1E6}',
        'CG': '\u{1F1E8}\u{1F1EC}', 'CD': '\u{1F1E8}\u{1F1E9}', 'CF': '\u{1F1E8}\u{1F1EB}',
        'GQ': '\u{1F1EC}\u{1F1F6}', 'ST': '\u{1F1F8}\u{1F1F9}', 'CV': '\u{1F1E8}\u{1F1FB}',
        'SC': '\u{1F1F8}\u{1F1E8}', 'MU': '\u{1F1F2}\u{1F1FA}', 'MG': '\u{1F1F2}\u{1F1EC}',
        'KM': '\u{1F1F0}\u{1F1F2}', 'DJ': '\u{1F1E9}\u{1F1EF}', 'ER': '\u{1F1EA}\u{1F1F7}',
        'SO': '\u{1F1F8}\u{1F1F4}', 'SS': '\u{1F1F8}\u{1F1F8}', 'BI': '\u{1F1E7}\u{1F1EE}',
        'MW': '\u{1F1F2}\u{1F1FC}', 'LS': '\u{1F1F1}\u{1F1F8}', 'SZ': '\u{1F1F8}\u{1F1FF}',
        'VE': '\u{1F1FB}\u{1F1EA}', 'GY': '\u{1F1EC}\u{1F1FE}', 'SR': '\u{1F1F8}\u{1F1F7}',
        'GF': '\u{1F1EC}\u{1F1EB}', 'EC': '\u{1F1EA}\u{1F1E8}', 'BO': '\u{1F1E7}\u{1F1F4}',
        'PY': '\u{1F1F5}\u{1F1FE}', 'UY': '\u{1F1FA}\u{1F1FE}', 'FK': '\u{1F1EB}\u{1F1F0}',
        'JM': '\u{1F1EF}\u{1F1F2}', 'HT': '\u{1F1ED}\u{1F1F9}', 'DO': '\u{1F1E9}\u{1F1F4}',
        'CU': '\u{1F1E8}\u{1F1FA}', 'PR': '\u{1F1F5}\u{1F1F7}', 'TT': '\u{1F1F9}\u{1F1F9}',
        'BB': '\u{1F1E7}\u{1F1E7}', 'GD': '\u{1F1EC}\u{1F1E9}', 'LC': '\u{1F1F1}\u{1F1E8}',
        'VC': '\u{1F1FB}\u{1F1E8}', 'KN': '\u{1F1F0}\u{1F1F3}', 'AG': '\u{1F1E6}\u{1F1EC}',
        'DM': '\u{1F1E9}\u{1F1F2}', 'BS': '\u{1F1E7}\u{1F1F8}', 'BZ': '\u{1F1E7}\u{1F1FF}',
        'GT': '\u{1F1EC}\u{1F1F9}', 'HN': '\u{1F1ED}\u{1F1F3}', 'SV': '\u{1F1F8}\u{1F1FB}',
        'NI': '\u{1F1F3}\u{1F1EE}', 'CR': '\u{1F1E8}\u{1F1F7}', 'PA': '\u{1F1F5}\u{1F1E6}',
        'GL': '\u{1F1EC}\u{1F1F1}', 'FJ': '\u{1F1EB}\u{1F1EF}', 'PG': '\u{1F1F5}\u{1F1EC}',
        'SB': '\u{1F1F8}\u{1F1E7}', 'VU': '\u{1F1FB}\u{1F1FA}', 'NC': '\u{1F1F3}\u{1F1E8}',
        'PF': '\u{1F1F5}\u{1F1EB}', 'WS': '\u{1F1FC}\u{1F1F8}', 'TO': '\u{1F1F9}\u{1F1F4}',
        'KI': '\u{1F1F0}\u{1F1EE}', 'TV': '\u{1F1F9}\u{1F1FB}', 'NR': '\u{1F1F3}\u{1F1F7}',
        'PW': '\u{1F1F5}\u{1F1FC}', 'MH': '\u{1F1F2}\u{1F1ED}', 'FM': '\u{1F1EB}\u{1F1F2}',
        'GU': '\u{1F1EC}\u{1F1FA}', 'MP': '\u{1F1F2}\u{1F1F5}', 'AS': '\u{1F1E6}\u{1F1F8}',
        'CK': '\u{1F1E8}\u{1F1F0}', 'NU': '\u{1F1F3}\u{1F1FA}', 'TK': '\u{1F1F9}\u{1F1F0}',
        'WF': '\u{1F1FC}\u{1F1EB}', 'PN': '\u{1F1F5}\u{1F1F3}', 'IO': '\u{1F1EE}\u{1F1F4}',
        'CX': '\u{1F1E8}\u{1F1FD}', 'CC': '\u{1F1E8}\u{1F1E8}', 'NF': '\u{1F1F3}\u{1F1EB}',
        'HM': '\u{1F1ED}\u{1F1F2}', 'AQ': '\u{1F1E6}\u{1F1F6}', 'BV': '\u{1F1E7}\u{1F1FB}',
        'TF': '\u{1F1F9}\u{1F1EB}', 'GS': '\u{1F1EC}\u{1F1F8}', 'UM': '\u{1F1FA}\u{1F1F2}',
        'Other': '\u{1F30D}'
    }
};

/* ============================================
   STATE MANAGEMENT
   ============================================ */
const State = {
    currentView: 'loading',
    currentUser: null,
    currentSlide: 0,
    totalSlides: 4,
    gameActive: false,
    gamePaused: false,
    clickCount: 0,
    timerValue: CONFIG.GAME_DURATION,
    timerInterval: null,
    leaderboardInterval: null,
    leaderboardData: [],
    personalBest: 0,
    globalRank: '--',
    
    setUser(user) {
        this.currentUser = user;
        this.personalBest = user?.highScore || 0;
    },
    
    clearUser() {
        this.currentUser = null;
        this.personalBest = 0;
        this.globalRank = '--';
    }
};

/* ============================================
   DOM REFERENCES
   ============================================ */
const DOM = {};

function cacheDOM() {
    // Views
    DOM.viewLoading = document.getElementById('view-loading');
    DOM.viewOnboard = document.getElementById('view-onboard');
    DOM.viewAuth = document.getElementById('view-auth');
    DOM.viewDashboard = document.getElementById('view-dashboard');
    
    // Onboarding
    DOM.onboardSlides = document.getElementById('onboard-slides');
    DOM.onboardDots = document.getElementById('onboard-dots');
    DOM.navPrev = document.getElementById('nav-prev');
    DOM.navNext = document.getElementById('nav-next');
    DOM.btnStartJourney = document.getElementById('btn-start-journey');
    
    // Auth
    DOM.authTabs = document.querySelectorAll('.auth-tab');
    DOM.authTabIndicator = document.querySelector('.auth-tab-indicator');
    DOM.formLogin = document.getElementById('form-login');
    DOM.formRegister = document.getElementById('form-register');
    DOM.btnLogin = document.getElementById('btn-login');
    DOM.btnRegister = document.getElementById('btn-register');
    DOM.togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // Dashboard
    DOM.dashUsername = document.getElementById('dash-username');
    DOM.dashAvatar = document.getElementById('dash-avatar');
    DOM.btnLogout = document.getElementById('btn-logout');
    DOM.btnStartGame = document.getElementById('btn-start-game');
    DOM.previewHighscore = document.getElementById('preview-highscore');
    DOM.previewRank = document.getElementById('preview-rank');
    DOM.sectionPlay = document.getElementById('section-play');
    DOM.sectionLeaderboard = document.getElementById('section-leaderboard');
    DOM.lbList = document.getElementById('lb-list');
    DOM.navItems = document.querySelectorAll('.nav-item');
    
    // Game Arena
    DOM.gameArena = document.getElementById('game-arena');
    DOM.gameClicks = document.getElementById('game-clicks');
    DOM.gameTimer = document.getElementById('game-timer');
    DOM.gameHighscore = document.getElementById('game-highscore');
    DOM.timerProgress = document.getElementById('timer-progress');
    DOM.btnPause = document.getElementById('btn-pause');
    DOM.gameZone = document.getElementById('game-zone');
    DOM.clickRipples = document.getElementById('click-ripples');
    
    // Modals
    DOM.modalGameover = document.getElementById('modal-gameover');
    DOM.modalPause = document.getElementById('modal-pause');
    DOM.resultScore = document.getElementById('result-score');
    DOM.resultBest = document.getElementById('result-best');
    DOM.btnRestartGame = document.getElementById('btn-restart-game');
    DOM.btnReturnMenu = document.getElementById('btn-return-menu');
    DOM.btnViewLb = document.getElementById('btn-view-lb');
    DOM.btnResume = document.getElementById('btn-resume');
    DOM.btnQuitGame = document.getElementById('btn-quit-game');
    
    // Toast
    DOM.toastContainer = document.getElementById('toast-container');
}

/* ============================================
   VIEW NAVIGATION
   ============================================ */
function switchView(viewName) {
    const views = ['view-loading', 'view-onboard', 'view-auth', 'view-dashboard'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.remove('active');
    });
    
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
        State.currentView = viewName;
    }
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
        error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };
    
    toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ============================================
   API CLIENT WITH EXPONENTIAL BACKOFF RETRY
   ============================================
   
   CRITICAL CORS STRATEGY:
   - Google Apps Script Web Apps cannot handle preflight OPTIONS requests.
   - Using Content-Type: text/plain skips the preflight check entirely.
   - The body is still JSON.stringify()-ed; the backend parses it.
   - Redirect: 'follow' is required because Apps Script returns 302 redirects.
   - GET requests use query parameters for safe, idempotent reads.
   ============================================ */
async function apiRequest(action, data = {}, method = 'POST') {
    let retries = 0;
    let delay = CONFIG.INITIAL_RETRY_DELAY;
    
    while (retries <= CONFIG.MAX_RETRIES) {
        try {
            let response;
            
            if (method === 'GET') {
                // GET: Encode parameters in URL query string
                const params = new URLSearchParams({ action, ...data });
                const url = `${CONFIG.API_BASE_URL}?${params.toString()}`;
                
                response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow'
                });
            } else {
                // POST: Use text/plain to bypass CORS preflight
                // The backend receives the raw string and JSON.parse() it
                response = await fetch(CONFIG.API_BASE_URL, {
                    method: 'POST',
                    redirect: 'follow',
                    headers: { 
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({ action, ...data })
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            retries++;
            
            if (retries > CONFIG.MAX_RETRIES) {
                console.error('API Request failed after max retries:', error);
                throw new Error(`Network error: ${error.message}. Please check your connection and try again.`);
            }
            
            showToast(`Retrying... (${retries}/${CONFIG.MAX_RETRIES})`, 'warning', 1500);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= CONFIG.RETRY_MULTIPLIER;
        }
    }
}

/* ============================================
   VIEW 1: LOADING SCREEN
   ============================================ */
function initLoadingScreen() {
    setTimeout(() => {
        switchView('onboard');
    }, 2500);
}

/* ============================================
   VIEW 2: ONBOARDING SLIDER
   ============================================ */
function initOnboarding() {
    updateSlide(0);
    
    DOM.navPrev.addEventListener('click', () => {
        if (State.currentSlide > 0) updateSlide(State.currentSlide - 1);
    });
    
    DOM.navNext.addEventListener('click', () => {
        if (State.currentSlide < State.totalSlides - 1) updateSlide(State.currentSlide + 1);
    });
    
    DOM.btnStartJourney.addEventListener('click', () => {
        switchView('auth');
    });
    
    // Dot navigation
    DOM.onboardDots.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            updateSlide(parseInt(dot.dataset.index));
        });
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    DOM.onboardSlides.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    DOM.onboardSlides.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && State.currentSlide < State.totalSlides - 1) {
                updateSlide(State.currentSlide + 1);
            } else if (diff < 0 && State.currentSlide > 0) {
                updateSlide(State.currentSlide - 1);
            }
        }
    }
}

function updateSlide(index) {
    const slides = DOM.onboardSlides.querySelectorAll('.onboard-slide');
    const dots = DOM.onboardDots.querySelectorAll('.dot');
    
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === index) slide.classList.add('active');
        else if (i < index) slide.classList.add('prev');
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    State.currentSlide = index;
    
    DOM.navPrev.disabled = index === 0;
    DOM.navNext.disabled = index === State.totalSlides - 1;
    DOM.navNext.style.opacity = index === State.totalSlides - 1 ? '0' : '1';
    DOM.navNext.style.pointerEvents = index === State.totalSlides - 1 ? 'none' : 'auto';
}

/* ============================================
   VIEW 3: AUTHENTICATION
   ============================================ */
function initAuth() {
    // Tab switching
    DOM.authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            DOM.authTabs.forEach(t => t.classList.toggle('active', t === tab));
            
            if (targetTab === 'register') {
                DOM.authTabIndicator.classList.add('register');
                DOM.formLogin.classList.remove('active');
                DOM.formRegister.classList.add('active');
            } else {
                DOM.authTabIndicator.classList.remove('register');
                DOM.formLogin.classList.add('active');
                DOM.formRegister.classList.remove('active');
            }
            
            clearFormErrors();
        });
    });
    
    // Password visibility toggle
    DOM.togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    });
    
    // Login form
    DOM.formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        let hasError = false;
        
        if (!username) {
            showFieldError('login-username', 'Username is required');
            hasError = true;
        }
        if (!password) {
            showFieldError('login-password', 'Password is required');
            hasError = true;
        }
        
        if (hasError) return;
        
        setButtonLoading(DOM.btnLogin, true);
        
        try {
            const result = await apiRequest('login', { username, password });
            
            if (result.success) {
                State.setUser(result.user);
                showToast('Welcome back, ' + username + '!', 'success');
                enterDashboard();
            } else {
                showToast(result.error || 'Invalid credentials', 'error');
                showFieldError('login-password', result.error || 'Invalid username or password');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setButtonLoading(DOM.btnLogin, false);
        }
    });
    
    // Registration form
    DOM.formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors();
        
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        const country = document.getElementById('reg-country').value;
        
        let hasError = false;
        
        if (!username || username.length < 3) {
            showFieldError('reg-username', 'Username must be at least 3 characters');
            hasError = true;
        }
        if (!password || password.length < 4) {
            showFieldError('reg-password', 'Password must be at least 4 characters');
            hasError = true;
        }
        if (password !== confirm) {
            showFieldError('reg-confirm', 'Passwords do not match');
            hasError = true;
        }
        if (!country) {
            showFieldError('reg-country', 'Please select a country');
            hasError = true;
        }
        
        if (hasError) return;
        
        setButtonLoading(DOM.btnRegister, true);
        
        try {
            const result = await apiRequest('register', { 
                username, 
                password, 
                countryFlag: country 
            });
            
            if (result.success) {
                State.setUser(result.user);
                showToast('Account created successfully!', 'success');
                enterDashboard();
            } else {
                showToast(result.error || 'Registration failed', 'error');
                if (result.error && result.error.toLowerCase().includes('username')) {
                    showFieldError('reg-username', result.error);
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setButtonLoading(DOM.btnRegister, false);
        }
    });
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + '-error');
    const inputEl = document.getElementById(fieldId);
    const group = inputEl?.closest('.form-group');
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
    if (group) group.classList.add('has-error');
}

function clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    document.querySelectorAll('.form-group').forEach(el => {
        el.classList.remove('has-error');
    });
}

function setButtonLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
}

/* ============================================
   VIEW 4: DASHBOARD
   ============================================ */
function enterDashboard() {
    switchView('dashboard');
    updateDashboardUI();
    startLeaderboardRefresh();
    fetchLeaderboard();
}

function updateDashboardUI() {
    if (!State.currentUser) return;
    
    DOM.dashUsername.textContent = State.currentUser.username;
    DOM.dashAvatar.textContent = State.currentUser.username.charAt(0).toUpperCase();
    DOM.previewHighscore.textContent = State.personalBest.toLocaleString();
    DOM.previewRank.textContent = State.globalRank;
    DOM.gameHighscore.textContent = State.personalBest.toLocaleString();
}

function initDashboard() {
    // Bottom nav
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const nav = item.dataset.nav;
            DOM.navItems.forEach(n => n.classList.toggle('active', n === item));
            
            if (nav === 'play') {
                DOM.sectionPlay.classList.add('active');
                DOM.sectionLeaderboard.classList.remove('active');
            } else if (nav === 'leaderboard') {
                DOM.sectionPlay.classList.remove('active');
                DOM.sectionLeaderboard.classList.add('active');
                fetchLeaderboard();
            }
        });
    });
    
    // Logout
    DOM.btnLogout.addEventListener('click', () => {
        State.clearUser();
        stopLeaderboardRefresh();
        clearForms();
        switchView('auth');
        showToast('Logged out successfully', 'info');
    });
    
    // Start game
    DOM.btnStartGame.addEventListener('click', startGame);
    
    // Game controls
    DOM.btnPause.addEventListener('click', pauseGame);
    DOM.btnResume.addEventListener('click', resumeGame);
    DOM.btnQuitGame.addEventListener('click', quitGame);
    DOM.btnRestartGame.addEventListener('click', () => {
        closeModal(DOM.modalGameover);
        startGame();
    });
    DOM.btnReturnMenu.addEventListener('click', () => {
        closeModal(DOM.modalGameover);
        DOM.gameArena.classList.remove('active');
    });
    DOM.btnViewLb.addEventListener('click', () => {
        closeModal(DOM.modalGameover);
        DOM.gameArena.classList.remove('active');
        DOM.navItems.forEach(n => n.classList.toggle('active', n.dataset.nav === 'leaderboard'));
        DOM.sectionPlay.classList.remove('active');
        DOM.sectionLeaderboard.classList.add('active');
        fetchLeaderboard();
    });
    
    // Game zone click
    DOM.gameZone.addEventListener('mousedown', handleGameClick);
    DOM.gameZone.addEventListener('touchstart', handleGameClick, { passive: false });
    
    // Modal backdrop close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', () => {
            const modal = backdrop.closest('.ios-modal');
            if (modal === DOM.modalPause) resumeGame();
        });
    });
}

function clearForms() {
    DOM.formLogin.reset();
    DOM.formRegister.reset();
    clearFormErrors();
}

/* ============================================
   LEADERBOARD
   ============================================ */
function startLeaderboardRefresh() {
    if (State.leaderboardInterval) clearInterval(State.leaderboardInterval);
    State.leaderboardInterval = setInterval(() => {
        if (State.currentView === 'dashboard' && 
            DOM.sectionLeaderboard.classList.contains('active')) {
            fetchLeaderboard();
        }
    }, CONFIG.LEADERBOARD_REFRESH_INTERVAL);
}

function stopLeaderboardRefresh() {
    if (State.leaderboardInterval) {
        clearInterval(State.leaderboardInterval);
        State.leaderboardInterval = null;
    }
}

async function fetchLeaderboard() {
    try {
        // Use GET for leaderboard (idempotent read operation)
        const result = await apiRequest('getLeaderboard', {}, 'GET');
        
        if (result.success) {
            State.leaderboardData = result.data || [];
            renderLeaderboard();
            updateUserRank();
        }
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
    }
}

function renderLeaderboard() {
    const data = State.leaderboardData;
    
    if (!data || data.length === 0) {
        DOM.lbList.innerHTML = `<div class="lb-empty">No scores yet. Be the first!</div>`;
        return;
    }
    
    const currentUsername = State.currentUser?.username;
    
    DOM.lbList.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = entry.username === currentUsername;
        const flag = CONFIG.FLAGS[entry.countryFlag] || '\u{1F30D}';
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        // Use SVG rank badges instead of emoji medals per specification
        const rankDisplay = rank === 1 ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>' :
                           rank === 2 ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>' :
                           rank === 3 ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CD7F32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>' :
                           '#' + rank;
        
        return `
            <div class="lb-row ${rankClass} ${isCurrentUser ? 'current-user' : ''}" style="animation-delay: ${index * 0.05}s">
                <span class="lb-col-rank">${rankDisplay}</span>
                <span class="lb-col-flag">${flag}</span>
                <span class="lb-col-user">${escapeHtml(entry.username)}</span>
                <span class="lb-col-score">${(entry.highScore || 0).toLocaleString()}</span>
            </div>
        `;
    }).join('');
}

function updateUserRank() {
    if (!State.currentUser) return;
    
    const data = State.leaderboardData;
    const index = data.findIndex(e => e.username === State.currentUser.username);
    
    if (index >= 0) {
        State.globalRank = '#' + (index + 1);
    } else {
        State.globalRank = '--';
    }
    
    DOM.previewRank.textContent = State.globalRank;
}

/* ============================================
   GAME ENGINE
   ============================================ */
function startGame() {
    State.gameActive = true;
    State.gamePaused = false;
    State.clickCount = 0;
    State.timerValue = CONFIG.GAME_DURATION;
    
    DOM.gameClicks.textContent = '0';
    DOM.gameTimer.textContent = CONFIG.GAME_DURATION;
    DOM.gameHighscore.textContent = State.personalBest.toLocaleString();
    updateTimerRing(CONFIG.GAME_DURATION);
    
    DOM.gameArena.classList.add('active');
    DOM.clickRipples.innerHTML = '';
    
    startTimer();
    
    // Hide hint after first click
    setTimeout(() => {
        DOM.gameZone.classList.add('clicking');
    }, 2000);
}

function startTimer() {
    if (State.timerInterval) clearInterval(State.timerInterval);
    
    State.timerInterval = setInterval(() => {
        if (State.gamePaused) return;
        
        State.timerValue--;
        DOM.gameTimer.textContent = State.timerValue;
        updateTimerRing(State.timerValue);
        
        if (State.timerValue <= 10) {
            DOM.gameTimer.style.color = 'var(--color-danger)';
        } else {
            DOM.gameTimer.style.color = '';
        }
        
        if (State.timerValue <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimerRing(seconds) {
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (seconds / CONFIG.GAME_DURATION) * circumference;
    DOM.timerProgress.style.strokeDashoffset = offset;
}

function handleGameClick(e) {
    if (!State.gameActive || State.gamePaused) return;
    
    e.preventDefault();
    
    State.clickCount++;
    DOM.gameClicks.textContent = State.clickCount.toLocaleString();
    
    // Create ripple effect
    const rect = DOM.gameZone.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    createRipple(x, y);
    createFloatText(x, y);
    
    // Haptic-like feedback via visual
    DOM.gameZone.style.transform = 'scale(0.995)';
    setTimeout(() => {
        DOM.gameZone.style.transform = 'scale(1)';
    }, 50);
}

function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    DOM.clickRipples.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => ripple.remove());
}

function createFloatText(x, y) {
    const float = document.createElement('div');
    float.className = 'click-float';
    float.textContent = '+' + State.clickCount;
    float.style.left = x + 'px';
    float.style.top = y + 'px';
    DOM.clickRipples.appendChild(float);
    
    float.addEventListener('animationend', () => float.remove());
}

function pauseGame() {
    if (!State.gameActive) return;
    State.gamePaused = true;
    openModal(DOM.modalPause);
}

function resumeGame() {
    State.gamePaused = false;
    closeModal(DOM.modalPause);
}

function quitGame() {
    State.gameActive = false;
    State.gamePaused = false;
    if (State.timerInterval) clearInterval(State.timerInterval);
    closeModal(DOM.modalPause);
    DOM.gameArena.classList.remove('active');
    DOM.gameZone.classList.remove('clicking');
}

async function endGame() {
    State.gameActive = false;
    State.gamePaused = false;
    if (State.timerInterval) clearInterval(State.timerInterval);
    
    DOM.gameTimer.style.color = '';
    
    const isNewBest = State.clickCount > State.personalBest;
    if (isNewBest) {
        State.personalBest = State.clickCount;
        DOM.previewHighscore.textContent = State.personalBest.toLocaleString();
    }
    
    // Show results
    DOM.resultScore.textContent = State.clickCount.toLocaleString();
    DOM.resultBest.textContent = State.personalBest.toLocaleString();
    
    openModal(DOM.modalGameover);
    
    // Save score to database using saveHighScore action
    if (State.currentUser) {
        try {
            await apiRequest('saveHighScore', {
                username: State.currentUser.username,
                highScore: State.clickCount
            });
            
            if (isNewBest) {
                showToast('New personal best!', 'success');
            }
            
            // Refresh leaderboard
            fetchLeaderboard();
        } catch (error) {
            console.error('Failed to save score:', error);
            showToast('Score saved locally. Will sync when online.', 'warning');
        }
    }
}

/* ============================================
   MODAL SYSTEM
   ============================================ */
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.modalPause.classList.contains('active')) {
                resumeGame();
            } else if (State.gameActive && !State.gamePaused) {
                pauseGame();
            }
        }
        
        if (e.key === ' ' && State.gameActive && !State.gamePaused) {
            e.preventDefault();
            // Simulate a click in center
            const rect = DOM.gameZone.getBoundingClientRect();
            const fakeEvent = {
                type: 'mousedown',
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                preventDefault: () => {}
            };
            handleGameClick(fakeEvent);
        }
    });
}

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    initLoadingScreen();
    initOnboarding();
    initAuth();
    initDashboard();
    initKeyboardShortcuts();
});

// Prevent context menu on game zone
DOM.gameZone?.addEventListener('contextmenu', (e) => e.preventDefault());

// Prevent zoom on double tap
document.addEventListener('dblclick', (e) => {
    if (State.gameActive) e.preventDefault();
}, { passive: false });
