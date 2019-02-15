import { useEffect } from "react";
import monaco from "./monaco";
import * as React from "react";

import visualize from "./visualizer";
import lz4 from "lz4js";
import msgpack from "msgpack-lite";
console.log(useEffect);

const fontSize = 16;
const theme = "vs-dark";

export default function Editor() {
  useEffect(() => {
    const e1 = monaco.editor.create(document.getElementById("l"), {
      fontSize,
      theme,
      language: "json"
    });

    const e2 = monaco.editor.create(document.getElementById("r"), {
      fontSize,
      theme,
      wordWrap: "on"
    });

    const fromBinaryString = function(str: string) {
      return string_to_buffer(atob(str.split(",")[1]));
    };

    function string_to_buffer(src) {
      return new Uint8Array(
        [].map.call(src, function(c) {
          return c.charCodeAt(0);
        })
      ).buffer;
    }

    function update(data: Uint8Array) {
      if (data[0] == 0xc9 && data[5] == 99) {
        //console.warn("is msgpack!");

        const length = Buffer.from(data.slice(7, 11)).readInt32BE(0);

        const d = data.slice(11);

        const data2 = Uint8Array.from({ length });

        lz4.decompressBlock(d, data2, 0, length, 0);

        e2.setValue(
          Array.from(data2)
            .map(v => v.toString(16).padStart(2, "0"))
            .join(" ")
        );

        const doc = document.querySelector("#doc");

        try {
          visualize(data2, (value: string) => {
            doc.innerHTML += value;
          });
        } catch (err) {
          console.error(err);
        }

        console.log(
          Array.from(data2)
            .map(v => v.toString(16).padStart(2, "0"))
            .join(" ")
        );

        const json = msgpack.decode(data2);

        console.log(json);

        e1.setValue(JSON.stringify(json, null, 2));
      }
    }

    function handleFileSelect(evt: Event) {
      const files = (evt.target as HTMLInputElement).files;
      const file = files[0];

      const reader = new FileReader();
      reader.onload = function() {
        const arrayBuffer = this.result;

        const array = new Uint8Array(arrayBuffer as ArrayBuffer);

        update(array);
      };
      reader.readAsArrayBuffer(file);
    }

    document
      .getElementById("files")
      .addEventListener("change", handleFileSelect, false);
  }, []);
  return (
    <div>
      <input type="file" id="files" name="files[]" />
      <output id="list" />

      <div id="container">
        <div className="editor">
          <div id="l" />
        </div>
        <div className="editor">
          <div id="r" />
        </div>
      </div>
    </div>
  );
}
