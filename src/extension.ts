import * as vscode from 'vscode';
import fetch from 'node-fetch';

interface TranslationResponse {
    translatedText: string;
    detectedLanguage?: string;
}

class CommentTranslator {
    private config = vscode.workspace.getConfiguration('commentTranslator');

    async translateText(text: string): Promise<TranslationResponse> {
        const targetLang = this.config.get<string>('targetLanguage', 'en');
        const provider = this.config.get<string>('apiProvider', 'libretranslate');

        try {
            if (provider === 'libretranslate') {
                return await this.translateWithLibreTranslate(text, targetLang);
            } else {
                return await this.translateWithMyMemory(text, targetLang);
            }
        } catch (error) {
            throw new Error(`Translation failed: ${error}`);
        }
    }

    private async translateWithLibreTranslate(text: string, targetLang: string): Promise<TranslationResponse> {
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            })
        });

        const data = await response.json() as any;
        return {
            translatedText: data.translatedText,
            detectedLanguage: data.detectedLanguage?.language
        };
    }
private async detectLanguage(text: string): Promise<string> {
    // Simple language detection using MyMemory's detect endpoint
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=`);
    const data = await response.json() as any;
    return data.responseData.detectedLang ?? 'en';
}
    private async translateWithMyMemory(text: string, targetLang: string): Promise<TranslationResponse> {
        const sourceLang = await this.detectLanguage(text);
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json() as any;
        
        return {
            translatedText: data.responseData.translatedText,
            detectedLanguage: data.responseData.match
        };
    }

    extractCommentText(text: string): string {
        // Remove comment markers and clean up
        return text
            .replace(/^\/\/\s*/, '')           // Single-line comments
            .replace(/^\/\*\s*/, '')          // Multi-line comment start
            .replace(/\s*\*\/\s*$/, '')       // Multi-line comment end
            .replace(/^\s*\*\s*/, '')         // Multi-line comment continuation
            .replace(/^#\s*/, '')             // Python/Shell comments
            .replace(/^--\s*/, '')            // SQL comments
            .trim();
    }

    formatTranslatedComment(original: string, translated: string, detectedLang?: string): string {
        const replaceOriginal = this.config.get<boolean>('replaceOriginal', false);
        
        if (replaceOriginal) {
            // Replace with translated version, keeping original comment style
            if (original.startsWith('//')) {
                return `// ${translated}`;
            } else if (original.startsWith('/*')) {
                return `/* ${translated} */`;
            } else if (original.startsWith('#')) {
                return `# ${translated}`;
            } else if (original.startsWith('--')) {
                return `-- ${translated}`;
            }
            return `// ${translated}`;
        } else {
            // Add translation below original
            const langNote = detectedLang ? ` (from ${detectedLang})` : '';
            if (original.startsWith('//')) {
                return `${original}\n// TRANSLATED${langNote}: ${translated}`;
            } else if (original.startsWith('#')) {
                return `${original}\n# TRANSLATED${langNote}: ${translated}`;
            } else if (original.startsWith('--')) {
                return `${original}\n-- TRANSLATED${langNote}: ${translated}`;
            }
            return `${original}\n// TRANSLATED${langNote}: ${translated}`;
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const translator = new CommentTranslator();

    const translateCommand = vscode.commands.registerCommand('commentTranslator.translateComment', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select a comment to translate');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // Check if selection looks like a comment
        const commentPattern = /^\s*(\/\/|\/\*|\*|#|--)/;
        if (!commentPattern.test(selectedText)) {
            vscode.window.showWarningMessage('Selected text does not appear to be a comment');
        }

        try {
            vscode.window.showInformationMessage('Translating comment...');
            
            const commentText = translator.extractCommentText(selectedText);
            const result = await translator.translateText(commentText);
            const formattedResult = translator.formatTranslatedComment(
                selectedText, 
                result.translatedText, 
                result.detectedLanguage
            );

            await editor.edit(editBuilder => {
                editBuilder.replace(selection, formattedResult);
            });

            vscode.window.showInformationMessage('Comment translated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Translation failed: ${error}`);
        }
    });

    context.subscriptions.push(translateCommand);
}

export function deactivate() {}