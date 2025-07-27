// Configuration for CharmyAI Mini-App Settings
const Config = {
    // API Configuration
    api: {
        // Base URL for your server (замените на ваш домен)
        baseUrl: 'https://site2-ruddy-delta.vercel.app/bot_settings.html',
        
        // API Endpoints
        endpoints: {
            // Загрузка настроек пользователя
            loadSettings: '/settings/load',
            // Сохранение настроек пользователя  
            saveSettings: '/settings/save',
            // Проверка состояния сервера
            health: '/health'
        },
        
        // Request timeout (ms)
        timeout: 10000,
        
        // Request headers
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },

    // Telegram Web App Configuration
    telegram: {
        // Проверка доступности Telegram Web App
        isAvailable: () => {
            return typeof window !== 'undefined' && 
                   window.Telegram && 
                   window.Telegram.WebApp;
        },
        
        // Получение данных пользователя из Telegram
        getUserData: () => {
            if (!Config.telegram.isAvailable()) {
                return null;
            }
            
            const webApp = window.Telegram.WebApp;
            const initData = webApp.initData;
            const user = webApp.initDataUnsafe?.user;
            
            return {
                user_id: user?.id || null,
                username: user?.username || null,
                first_name: user?.first_name || null,
                last_name: user?.last_name || null,
                language_code: user?.language_code || 'ru',
                init_data: initData, // Для валидации на сервере
                is_premium: user?.is_premium || false
            };
        },
        
        // Инициализация Web App
        init: () => {
            if (Config.telegram.isAvailable()) {
                const webApp = window.Telegram.WebApp;
                webApp.ready();
                webApp.expand();
                
                // Настройка темы
                if (webApp.colorScheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
                
                return true;
            }
            return false;
        },
        
        // Закрытие Web App
        close: () => {
            if (Config.telegram.isAvailable()) {
                window.Telegram.WebApp.close();
            }
        },
        
        // Показать уведомление
        showAlert: (message) => {
            if (Config.telegram.isAvailable()) {
                window.Telegram.WebApp.showAlert(message);
            } else {
                alert(message);
            }
        },
        
        // Подтверждение действия
        showConfirm: (message, callback) => {
            if (Config.telegram.isAvailable()) {
                window.Telegram.WebApp.showConfirm(message, callback);
            } else {
                const result = confirm(message);
                callback(result);
            }
        }
    },

    // Settings Management
    settings: {
        // Defaults settings values
        defaults: {
            characterName: '',
            messageLength: 'medium',
            secondaryCharacters: 'default', 
            involvement: 'suggests',
            plotPredictability: 'balanced',
            plotIntensity: 'default',
            setting: '',
            userRole: '',
            romance: 'maximum' // Автовыбор максимального уровня романтики
        },
        
        // Валидация настроек
        validate: (settings) => {
            const errors = [];
            
            // Проверка имени персонажа
            if (settings.characterName && settings.characterName.length > 30) {
                errors.push('Имя персонажа не может быть длиннее 30 символов');
            }
            
            // Проверка описания сеттинга
            if (settings.setting && settings.setting.length > 150) {
                errors.push('Описание сеттинга не может быть длиннее 150 символов');
            }
            
            // Проверка роли пользователя
            if (settings.userRole && settings.userRole.length > 100) {
                errors.push('Роль пользователя не может быть длиннее 100 символов');
            }
            
            return errors;
        }
    },

    // Network utilities
    network: {
        // Make API request
        makeRequest: async (endpoint, options = {}) => {
            const url = Config.api.baseUrl + endpoint;
            const defaultOptions = {
                method: 'GET',
                headers: Config.api.headers,
                timeout: Config.api.timeout
            };
            
            const requestOptions = { ...defaultOptions, ...options };
            
            try {
                // Add timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
                
                const response = await fetch(url, {
                    ...requestOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return { success: true, data };
                
            } catch (error) {
                console.error('API Request failed:', error);
                return { 
                    success: false, 
                    error: error.message || 'Ошибка сети' 
                };
            }
        },
        
        // Load user settings
        loadUserSettings: async (userData) => {
            if (!userData || !userData.user_id) {
                return { success: false, error: 'Нет данных пользователя' };
            }
            
            return await Config.network.makeRequest(Config.api.endpoints.loadSettings, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userData.user_id,
                    init_data: userData.init_data
                })
            });
        },
        
        // Save user settings
        saveUserSettings: async (userData, settings) => {
            if (!userData || !userData.user_id) {
                return { success: false, error: 'Нет данных пользователя' };
            }
            
            // Валидация настроек
            const validationErrors = Config.settings.validate(settings);
            if (validationErrors.length > 0) {
                return { 
                    success: false, 
                    error: validationErrors.join('; ') 
                };
            }
            
            return await Config.network.makeRequest(Config.api.endpoints.saveSettings, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userData.user_id,
                    init_data: userData.init_data,
                    settings: settings
                })
            });
        },
        
        // Check server health
        checkHealth: async () => {
            return await Config.network.makeRequest(Config.api.endpoints.health);
        }
    },

    // Utility functions
    utils: {
        // Debounce function for input handlers
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Show loading state
        showLoading: (element, text = 'Загрузка...') => {
            if (element) {
                element.disabled = true;
                element.dataset.originalText = element.textContent;
                element.textContent = text;
                element.style.opacity = '0.7';
            }
        },
        
        // Hide loading state
        hideLoading: (element) => {
            if (element && element.dataset.originalText) {
                element.disabled = false;
                element.textContent = element.dataset.originalText;
                element.style.opacity = '1';
                delete element.dataset.originalText;
            }
        },
        
        // Log function with timestamp
        log: (message, level = 'info') => {
            const timestamp = new Date().toISOString();
            console[level](`[${timestamp}] CharmyAI Mini-App:`, message);
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
} else if (typeof window !== 'undefined') {
    window.CharmyConfig = Config;
} 