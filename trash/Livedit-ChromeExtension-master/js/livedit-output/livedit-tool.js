/**
 * Created by Kten on 2015-07-10.
 */
var tool = livedit.moduleDefine("livedit.tool"),
    javascriptObjectList = [],
    tabId;;

tool.init = function(){
    chrome.debugger.onEvent.addListener(function(source, method, param){
        //console.log(source);
        //console.log(method);
        //console.log(param);
        if(method == "Debugger.scriptParsed" && param.url.startsWith("http://")){
            util.log("SCRIPT PARSED(ID) : " + param.scriptId);
            util.log("SCRIPT PARSED(URL) : " + param.url );
            util.log("SCRIPT PARSED(URL SIZE) : " + javascriptObjectList.length );

            if(javascriptObjectList.length == 0)
                javascriptObjectList.push({id : param.scriptId, url : util.substringFileName(param.url), realUrl : param.url});
            else{
                var i = 0;
                for(; i < javascriptObjectList.length ; i ++){
                    if(javascriptObjectList[i].url == util.substringFileName(param.url))
                        break;
                }

                if(i == javascriptObjectList.length){
                    javascriptObjectList.push({id : param.scriptId, url : util.substringFileName(param.url), realUrl : param.url});
                }
            }
        }
    });

    // On Detach Callback Function
    chrome.debugger.onDetach.addListener(function(source, reason){
        util.log("DETACH : TAB[" + source.tabId + "] REASON[" + reason + "]");
    });

    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {
        tabId = tab[0].id;
    });
}

tool.init();

tool.onInspectDOM = function(nodeSelector){

    tool.highlight = {
        config: function () {
            Object.defineProperty(this, 'contentColor', {value: {r: 255, g: 237, b: 130, a: 0.66}, enumerable: true});
            Object.defineProperty(this, 'paddingColor', {value: {r: 153, g: 140, b: 61, a: 0.55}, enumerable: true});
            Object.defineProperty(this, 'borderColor', {value: {r: 199, g: 78, b: 255, a: 0.66}, enumerable: true});
            Object.defineProperty(this, 'marginColor', {value: {r: 61, g: 153, b: 83, a: 0.66}, enumerable: true});
            Object.defineProperty(this, 'showInfo', {value: true, enumerable: true});
        }
    };

    tool.highlight.config();
    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {

        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, debuggee));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "DOM.hideHighlight");

        chrome.debugger.sendCommand(debuggee, "DOM.getDocument", function (response) {
            util.log("GET DOM : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.getDocument]");

            var responsedDOM = response;
            var body = util.getBodyDOM(responsedDOM);

            chrome.debugger.sendCommand(debuggee, "DOM.querySelector", {
                "nodeId": body.nodeId,
                "selector": nodeSelector
            }, function (response) {
                util.log("GET SELECTED ELEMENT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.querySelector, {'nodeId' : " + body.nodeId + ", 'selector' : " + nodeSelector + "}]");
                var nodeId = response.nodeId;

                if (nodeSelector == "html > body")
                    nodeId = body.nodeId;

                // Send Command Highlight Node
                chrome.debugger.sendCommand(debuggee, "DOM.highlightNode", {
                    "nodeId": nodeId,
                    "highlightConfig": tool.highlight
                }, function (response) {
                    util.log("HIGHLIGHT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.highlightNode, {'nodeId' : " + nodeId + ", 'highlightConfig'' : tool.highlight}]");
                });
            });
        });
    });
};

