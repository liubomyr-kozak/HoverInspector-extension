import {on_translation_response, translate} from "../../background_popup_script";
import {isProduction} from '../providers/helpers'

export function getWordTranslationFromAPI(word, callback) {
    sendToBackground({
        action: 'translateSingle',
        word: word,
        translationsSetting: {
            to: 'uk',
            from: 'en'
        }
    }, callback)
}
export function getAllWordsFromStorage(callback) {
    sendToBackground({action: 'storage.action.getAllWords'}, callback)
}

function sendToBackground(data, callback) {
    if (isProduction()) {
        chrome.extension.sendMessage(data, callback)
    } else {
        const extensionId = "fihecjnfikfdegcoefcnfbjeblhakhda";
        chrome.runtime.sendMessage(extensionId, data, callback)
    }
}