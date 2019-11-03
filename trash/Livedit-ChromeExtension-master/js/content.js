/**
 * Created by Kten on 2015-07-02.
 */

/* One Time Connection */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    var tab = request.tab;

    if (request.action && request.action == "getDOM") {
        /*var url = tab.tabUrl,
        saveUrl = "http://localhost:63342/LiveEdit/page/main.html";
        document.body.innerHTML = "<iframe style='width:50%; height:100vh; border:0px;' src='" + saveUrl + "'></iframe>" +
                                "<iframe style='width:50%; height:100vh; border:0px;' src='" + url +"'></iframe>";*/
        inspectDOM();
        sendResponse({"msg": "Save Success. "});
    } else if(request.action && request.action == "inspectDOM") {
        inspectDOM();
        sendResponse({"msg": "Inspect Success."});
    }else
        sendResponse({"msg" : "Command is Fail."});
});

function inspectDOM(){
    $("body *").click(function(){
    });
    console.log($("p#park").getPath());
}

jQuery.fn.extend({
    getPath: function () {
        //console.log(this);
        var path, node = this;
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();
            console.log(parent);

            var sameTagSiblings = parent.children(name);
            if (sameTagSiblings.length > 1) {
                allSiblings = parent.children();

                var index = allSiblings.index(realNode) + 1;
                if (index > 1) {
                    name += ':nth-child(' + index + ')';
                }
            }

            console.log("output : " + name);

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    }
});

