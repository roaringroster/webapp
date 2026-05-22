import { BaseType, createBase } from "./base";

type UserDeviceId = string;
type LocalDeviceId = string;

export type DeviceInfo = {
  appVersion: string;
  appBuild: string;
  customName: string;
  type: string;
  operatingSystem: string;
  systemInfo: string;
};

export type DeviceListProps = {
  deviceMap: Record<UserDeviceId, LocalDeviceId>;
  devices: Record<LocalDeviceId, DeviceInfo>;
};

export type DeviceList = BaseType & DeviceListProps;

export const deviceListSchema = 1;

export const createDeviceList = ({
  deviceMap = {},
  devices = {},
}: Partial<DeviceListProps> = {}): DeviceList => ({
  ...createBase(deviceListSchema),
  deviceMap,
  devices,
});
