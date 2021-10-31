class PopupSettingModel {
  preventDefault = false;

  setPreventDefault = (value) => {
    this.preventDefault = value;
  }
}

export default new PopupSettingModel();