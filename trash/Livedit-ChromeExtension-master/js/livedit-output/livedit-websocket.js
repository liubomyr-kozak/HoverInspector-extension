/**
 * Created by Kten on 2015-06-25.
 */

var client = livedit.moduleDefine("livedit.client"),
    save = livedit.moduleDefine("livedit.save"),
    tool = livedit.moduleDefine("livedit.tool");
    util = livedit.moduleDefine("livedit.util");

new function() {
    var ws = null,
        connected = null;

    var host = "211.189.127.59",
        port = "63312",
        url = "ws://" + host + ":" + port;

    var open = function () {
        ws = new WebSocket(url);
        ws.onopen = onOpen;
        ws.onclose = onClose;
        ws.onmessage = onMessage;
        ws.onerror = onError;

        util.log("OPENING....");
    };

    var close = function () {
        if (ws) {
            util.log("CLOSING....");

            ws.close();
        }

        connected = false;
    };

    var onOpen = function(){
        util.log("OPENED : " + url);
        connected = true;
    };

    var onClose = function(){
        util.log("CLOSED : " + url);
    };

    var onMessage = function(msg){
        console.log(msg);
        debugger
        var replacedData = msg.data.replace(/'/g, '\\"');
        console.log(replacedData);

        var jsonStr = JSON.parse(replacedData);

        util.log("RCV MSG : " + replacedData);

        var nodeSelector = jsonStr.nodeSelector,
            command = jsonStr.command,

            code = jsonStr.code;

        if(command == "inspect")
            tool.onInspectDOM(nodeSelector);
        else if(command == "insert")
            tool.onInsertHTMLElement({selector : nodeSelector, outerHTML : code});
        else if(command == "injectJavascript")
            tool.onInjectExternalJavascript();
        else if(command == "close")
            tool.onDetach();

    };

    var onError = function(event){
        util.error(event.data);
    };

    WebSocketClient = {
        init : function(){
            close();
            open();
        }
    };
};

client.conn = WebSocketClient;

