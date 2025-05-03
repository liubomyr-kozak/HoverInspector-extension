let browserApi;

try {
    // Спроба імпортувати `webextension-polyfill`
    browserApi = require("webextension-polyfill");
} catch (error) {
    console.info("webextension-polyfill not found, using mock.");

    browserApi = {
        _listeners: [],
        tabs: {
            query: async () => {
                return [
                    {
                        id: 1,
                        url: "https://local-host/",
                    },
                ];
            },
            sendMessage: async (id, message) => {
                browserApi._listeners.forEach((listener) => {
                    listener(message);
                });
            },
        },
        sendMessage: async (tabId, message) => {
            browserApi._listeners.forEach((listener) => {
                listener(message);
            });
        },
        runtime: {
            onMessage: {
                addListener: function (listener) {
                    browserApi._listeners.push(listener);
                },
            },
            getManifest: () => {
                return {
                    content_scripts: [
                        {
                            exclude_matches: [],
                        },
                    ],
                };
            },
        },
    };
}

export default browserApi;