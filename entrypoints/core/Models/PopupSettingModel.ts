class PopupSettingModel {
    preventDefault = false;
    // це значення привязане до попапу інспектора елементів, якщо попап відкритий то тоді я відслідковую елемент
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