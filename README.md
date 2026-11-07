# TextHelper

**Поиск, перевод, исправление и копирование текста — прямо на веб-страницах.**

![Version](https://img.shields.io/badge/version-10.0.14-blue)
![Chrome](https://img.shields.io/badge/Chrome-109%2B-green)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

**Русский** | [English](#english)

TextHelper — расширение для Google Chrome, которое добавляет настраиваемую панель инструментов при выделении текста. Переводите, исправляйте и копируйте текст прямо на странице.

## ✨ Возможности

- 🔎 **Поиск** — поиск выделенного текста.
- 🌍 **Перевод** — перевод текста с помощью переводчиков или ИИ.
- ✍️ **Исправление** — проверка и исправление текста.
- 📋 **Копирование** — быстрое копирование выделенного текста.
- 🎨 **Настройка панели** — порядок кнопок, расположение, компактный режим, подписи и анимации.
- 🤖 **ИИ-интеграции** — выбор провайдера и модели для обработки текста.
- 🖥️ **Локальные модели** — поддержка Ollama.
- 🌐 **Многоязычный интерфейс** — интерфейс на 7 языках.

## 🔌 Сервисы и интеграции

### Перевод

| Сервис | Назначение |
|---|---|
| Google Translate | Машинный перевод |
| MyMemory | Машинный перевод |

### Проверка текста

| Сервис | Назначение |
|---|---|
| LanguageTool | Проверка орфографии и грамматики |

### ИИ-провайдеры

ИИ-модели используются для обработки текста, включая перевод и исправление.

| Провайдер | Подключение |
|---|---|
| OpenAI | API |
| Anthropic Claude | API |
| DeepSeek | API |
| Google Gemini | API |
| OpenRouter | API |
| Ollama | Локальный сервер или настроенное подключение |

Для облачных ИИ-провайдеров необходим API-ключ. Стоимость использования зависит от выбранного сервиса. Для локального Ollama ключ обычно не требуется.

## 📥 Установка в Chrome

**[Скачать TextHelper v10.0.14](https://github.com/codex1616-dotcom/TextHelper/releases/download/v10.0.14/texthelper-10.0.14-chrome.zip)**

1. Скачайте ZIP-архив и распакуйте его.
2. Откройте `chrome://extensions`.
3. Включите **Режим разработчика**.
4. Нажмите **Загрузить распакованное расширение**.
5. Выберите папку с файлом `manifest.json`.
6. Настройте панель и необходимые сервисы.

Не удаляйте папку расширения после установки.

## 🔐 Конфиденциальность

Настройки и API-ключи хранятся локально.

Когда вы запускаете поиск, перевод или проверку текста, выделенный текст передаётся выбранному сервису для обработки.

При использовании OpenRouter запросы могут дополнительно обрабатываться провайдером выбранной модели. При подключении к локальному Ollama обработка может выполняться непосредственно на вашем устройстве.

Подробнее: [Политика конфиденциальности](privacy.html).

## 🌐 Firefox

**[TextHelper в Mozilla Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/texthelper-%D0%BF%D0%BE%D0%B8%D1%81%D0%BA-%D0%B8-%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/)**

Версии для Chrome и Firefox могут отличаться по функциональности и номеру версии.

---

## English

**Search, translate, correct, and copy text directly on web pages.**

TextHelper is a Google Chrome extension that adds a customizable toolbar when you select text. Translate, correct, and copy text directly on the page.

## ✨ Features

- 🔎 **Search** — search for selected text.
- 🌍 **Translation** — translate text using translation services or AI.
- ✍️ **Correction** — check and correct text.
- 📋 **Copy** — quickly copy selected text.
- 🎨 **Toolbar customization** — button order, placement, compact mode, labels, and animations.
- 🤖 **AI integrations** — choose a provider and model for text processing.
- 🖥️ **Local models** — Ollama support.
- 🌐 **Multilingual interface** — available in 7 languages.

## 🔌 Services and Integrations

### Translation

| Service | Purpose |
|---|---|
| Google Translate | Machine translation |
| MyMemory | Machine translation |

### Text Checking

| Service | Purpose |
|---|---|
| LanguageTool | Spelling and grammar checking |

### AI Providers

AI models are used for text processing, including translation and correction.

| Provider | Connection |
|---|---|
| OpenAI | API |
| Anthropic Claude | API |
| DeepSeek | API |
| Google Gemini | API |
| OpenRouter | API |
| Ollama | Local server or configured connection |

Cloud AI providers require an API key. Usage costs depend on the selected service. Local Ollama usually does not require an API key.

## 📥 Chrome Installation

**[Download TextHelper v10.0.14](https://github.com/codex1616-dotcom/TextHelper/releases/download/v10.0.14/texthelper-10.0.14-chrome.zip)**

1. Download and extract the ZIP archive.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Configure the toolbar and required services.

Do not delete the extension folder after installation.

## 🔐 Privacy

Settings and API keys are stored locally.

When you initiate a search, translation, or text correction, the selected text is sent to the chosen service for processing.

When using OpenRouter, requests may also be processed by the selected model provider. With a local Ollama connection, processing can take place directly on your device.

Read more: [Privacy Policy](privacy.html).

## 🌐 Firefox

**[TextHelper on Mozilla Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/texthelper-%D0%BF%D0%BE%D0%B8%D1%81%D0%BA-%D0%B8-%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/)**

Chrome and Firefox versions may differ in features and version numbers.

---

**TextHelper © RETRO**

[Releases](https://github.com/codex1616-dotcom/TextHelper/releases) · [Source Code](https://github.com/codex1616-dotcom/TextHelper) · [Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/texthelper-%D0%BF%D0%BE%D0%B8%D1%81%D0%BA-%D0%B8-%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/)