tool.onRemoveAttribute = function(param){
    var attributeName = param.name,
        nodeSelector = param.selector;
    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {

        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "DOM.hideHighlight");

        chrome.debugger.sendCommand(debuggee, "DOM.getDocument", function (response) {
            util.log("GET DOM : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.getDocument]");

            var responsedDOM = response;
            var body = util.getBodyDOM(responsedDOM);

            chrome.debugger.sendCommand(debuggee, "DOM.querySelector", {
                "nodeId": body.nodeId,
                "selector": nodeSelector
            }, function (response) {
                util.log("GET SELECTED ELEMENT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.querySelector, {'nodeId' : " + body.nodeId + ", 'selector' : " + nodeSelector + "}]");
                var nodeId = response.nodeId;

                // Send Command : Remove Attr
                chrome.debugger.sendCommand(debuggee, "DOM.removeAttribute", {
                    "nodeId": nodeId,
                    "name": attributeName
                }, function (response) {
                    util.log("REMOVE : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.removeAttribute, {'nodeId' : " + response.id + ", 'name' : " + attributeName + "}]");
                });
            });
        });
    });
};

tool.onRemoveElement = function(nodeSelector){
    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {


        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "DOM.hideHighlight");

        chrome.debugger.sendCommand(debuggee, "DOM.getDocument", function (response) {
            util.log("GET DOM : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.getDocument]");

            var responsedDOM = response;
            var body = util.getBodyDOM(responsedDOM);

            chrome.debugger.sendCommand(debuggee, "DOM.querySelector", {
                "nodeId": body.nodeId,
                "selector": nodeSelector
            }, function (response) {
                util.log("GET SELECTED ELEMENT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.querySelector, {'nodeId' : " + body.nodeId + ", 'selector' : " + nodeSelector + "}]");
                var nodeId = response.nodeId;

                // Send Command : Remove Element
                chrome.debugger.sendCommand(debuggee, "DOM.removeNode", {"nodeId": nodeId}, function (response) {
                    util.log("REMOVE : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.removeNode, {'nodeId' : " + response.id + "}]");
                });
            });
        });
    });
};

tool.onInsertHTMLElementRe = function(){
    var debuggee = {tabId: tabId};

    chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
    util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

    chrome.debugger.sendCommand(debuggee, "Page.reload", {"ignoredCache" : true}, function (response) {
        util.log("RELOAD : Func[chrome.debugger.attach],  Parameter[debuggee, 'Page.reload'])");
    });
}

tool.onInsertHTMLElement = function(param){
    var nodeSelector = param.selector,
        outerHTML = param.outerHTML;
    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {

        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "DOM.hideHighlight");

        chrome.debugger.sendCommand(debuggee, "DOM.getDocument", function (response) {
            util.log("GET DOM : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.getDocument]");

            var responsedDOM = response;
            console.log(responsedDOM);
            var body = util.getBodyDOM(responsedDOM);

            chrome.debugger.sendCommand(debuggee, "DOM.querySelector", {
                "nodeId": body.nodeId,
                "selector": nodeSelector
            }, function (response) {
                util.log("GET SELECTED ELEMENT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.querySelector, {'nodeId' : " + body.nodeId + ", 'selector' : " + nodeSelector + "}]");
                var nodeId = response.nodeId;

                chrome.debugger.sendCommand(debuggee, "DOM.setOuterHTML", {
                    "nodeId": nodeId,
                    "outerHTML": outerHTML
                }, function (response) {
                    console.log(response);

                    //tool.onInjectExternalJavascript();
                });
            });
        });
    });
};

tool.onModifyElement = function(param){
    var nodeSelector = param.selector,
        name = param.name,
        value = param.value,
        type = param.type;

    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {

        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "DOM.hideHighlight");

        chrome.debugger.sendCommand(debuggee, "DOM.getDocument", function (response) {
            util.log("GET DOM : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.getDocument]");

            var responsedDOM = response;
            var body = util.getBodyDOM(responsedDOM);

            chrome.debugger.sendCommand(debuggee, "DOM.querySelector", {
                "nodeId": body.nodeId,
                "selector": nodeSelector
            }, function (response) {
                util.log("GET SELECTED ELEMENT : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.querySelector, {'nodeId' : " + body.nodeId + ", 'selector' : " + nodeSelector + "}]");
                var nodeId = response.nodeId;

                chrome.debugger.sendCommand(debuggee, "DOM.setAttributeValue", {
                    "nodeId": nodeId,
                    "name": name,
                    "value": value
                }, function (response) {
                    util.log("MODIFY ELEMENT ATTRIBUTE : Func[chrome.debugger.sendCommand],  Parameter[debuggee," + " DOM.setAttributeValue, {'nodeId' : " + nodeId + ", 'name' : " + name + ", 'value' : " + value + "}]");
                });
            });
        });
    });
};

