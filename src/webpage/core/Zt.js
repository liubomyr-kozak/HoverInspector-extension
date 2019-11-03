import helpers from './helpers';

const body = document.querySelector('body');

class Common {
    constructor() {
        this.components = [];
        this.stateChangeListener = [];
    }

    addToRender(component) {
        this.components.push(component)
    };

    initExtension() {
        const appNode = document.createElement('div');
        appNode.classList.add("zTool");

        body.appendChild(appNode);

        this.components.forEach(function getEl(el) {
            if (Array.isArray(el)) {
                el.forEach(getEl);
                return;
            }

            appNode.appendChild(el);
        })
    }

    init(something) {
        something();
    }

    stateChange(fn) {
        this.stateChangeListener.push(fn)
    }

    emitStateChange(object) {
        this.stateChangeListener.forEach(callBack => callBack(object))
    }
}

const Zt = new Common();
Zt.helpers = helpers;


export default Zt;