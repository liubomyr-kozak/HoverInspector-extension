import React, { Component } from "react";
import { connect } from "react-redux";

import ExtensionStorageManager from "../../core/services/ExtensionStorageManager";
import { initAppSetting } from "../../store/app.action";

class AppController extends Component {
  componentDidMount() {
    console.log("componentDidMount -> AppController")
    ExtensionStorageManager
      .initInitialData()
      .then(() => {
        this.props.initAppSetting();
      });
  }

  render() {
    return this.props.children;
  }
}

const mapDispatchToProps = {
  initAppSetting
}

export default connect(null, mapDispatchToProps)(AppController)