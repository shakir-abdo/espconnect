export interface SerialIO {
  write(data: Uint8Array): Promise<void>;
  // read is handled by your single reader task; detectors query buffer
}

export class RingBuffer {
  private buf: Uint8Array;
  private head = 0;
  private size = 0;

  constructor(private capacity = 8192) {
    this.buf = new Uint8Array(capacity);
  }

  push(chunk: Uint8Array) {
    for (let i = 0; i < chunk.length; i++) {
      this.buf[(this.head + this.size) % this.capacity] = chunk[i]!;
      if (this.size < this.capacity) this.size++;
      else this.head = (this.head + 1) % this.capacity;
    }
  }

  snapshot(maxBytes = this.size): Uint8Array {
    const n = Math.min(maxBytes, this.size);
    const out = new Uint8Array(n);
    const start = (this.head + (this.size - n)) % this.capacity;
    for (let i = 0; i < n; i++) out[i] = this.buf[(start + i) % this.capacity]!;
    return out;
  }

  clear() { this.head = 0; this.size = 0; }

  toAscii(maxBytes = 2048): string {
    const data = this.snapshot(maxBytes);
    // decode as latin1-ish to preserve bytes; good enough for banners
    let s = "";
    for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]!);
    return s;
  }

  includesAscii(needle: string, maxBytes = 4096): boolean {
    return this.toAscii(maxBytes).includes(needle);
  }

  matchRegex(re: RegExp, maxBytes = 4096): RegExpMatchArray | null {
    const s = this.toAscii(maxBytes);
    return s.match(re);
  }
}
