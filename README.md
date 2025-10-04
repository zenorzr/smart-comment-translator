# Smart Comment Translator

Automatically translate code comments into your preferred language with one click.

## Features

- **Right-click translation**: Select any comment and translate it via context menu
- **Multiple languages**: Support for 12+ languages (English, Spanish, French, German, etc.)
- **Flexible output**: Replace original comment or add translation below
- **Multiple comment types**: Works with //, /* */, #, and -- style comments
- **Free APIs**: Uses MyMemory and LibreTranslate   (no API keys required)

## Usage

1. Select a comment in your code
2. Right-click and choose "Translate Comment"
3. The comment will be translated to your configured target language

## Configuration

Open VS Code settings and search for "Comment Translator":

- `commentTranslator.targetLanguage`: Target language (default: "en")
- `commentTranslator.apiProvider`: Translation service ("libretranslate" or "mymemory")
- `commentTranslator.replaceOriginal`: Replace original comment or add translation below

## Supported Languages

English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Russian (ru), Japanese (ja), Korean (ko), Chinese (zh), Hindi (hi), Arabic (ar)

## Examples

**Before:**
```javascript
// Este es un comentario en español
function hello() {
    return "world";
}
```

**After (replace mode):**
```javascript
// This is a comment in Spanish
function hello() {
    return "world";
}
```

**After (add translation mode):**
```javascript
// Este es un comentario en español
// TRANSLATED (from es): This is a comment in Spanish
function hello() {
    return "world";
}
```

## Requirements

- VS Code 1.74.0 or higher
- Internet connection for translation APIs

## Release Notes

### 1.0.0
- Initial release
- Support for multiple comment types
- Configurable translation settings
- Free translation APIs integration