tool.onInjectExternalJavascript = function(){
    /*
    var scriptUrl = param.scriptUrl,
        scriptSource = param.scriptSource,
        mainFlag = false,
        linkFlag = true,
        firstFlag = false;*/

    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {
        var tab = tab[0];

        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, "1.0", tool.onAttach.bind(null, tabId));
        util.log("ATTACH : Func[chrome.debugger.attach],  Parameter[debuggee," + " 1.0, tool.onAttach.bind(null, " + tabId + ")");

        chrome.debugger.sendCommand(debuggee, "Page.reload");

        /*
        chrome.debugger.sendCommand(debuggee, "Debugger.enable", function(msg){
            util.log("DEBUG ENABLED...");

            var thisScriptId, thisScriptUrl;

            if(scriptUrl == ""){
                scriptUrl = util.substringFileName(tab.url);
                mainFlag = true;
                linkFlag = true;
            }

            for(var i = 0 ; i < javascriptObjectList.length ; i ++ ){
                //console.log("ScriptId : " + javascriptObjectList[i].id);
                //console.log("ScriptUrl : " + javascriptObjectList[i].url);
                //console.log("Getted Script : " + scriptUrl);
                if(javascriptObjectList[i].url == util.substringFileName(scriptUrl)){
                    thisScriptId = javascriptObjectList[i].id;
                    thisScriptUrl = javascriptObjectList[i].realUrl;
                    linkFlag = false;
                    break;
                }

                if(i == javascriptObjectList.length - 1 && linkFlag){
                    firstFlag = true;
                    if(!mainFlag)
                        thisScriptUrl = util.rootName(tab.url) + "/" + scriptUrl;
                    else
                        thisScriptUrl = tab.url;
                }
            }

            if(linkFlag || firstFlag){
                chrome.debugger.sendCommand(debuggee, "Debugger.compileScript", {expression: scriptSource, sourceURL: thisScriptUrl, persistScript:true}, function(msg){
                    chrome.debugger.sendCommand(debuggee, "Debugger.runScript", {scriptId: msg.scriptId}, function(runMsg){
                        chrome.debugger.sendCommand(debuggee, "Debugger.setScriptSource", {
                            scriptId: msg.scriptId,
                            scriptSource: scriptSource,
                            preview: false
                        }, function (response) {
                            util.log("RS : " + msg.scriptId + " " + scriptSource);
                        });
                    });
                });
            } else {
                chrome.debugger.sendCommand(debuggee, "Debugger.setScriptSource", {
                    scriptId: thisScriptId,
                    scriptSource: scriptSource
                }, function (response) {
                    console.log(response);
                    chrome.debugger.sendCommand(debuggee, "Runtime.evaluate", {expression: scriptSource}, function (msg) {
                        util.log("EV : " + thisScriptId + " " + scriptSource + " ");
                        console.log(msg);
                        //tool.onInjectExternalJavascript({scriptUrl : "js/temp.js", scriptSource : "$(document).ready(function () { alert('!');    $('#test).click(function () {        alert('aaaaaaaaabbbbbbbbb')    });$('#ttest').click(function () {    alert('aaaaaaaaabbbbbbbbb');});});", linkFlag : false});
                    });
                });
            }
        });*/
    });
};

tool.onDetach = function(){
    chrome.tabs.query({lastFocusedWindow : true}, function(tab) {
        chrome.debugger.detach({tabId : tabId}, "Debugger");
    });
}

tool.onAttach = function(){
    if (chrome.runtime.lastError) {
        util.error(chrome.runtime.lastError.message);
        return;
    }
}