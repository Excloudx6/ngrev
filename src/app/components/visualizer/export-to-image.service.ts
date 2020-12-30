import { Message } from "../../../shared/ipc-constants";
import { IPCBus } from "../../model/ipc-bus";
import { remote } from "electron";
// import { writeFileSync } from "fs";
import { Injectable } from "@angular/core";
const sanitizeFilename = require("sanitize-filename");

function arrayBufferToBuffer(ab) {
  const buffer = new Buffer(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

export interface VisualizerState {
  canvas: HTMLCanvasElement;
  title: string;
}

@Injectable()
export class ExportToImage {
  private ipcCallback: () => void;
  private visState: VisualizerState;

  constructor(private ipcBus: IPCBus) {}

  enable(state: VisualizerState) {
    this.disable();
    this.visState = state;
    this.init();
    this.ipcBus.send(Message.EnableExport);
  }

  disable() {
    if (typeof this.ipcCallback === "function") {
      this.ipcCallback();
    }
    this.ipcBus.send(Message.DisableExport);
  }

  private init() {
    this.ipcCallback = this.ipcBus.on(Message.SaveImage, () => {
      const self = this;

      function blobCallback(b) {
        const r = new FileReader();
        r.onloadend = () => {
          const data = {
            name: sanitizeFilename(
              self.visState.title.toLowerCase().replace(/\s/g, "-")
            ),
            image: r.result,
            format: "png",
          };
          remote.dialog
            .showSaveDialog(remote.BrowserWindow.getAllWindows()[0], {
              title: "Export to Image",
              defaultPath: sanitizeFilename(data.name + "." + data.format),
            })
            .then(result => {
              // TODO(mgechev) enable
              // writeFileSync(result.filePath, arrayBufferToBuffer(data.image));
            });
        };
        r.readAsArrayBuffer(b);
      }
      this.visState.canvas.toBlob(blobCallback, "image/png");
    });
  }
}
