import * as React from "react";
import "react-dom";
import { render } from "react-dom";
import Editor from "./Editor";

class App extends React.Component {
  render() {
    return (
      <div>
        <div id="header">msgpack visualizer</div>
        <Editor />
        <div id="doc" />
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));
