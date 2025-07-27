# CharmyAI Mini-App для настроек персонажа

Этот проект реализует Telegram Mini-App для настройки персонажа CharmyAI бота с серверной частью для сохранения настроек.

## 📁 Структура проекта

```
aiChat/
├── site/                           # Mini-App файлы
│   ├── bot_settings.html          # Основной HTML файл mini-app
│   ├── config.js                  # Конфигурация API и Telegram Web App
│   ├── fields_mapping.json        # Расшифровка полей для БД
│   └── README.md                  # Эта инструкция
├── settings_api_server.py         # Серверное API для работы с настройками
├── requirements_api.txt           # Зависимости для API сервера
└── settings.db                    # База данных настроек (создается автоматически)
```

## 🎯 Основные возможности

### Изменения в HTML:
- ✅ **Автовыбор романтики**: Установлен "Максимальный" по умолчанию
- ✅ **Убрана "Инициативность персонажа"**: Раздел полностью удален
- ✅ **Перенос "Как ведёт себя персонаж"**: Перемещено в секцию "Поведение персонажа"

### Функциональность:
- 🔄 **Автозагрузка настроек**: При открытии загружаются сохраненные настройки пользователя
- 💾 **Сохранение в БД**: Настройки сохраняются в `settings.db`
- 🔐 **Валидация Telegram**: Проверка подлинности данных пользователя
- 📱 **Полная интеграция с Telegram Web App**: Нативные уведомления и закрытие

## 🚀 Настройка и запуск

### 1. Настройка API сервера

#### Установка зависимостей:
```bash
pip install -r requirements_api.txt
```

#### Установка переменной окружения:
```bash
export BOT_TOKEN="ваш_токен_бота"
```

#### Запуск API сервера:
```bash
python settings_api_server.py
```

Сервер будет доступен на `http://0.0.0.0:8080`

### 2. Настройка Mini-App

#### Обновите `config.js`:
Замените URL в файле `site/config.js`:
```javascript
baseUrl: 'https://your-domain.com/api',  // ← Замените на ваш домен
```

#### Загрузите файлы на хостинг:
- `bot_settings.html`
- `config.js`
- `fields_mapping.json` (опционально, используется сервером)

### 3. Настройка бота

Добавьте команду для открытия Mini-App в вашем боте:

```python
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

async def settings_command(message):
    webapp = WebAppInfo(url="https://your-domain.com/bot_settings.html")
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚙️ Настройки персонажа", web_app=webapp)]
    ])
    await message.answer("Откройте настройки персонажа:", reply_markup=keyboard)
```

## 🗄️ База данных

### Структура таблицы `user_settings`:

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | INTEGER | ID пользователя Telegram (Primary Key) |
| `character_name` | TEXT | Имя персонажа |
| `message_length` | TEXT | Длина сообщений (short/medium/long) |
| `secondary_characters` | TEXT | Допуск второстепенных персонажей |
| `involvement` | TEXT | Поведение персонажа |
| `plot_predictability` | TEXT | Предсказуемость сюжета |
| `plot_intensity` | TEXT | Насыщенность событиями |
| `setting` | TEXT | Место действия, сеттинг |
| `user_role` | TEXT | Роль пользователя |
| `romance_level` | TEXT | Уровень романтики |
| `created_at` | TIMESTAMP | Дата создания |
| `updated_at` | TIMESTAMP | Дата обновления |

## 📡 API Endpoints

### `POST /api/settings/load`
Загрузка настроек пользователя

**Запрос:**
```json
{
  "user_id": 123456789,
  "init_data": "auth_data_from_telegram"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "settings": { ... },
    "has_existing_settings": true
  }
}
```

### `POST /api/settings/save`
Сохранение настроек пользователя

**Запрос:**
```json
{
  "user_id": 123456789,
  "init_data": "auth_data_from_telegram",
  "settings": {
    "characterName": "Алиса",
    "messageLength": "medium",
    "romance": "maximum",
    ...
  }
}
```

### `GET /api/health`
Проверка состояния сервера

## 🔧 Конфигурация полей

Файл `fields_mapping.json` содержит:
- Схему базы данных
- Маппинг между frontend и database полями
- Правила валидации
- Возможные значения для enum полей

## 🛡️ Безопасность

- ✅ **Валидация Telegram данных**: Проверка HMAC подписи
- ✅ **Валидация входных данных**: Проверка длины строк и допустимых значений
- ✅ **CORS**: Настроен для работы с Telegram Mini-App
- ✅ **SQL Injection**: Использование параметризованных запросов

## 📋 Использование настроек в боте

Для получения настроек пользователя в основном боте:

```python
import aiosqlite

async def get_user_settings(user_id: int) -> dict:
    async with aiosqlite.connect('settings.db') as db:
        cursor = await db.execute(
            "SELECT * FROM user_settings WHERE user_id = ?",
            (user_id,)
        )
        row = await cursor.fetchone()
        
        if row:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        
        return None
```

## 🚨 Логирование

API сервер ведет логи в:
- Консоль (для разработки)
- Файл `settings_api.log` (для продакшена)

## 🐛 Отладка

### Проверка работы API:
```bash
curl -X GET http://localhost:8080/api/health
```

### Просмотр логов:
```bash
tail -f settings_api.log
```

### Проверка БД:
```bash
sqlite3 settings.db "SELECT * FROM user_settings LIMIT 5;"
```

## 📝 Примечания

1. **Автосоздание БД**: База данных создается автоматически при первом запуске сервера
2. **Пустые поля**: Если поле не заполнено, в БД записывается пустая строка
3. **Обновления**: При повторном сохранении обновляются только измененные поля
4. **Романтика по умолчанию**: Автоматически установлена на "Максимальный"

## 🔄 Обновления

Для добавления новых полей:
1. Обновите `fields_mapping.json`
2. Добавьте поле в SQL схему в `settings_api_server.py`
3. Обновите HTML форму
4. Добавьте в `config.js` defaults

---

**Автор**: CharmyAI Team  
**Версия**: 1.0  
**Дата**: 2025-01-27 