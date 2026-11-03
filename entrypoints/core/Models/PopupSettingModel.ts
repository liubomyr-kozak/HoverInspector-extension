class PopupSettingModel {
    preventDefault = false;
    // Tied to the Element Inspector popup: while the popup is open, the element is tracked
    isHandleDomInspector = false;
    isSingleSelect = false;
    showAllBorders = false;

    setPreventDefault = (value: boolean) => {
        this.preventDefault = value;
    }

    setHandleDomInspector = (value: boolean) => {
        this.isHandleDomInspector = value;
    }

    setIsSingleSelect = (value: boolean) => {
        this.isSingleSelect = value;
    }
    
    setShowAllBorders = (value: boolean) => {
        this.showAllBorders = value;
    }
}

export default new PopupSettingModel();