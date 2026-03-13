/**
 * BLE Transport for Phomemo D30 printer
 * Handles Web Bluetooth connection and data transmission
 */

const SERVICE_UUID = 0xff00;
const WRITE_CHAR_UUID = 0xff02;
const CHUNK_SIZE = 128;
const CHUNK_DELAY_MS = 20;

export class BLETransport {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  get isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  get deviceName(): string {
    return this.device?.name ?? "";
  }

  async connect(): Promise<void> {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "D30" }],
      optionalServices: [SERVICE_UUID],
    });

    this.device = device;

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(WRITE_CHAR_UUID);
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error("Not connected to printer");
    }

    const buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;

    if (this.characteristic.properties.writeWithoutResponse) {
      await this.characteristic.writeValueWithoutResponse(buffer);
    } else {
      await this.characteristic.writeValue(buffer);
    }
  }

  async sendChunked(
    data: Uint8Array,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
      await this.send(chunk);
      await this.delay(CHUNK_DELAY_MS);

      if (onProgress) {
        onProgress(Math.round(((i + chunk.length) / data.length) * 100));
      }
    }
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
