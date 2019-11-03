/**
 * Created by Kten on 2015-06-04.
 */

var util = livedit.moduleDefine("livedit.util"),
    client = livedit.moduleDefine("livedit.client"),
    tool = livedit.moduleDefine("livedit.tool");

//document.getElementById("livedit-partition-button").onclick = onCallSavedPage;
//document.getElementById("livedit-save-button").onclick = onSaveCurrentPage;
//document.getElementById("livedit-inspectDOM-button").onclick = onStartLiveEditHandler;

chrome.runtime.onInstalled.addListener(function() {
    var contexts = ["all"],
        title = "Inspect in Livedit";
    chrome.contextMenus.create({
        title: title,
        contexts: contexts,
        id: "StartLivedit"
    });

    chrome.contextMenus.onClicked.addListener(onStartLiveEditHandler);
});

function onStartLiveEditHandler(){
    client.conn.init();

    //inspect Div Test Code
    //tool.onInspectDOM("div");

    //insert HTML Element - case : reload
    //tool.onInsertHTMLElementRe();

    //insert HTML Element Div Test Code
    //tool.onInsertHTMLElement({selector : "html", outerHTML : html});

    //Remove Div Test Code
    //tool.onRemoveElement("div");

    //Remove Div Attribute Test Code
    //tool.onRemoveAttribute({selector : "div", name : "id"});

    //Modify Div Test Code

    //Modify Element Attribute
    //tool.onModifyElement({selector : "div", name : "id", value : "sojung"});

    //Inject Javascript Test Code
    //tool.onInjectExternalJavascript({scriptUrl : "js/temp.js", scriptSource : "document.getElementById('test').onclick = function(){ alert('aaaaa'); }"});
}

function onSaveCurrentPage(){
    alert("This button is saved Current Page");
}

function onCallSavedPage(){
    chrome.tabs.query({active : true}, function(tab) {
        var tab = tab[0];
        // Send a request to the content script.
        chrome.tabs.sendMessage(tab.id, {action: "getDOM", tab:{tabId : tab.id, tabUrl : tab.url}}, function(response)
        {
            util.log(response.msg);
        });
    });
};