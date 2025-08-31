/**
 * Утиліти для парсингу CSS
 * 
 * Декларативні функції для обробки та парсингу CSS тексту.
 * Використовуються для витягування CSS властивостей з згенерованого коду.
 */

/**
 * Парсить CSS текст та витягує властивості
 * 
 * Декларативна функція для розбору CSS тексту на окремі властивості.
 * Обробляє стандартний формат CSS з правилами "властивість: значення;"
 * 
 * @param cssText - CSS текст для парсингу
 * @returns Об'єкт з CSS властивостями як ключі та значення
 * 
 * @example
 * parseCSS('color: red; font-size: 14px;')
 * // => { color: 'red', 'font-size': '14px' }
 */
export const parseCSS = (cssText: string): Record<string, string> => {
    const properties: Record<string, string> = {};
    
    if (!cssText) {
        return properties;
    }

    // Витягуємо CSS властивості з згенерованого CSS тексту
    const cssLines = cssText.split("\n");
    
    for (const line of cssLines) {
        const trimmed = line.trim();
        
        // Перевіряємо чи є це валідна CSS властивість
        if (trimmed && trimmed.includes(":") && trimmed.endsWith(";")) {
            const colonIndex = trimmed.indexOf(":");
            const property = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1, trimmed.length - 1).trim();
            
            if (property && value) {
                properties[property] = value;
            }
        }
    }
    
    return properties;
};

/**
 * Об'єднує інлайн стилі з властивостями класів
 * 
 * Декларативна функція для злиття CSS властивостей з різних джерел.
 * Пріоритет надається інлайн стилям над властивостями класів.
 * 
 * @param inlineStyles - Об'єкт з інлайн стилями
 * @param classProperties - Об'єкт з властивостями класів
 * @returns Об'єднаний об'єкт властивостей
 */
export const mergeStyleProperties = (
    inlineStyles: Record<string, string> | undefined,
    classProperties: Record<string, string>
): Record<string, string> => {
    return { ...classProperties, ...(inlineStyles || {}) };
};