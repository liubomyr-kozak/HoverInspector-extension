import * as $ from "./lib/jquery"
import TransOver from "./lib/transover_utils";

var local = (function () {
    var getData = function (key) {
        if (localStorage.getItem(key) != null) {
            return JSON.parse(localStorage.getItem(key));
        } else {
            return false;
        }
    };

    var updateDate = function (key, newData) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({}));
        }

        var oldData = JSON.parse(localStorage.getItem(key));

        if (!oldData[newData.word]) {
            oldData[newData.word] = newData;
        }

        var values = JSON.stringify(oldData);
        localStorage.setItem(key, values);

    };

    var removeAll = function (key) {
        localStorage.setItem(key, "{}");
        return JSON.parse(localStorage.getItem(key));
    };

    var deleteItem = function (key, data) {
        if (localStorage.getItem(key) != null) {
            var dataStorage = JSON.parse(localStorage.getItem(key));

            if (dataStorage[data]) {

                var responce = {};

                responce.deleteValue = data;

                delete dataStorage[data];

                localStorage.setItem(key, JSON.stringify(dataStorage));

                responce.dataStorage = dataStorage;
                responce.status = 1; //                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          sucse
                return responce;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    // ключ захардкодити карірованням
    return {
        get: getData,
        update: updateDate,
        removeAll: removeAll,
        deleteItem: deleteItem
    }
})();

var localStorageGlobal = (function () {
    var getData = function (key) {
        if (localStorage.getItem(key) != null) {
            return JSON.parse(localStorage.getItem(key));
        } else {
            return false;
        }
    };

    var updateDate = function (key, newData) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({}));
        }


        var values = JSON.stringify(newData);
        localStorage.setItem(key, values);

    };

    // ключ захардкодити карірованням
    return {
        get: getData,
        update: updateDate,
    }
})();

function _http(params) {
    /**
     * params{
     * type:: GET, POST
     * url:: url
     * data: for POST
     */

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open(params.type, params.url, true);

        xhr.onload = function () {
            if (this.status == 200) {
                var Data = JSON.parse(this.response);
                if (Data.code != 0) {
                    resolve(Data);
                } else {
                    reject(Data);
                }
            } else {
                var error = new Error(this.statusText);
                error.code = this.status;
                reject(error);
            }
        };

        xhr.onerror = function () {
            reject(new Error('Network Error'));
        };

        if (params.type == "POST" || params.type == "PUT") {
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            xhr.send(JSON.stringify(params.data));

        } else if (params.type == 'GET') {
            xhr.send()
        }
    });
}


chrome.runtime.onMessage && chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    actionsContext(request, sender, sendResponse);
    return true;
});

chrome.runtime.onMessageExternal && chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    actionsContext(request, sender, sendResponse);
    return true;
});


function actionsContext(request, sender, sendResponse) {
    if (request.action == "translateSingle") {
        var sl = request.translationsSetting.from,
            tl = request.translationsSetting.to;
        translate(request.word, sl, tl, sendResponse, on_translation_response);
        return true;
    }

    if (request.action == "storage.action.getAllWords") {
        sendResponse(local.get('TranslationExt'));
        return true;
    }
    if (request.action == 'storage.action.removeAllWords') {
        sendResponse(local.removeAll('TranslationExt', request.data));
        return true;
    }
    if (request.action == 'storage.action.deleteWord') {
        sendResponse(local.deleteItem('TranslationExt', request.data));
        return true;
    }
    if (request.action == 'storage.action.addWord') {
        sendResponse(local.update('TranslationExt', request.data));
        return true;
    }

    if (request.action == 'tts') {

        speechSynthesis.cancel();
        var t;
        var speachInstance = new SpeechSynthesisUtterance();
        speachInstance.lang = 'en';
        speachInstance.text = request.data;
        speachInstance.rate = 0.7;

        speachInstance.onstart = function (event) {
            t = event.timeStamp;
        };
        speachInstance.onend = function (event) {
            t = event.timeStamp - t;
            sendResponse({
                status: 'end',
                data: request.data,
                timeSpeach: t / 1000
            });
        };

        speechSynthesis.speak(speachInstance);
        return true;
    }


    if (request.action == "app.action.getSettings") {
        sendResponse(localStorageGlobal.get('appSettings'));
        return true;
    }

    if (request.action == "app.action.setSettings") {
        sendResponse(localStorageGlobal.update('appSettings', request.data));
        return true;
    }
}


export function on_translation_response(data, word, tl, sendResponse) {
    var output, translation = {tl: tl};

    console.log('raw_translation: ', data);

    if (!data.dict && !data.sentences ||
        (data.sentences && data.sentences[0].trans.match(new RegExp(TransOver.regexp_escape(word), 'i')))) {

        translation.succeeded = false;

        if (data.src == tl) {
            output = '';
        } else {
            output = 'Oops.. No translation found.';
        }

        translation.succeeded = false;
    } else {
        translation.succeeded = true;
        translation.word = word;

        output = [];
        if (data.dict) { // full translation
            data.dict.forEach(function (t) {
                output.push({pos: t.pos, meanings: t.terms});
            });
        } else { // single word or sentence(s)
            data.sentences.forEach(function (s) {
                output.push(s.trans)
            });
            output = output.join(" ")
        }

        translation.sl = data.src;
    }

    if (!output instanceof String) {
        output = JSON.stringify(output);
    }

    translation.fistTransation = data.sentences[0];
    translation.translation = output;

    $.extend(translation);

    sendResponse(translation);
}

export function translate(word, sl, tl, sendResponse, onresponse) {
    var options = {
        url: "https://translate.googleapis.com/translate_a/single?dt=t&dt=bd",
        data: {
            client: 'gtx',
            q: word,
            sl: sl || "auto",
            tl: tl || "uk",
            dj: 1,
            source: 'bubble'
        },
        dataType: 'json',
        success: function on_success(data) {
            onresponse(data, word, tl, sendResponse);
        },
        error: function (xhr, status, e) {
            console.log({e: e, xhr: xhr});
        }
    };

    $.ajax(options);
}