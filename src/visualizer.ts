export default function(
  data: Uint8Array,
  document_write: (value: string) => void
) {
  const escape = str =>
    str.replace === undefined
      ? str
      : str
          .replace(/&/g, "&amp;")
          .replace(/>/g, "&gt;")
          .replace(/</g, "&lt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;")
          .replace(/`/g, "&#96;");

  const read = (num: number, mode: string) => {
    i += num;
    var arr = data.slice(i - num, i);
    document_write(
      '<span class="' +
        mode +
        '">' +
        Array.from(arr)
          .map(a => ("0" + a.toString(16)).slice(-2))
          .join(" ") +
        "</span>"
    );
    return arr;
  };

  const readUint = (num, mode = "") =>
    read(num, mode).reduce((a, b) => (a << 8) + b);
  const readStr = n => new TextDecoder("utf-8").decode(read(n, "d"));

  const types = [];
  for (let i = 0x00; i <= 0x7f; i++)
    types[i] = { text: "positive fixint", data: x => x };
  for (let i = 0x80; i <= 0x8f; i++)
    types[i] = { text: "fixmap", data: x => x & 0xf };
  for (let i = 0x90; i <= 0x9f; i++)
    types[i] = { text: "fixarray", data: x => x & 0xf };
  for (let i = 0xa0; i <= 0xbf; i++)
    types[i] = { text: "fixstr", data: x => readStr(x & 0x1f) };

  types[0xc0] = { text: "nil", data: x => null };
  types[0xc2] = { text: "false", data: x => false };
  types[0xc3] = { text: "true", data: x => true };

  types[0xc4] = { text: "bin 8", data: x => read(readUint(1, "o"), "d") };
  types[0xc5] = { text: "bin 16", data: x => read(readUint(2, "o"), "d") };
  types[0xc6] = { text: "bin 32", data: x => read(readUint(4, "o"), "d") };

  types[0xcc] = { text: "uint 8", data: x => readUint(1, "d") };
  types[0xcd] = { text: "uint 16", data: x => readUint(2, "d") };
  types[0xce] = { text: "uint 32", data: x => readUint(4, "d") };
  types[0xcf] = { text: "uint 64", data: x => readUint(8, "d") };

  types[0xd0] = { text: "int 8", data: x => readUint(1) };
  types[0xd1] = { text: "int 16", data: x => readUint(2) };
  types[0xd2] = { text: "int 32", data: x => readUint(4) };
  types[0xd3] = { text: "int 64", data: 4 };

  types[0xd9] = { text: "str 8", data: x => readStr(readUint(1, "o")) };
  types[0xda] = { text: "str 16", option: x => readStr(readUint(2, "o")) };
  types[0xdb] = { text: "str 32", option: x => readStr(readUint(4, "o")) };

  types[0xdc] = { text: "array 16", data: x => readUint(2, "d") };
  types[0xdd] = { text: "array 32", data: x => readUint(4, "d") };
  types[0xde] = { text: "map 16", data: x => readUint(2, "d") };
  types[0xdf] = { text: "map 32", data: x => readUint(4, "d") };

  for (let i = 0xe0; i <= 0xff; i++)
    types[i] = { text: "negative fixint", data: x => x };

  let i = 0;

  const writeType = (indent: string, hasBr: boolean) => {
    document_write(indent);
    const n = read(1, "t")[0];
    const type = types[n];
    const data = type.data(n);
    document_write(
      '<span class="v">' +
        type.text +
        ": " +
        escape(data) +
        "</span>" +
        (hasBr ? "<br>" : "")
    );
    if (type.text.indexOf("array") >= 0) {
      for (let i = 0; i < data; i++) {
        writeType(indent + "　", true);
      }
    }
    if (type.text.indexOf("map") >= 0) {
      for (let i = 0; i < data; i++) {
        writeType(indent + "　", false);
        document_write(" => ");
        writeType(indent + "　", true);
      }
    }
  };

  writeType("", true);
}
