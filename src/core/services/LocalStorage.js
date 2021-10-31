class LocalStorage {
  get = function (key) {
    if (localStorage.getItem(key) != null) {
      const data = JSON.parse(localStorage.getItem(key));
      return data
    } else {
      return false;
    }
  };

  removeAll = function (key) {
    localStorage.setItem(key, "{}");
    return JSON.parse(localStorage.getItem(key));
  };

  update = function (key, newData) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({}));
    }

    const values = JSON.stringify(newData);
    localStorage.setItem(key, values);
  };
}

export default new LocalStorage()