import {
  DepacketizeBase,
  DepacketizerInput,
  DepacketizerOptions,
  DepacketizerOutput,
} from "./depacketizer";

export class DepacketizeCallback extends DepacketizeBase {
  private cb!: (input: DepacketizerOutput) => void;

  constructor(codec: string, options: DepacketizerOptions = {}) {
    super(codec, options);
  }

  pipe = (cb: (input: DepacketizerOutput) => void) => {
    this.cb = cb;
    return this;
  };

  input = (input: DepacketizerInput) => {
    for (const output of this.processInput(input)) {
      this.cb(output);
    }
  };
}
