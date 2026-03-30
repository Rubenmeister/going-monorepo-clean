/**
 * IoT Device Management & Real-time Tracking
 * MQTT-based sensor integration, device management, and real-time telemetry
 */

import { Injectable, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';

export interface IoTDevice {
  id?: string;
  deviceId: string;
  type:
    | 'GPS_TRACKER'
    | 'TEMPERATURE_SENSOR'
    | 'HUMIDITY_SENSOR'
    | 'DELIVERY_POD';
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  vehicleId?: string;
  packageId?: string;
  firmwareVersion: string;
  batteryLevel: number; // 0-100%
  lastSeen: Date;
  location?: { latitude: number; longitude: number };
  metadata?: Record<string, any>;
}

export interface SensorReading {
  id?: string;
  deviceId: string;
  type: 'GPS' | 'TEMPERATURE' | 'HUMIDITY' | 'PRESSURE' | 'VIBRATION';
  value: number;
  unit: string; // meters, C, %, hPa, g
  timestamp: Date;
  accuracy?: number;
  metadata?: Record<string, any>;
}

export interface DeviceAlert {
  id?: string;
  deviceId: string;
  alertType:
    | 'TEMPERATURE_EXCEEDED'
    | 'HUMIDITY_EXCEEDED'
    | 'DEVICE_OFFLINE'
    | 'LOW_BATTERY'
    | 'GEOFENCE_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

@Injectable()
export class IoTService {
  private readonly logger = new Logger(IoTService.name);
  private mqttClient: mqtt.MqttClient | null = null;

  // In-memory storage (use MongoDB in production)
  private devices: Map<string, IoTDevice> = new Map();
  private readings: SensorReading[] = [];
  private alerts: Map<string, DeviceAlert> = new Map();
  private deviceSubscriptions: Map<string, Set<string>> = new Map();

  async onModuleInit() {
    await this.initializeMQTT();
  }

  /**
   * Initialize MQTT broker connection
   */
  private async initializeMQTT(): Promise<void> {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `going-platform-${Date.now()}`,
        reconnectPeriod: 5000,
        clean: true,
      });

      this.mqttClient.on('connect', () => {
        this.logger.log('🔗 Connected to MQTT broker');
        this.subscribeToTopics();
      });

      this.mqttClient.on('message', (topic: string, message: Buffer) => {
        this.handleMQTTMessage(topic, message);
      });

      this.mqttClient.on('error', (error) => {
        this.logger.error(`MQTT Error: ${error}`);
      });

      this.mqttClient.on('disconnect', () => {
        this.logger.warn('⚠️ Disconnected from MQTT broker');
      });
    } catch (error) {
      this.logger.error(`Failed to initialize MQTT: ${error}`);
    }
  }

  /**
   * Subscribe to MQTT topics
   */
  private subscribeToTopics(): void {
    const topics = [
      'devices/+/telemetry', // Device sensor data
      'devices/+/status', // Device status
      'devices/+/location', // GPS location
      'devices/+/alerts', // Device alerts
    ];

    topics.forEach((topic) => {
      this.mqttClient?.subscribe(topic, { qos: 1 }, (error) => {
        if (!error) {
          this.logger.log(`📡 Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private handleMQTTMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const [, deviceId, type] = topic.split('/');

      switch (type) {
        case 'telemetry':
          this.processTelemetry(deviceId, payload);
          break;
        case 'status':
          this.processDeviceStatus(deviceId, payload);
          break;
        case 'location':
          this.processLocation(deviceId, payload);
          break;
        case 'alerts':
          this.logger.warn(`Alert from device ${deviceId}: ${JSON.stringify(payload)}`);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to parse MQTT message: ${error}`);
    }
  }

  /**
   * Register a new IoT device
   */
  async registerDevice(
    deviceId: string,
    type: IoTDevice['type'],
    name: string,
    vehicleId?: string,
    metadata?: Record<string, any>
  ): Promise<IoTDevice> {
    try {
      const id = `dev-${Date.now()}`;
      const device: IoTDevice = {
        id,
        deviceId,
        type,
        name,
        status: 'OFFLINE',
        vehicleId,
        firmwareVersion: '1.0.0',
        batteryLevel: 100,
        lastSeen: new Date(),
        metadata,
      };

      this.devices.set(deviceId, device);
      this.logger.log(`✅ Device registered: ${deviceId} (${type})`);

      // Subscribe to device-specific topic
      this.mqttClient?.subscribe(`devices/${deviceId}/#`, { qos: 1 });

      return device;
    } catch (error) {
      this.logger.error(`Failed to register device: ${error}`);
      throw error;
    }
  }

  /**
   * Get all registered devices
   */
  async getDevices(status?: IoTDevice['status']): Promise<IoTDevice[]> {
    try {
      let devices = Array.from(this.devices.values());
      if (status) {
        devices = devices.filter((d) => d.status === status);
      }
      return devices;
    } catch (error) {
      this.logger.error(`Failed to get devices: ${error}`);
      throw error;
    }
  }

  /**
   * Get specific device details
   */
  async getDevice(deviceId: string): Promise<IoTDevice | null> {
    try {
      return this.devices.get(deviceId) || null;
    } catch (error) {
      this.logger.error(`Failed to get device: ${error}`);
      throw error;
    }
  }

  /**
   * Process telemetry data from device
   */
  private processTelemetry(deviceId: string, data: any): void {
    try {
      const readings: SensorReading[] = [];

      // Temperature reading
      if (data.temperature !== undefined) {
        readings.push({
          id: `read-${Date.now()}`,
          deviceId,
          type: 'TEMPERATURE',
          value: data.temperature,
          unit: '°C',
          timestamp: new Date(data.timestamp || Date.now()),
          metadata: { sensor: 'DHT22' },
        });

        // Check if temperature exceeds threshold (e.g., cold chain delivery)
        if (data.temperature < 0 || data.temperature > 25) {
          this.createAlert(
            deviceId,
            'TEMPERATURE_EXCEEDED',
            `Temperature ${data.temperature}°C exceeds acceptable range`,
            'HIGH'
          );
        }
      }

      // Humidity reading
      if (data.humidity !== undefined) {
        readings.push({
          id: `read-${Date.now()}`,
          deviceId,
          type: 'HUMIDITY',
          value: data.humidity,
          unit: '%',
          timestamp: new Date(data.timestamp || Date.now()),
          metadata: { sensor: 'DHT22' },
        });

        if (data.humidity > 80) {
          this.createAlert(
            deviceId,
            'HUMIDITY_EXCEEDED',
            `Humidity ${data.humidity}% exceeds 80%`,
            'MEDIUM'
          );
        }
      }

      // Pressure reading
      if (data.pressure !== undefined) {
        readings.push({
          id: `read-${Date.now()}`,
          deviceId,
          type: 'PRESSURE',
          value: data.pressure,
          unit: 'hPa',
          timestamp: new Date(data.timestamp || Date.now()),
        });
      }

      // Vibration (shock detection for fragile items)
      if (data.acceleration !== undefined) {
        readings.push({
          id: `read-${Date.now()}`,
          deviceId,
          type: 'VIBRATION',
          value: data.acceleration,
          unit: 'g',
          timestamp: new Date(data.timestamp || Date.now()),
          metadata: { axes: data.axes },
        });

        if (data.acceleration > 3) {
          this.createAlert(
            deviceId,
            'DEVICE_OFFLINE',
            `High acceleration detected: ${data.acceleration}g (possible impact)`,
            'HIGH'
          );
        }
      }

      // Store readings
      this.readings.push(...readings);
      this.logger.log(
        `📊 Telemetry recorded: ${deviceId} (${readings.length} readings)`
      );

      // Keep only last 30 days of readings
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.readings = this.readings.filter((r) => r.timestamp >= thirtyDaysAgo);
    } catch (error) {
      this.logger.error(`Failed to process telemetry: ${error}`);
    }
  }

  /**
   * Process device status updates
   */
  private processDeviceStatus(deviceId: string, data: any): void {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return;

      device.status = data.status || 'ONLINE';
      device.batteryLevel = data.battery || device.batteryLevel;
      device.firmwareVersion = data.firmwareVersion || device.firmwareVersion;
      device.lastSeen = new Date();

      if (device.batteryLevel < 20) {
        this.createAlert(
          deviceId,
          'LOW_BATTERY',
          `Battery level: ${device.batteryLevel}%`,
          'MEDIUM'
        );
      }

      this.logger.log(
        `📡 Device status updated: ${deviceId} (${device.status}, Battery: ${device.batteryLevel}%)`
      );
    } catch (error) {
      this.logger.error(`Failed to process device status: ${error}`);
    }
  }

  /**
   * Process GPS location data
   */
  private processLocation(deviceId: string, data: any): void {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return;

      device.location = {
        latitude: data.latitude,
        longitude: data.longitude,
      };
      device.lastSeen = new Date();

      // Detect geofence breach
      if (data.geofence === false) {
        this.createAlert(
          deviceId,
          'GEOFENCE_BREACH',
          'Device left delivery geofence',
          'HIGH'
        );
      }

      this.logger.log(
        `📍 Location updated: ${deviceId} (${data.latitude}, ${data.longitude})`
      );
    } catch (error) {
      this.logger.error(`Failed to process location: ${error}`);
    }
  }

  /**
   * Get device location history (last N minutes)
   */
  async getLocationHistory(deviceId: string, minutes = 60): Promise<any[]> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      return this.readings
        .filter(
          (r) =>
            r.deviceId === deviceId && r.type === 'GPS' && r.timestamp >= since
        )
        .map((r) => ({
          latitude: r.metadata?.latitude,
          longitude: r.metadata?.longitude,
          timestamp: r.timestamp,
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      this.logger.error(`Failed to get location history: ${error}`);
      throw error;
    }
  }

  /**
   * Get sensor readings for device
   */
  async getReadings(
    deviceId: string,
    type?: SensorReading['type'],
    limit = 100
  ): Promise<SensorReading[]> {
    try {
      let readings = this.readings.filter((r) => r.deviceId === deviceId);
      if (type) {
        readings = readings.filter((r) => r.type === type);
      }
      return readings.slice(-limit);
    } catch (error) {
      this.logger.error(`Failed to get readings: ${error}`);
      throw error;
    }
  }

  /**
   * Create device alert
   */
  private createAlert(
    deviceId: string,
    alertType: DeviceAlert['alertType'],
    message: string,
    severity: DeviceAlert['severity']
  ): void {
    try {
      const alertId = `alert-${Date.now()}`;
      const alert: DeviceAlert = {
        id: alertId,
        deviceId,
        alertType,
        severity,
        message,
        resolved: false,
        createdAt: new Date(),
      };

      this.alerts.set(alertId, alert);
      this.logger.warn(
        `⚠️ Alert created: ${deviceId} - ${alertType} (${severity})`
      );

      // Publish alert via MQTT
      this.publishAlert(deviceId, alert);
    } catch (error) {
      this.logger.error(`Failed to create alert: ${error}`);
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(
    deviceId?: string,
    severity?: DeviceAlert['severity']
  ): Promise<DeviceAlert[]> {
    try {
      let alerts = Array.from(this.alerts.values()).filter((a) => !a.resolved);
      if (deviceId) {
        alerts = alerts.filter((a) => a.deviceId === deviceId);
      }
      if (severity) {
        alerts = alerts.filter((a) => a.severity === severity);
      }
      return alerts;
    } catch (error) {
      this.logger.error(`Failed to get alerts: ${error}`);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) return false;

      alert.resolved = true;
      alert.resolvedAt = new Date();

      this.logger.log(`✅ Alert resolved: ${alertId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to resolve alert: ${error}`);
      throw error;
    }
  }

  /**
   * Publish alert to MQTT topic
   */
  private publishAlert(deviceId: string, alert: DeviceAlert): void {
    try {
      const topic = `alerts/${deviceId}/${alert.severity.toLowerCase()}`;
      const payload = JSON.stringify({
        id: alert.id,
        type: alert.alertType,
        message: alert.message,
        timestamp: alert.createdAt,
      });

      this.mqttClient?.publish(topic, payload, { qos: 1 }, (error) => {
        if (!error) {
          this.logger.log(`📢 Alert published: ${topic}`);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to publish alert: ${error}`);
    }
  }

  /**
   * Send command to device via MQTT
   */
  async sendDeviceCommand(
    deviceId: string,
    command: string,
    params?: Record<string, any>
  ): Promise<boolean> {
    try {
      const topic = `commands/${deviceId}`;
      const payload = JSON.stringify({
        command,
        params,
        timestamp: new Date(),
      });

      return new Promise((resolve) => {
        this.mqttClient?.publish(topic, payload, { qos: 1 }, (error) => {
          if (!error) {
            this.logger.log(`💬 Command sent to ${deviceId}: ${command}`);
            resolve(true);
          } else {
            this.logger.error(`Failed to send command: ${error}`);
            resolve(false);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to send device command: ${error}`);
      throw error;
    }
  }

  /**
   * Get device dashboard metrics
   */
  async getDeviceDashboard(deviceId: string): Promise<any> {
    try {
      const device = await this.getDevice(deviceId);
      const recentReadings = await this.getReadings(deviceId, undefined, 100);
      const activeAlerts = await this.getAlerts(deviceId);

      if (!device) return null;

      return {
        device: {
          id: device.id,
          name: device.name,
          type: device.type,
          status: device.status,
          batteryLevel: device.batteryLevel,
          lastSeen: device.lastSeen,
          location: device.location,
        },
        sensors: {
          temperature: recentReadings
            .filter((r) => r.type === 'TEMPERATURE')
            .slice(-1)[0]?.value,
          humidity: recentReadings
            .filter((r) => r.type === 'HUMIDITY')
            .slice(-1)[0]?.value,
          pressure: recentReadings
            .filter((r) => r.type === 'PRESSURE')
            .slice(-1)[0]?.value,
        },
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter((a) => a.severity === 'CRITICAL')
            .length,
          high: activeAlerts.filter((a) => a.severity === 'HIGH').length,
          list: activeAlerts,
        },
        metrics: {
          totalReadings: recentReadings.length,
          uptime: device.status === 'ONLINE' ? '100%' : '0%',
          signalStrength: Math.round(Math.random() * 100) + '%',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard: ${error}`);
      throw error;
    }
  }

  /** Process a sensor reading (controller alias) */
  async processReading(reading: SensorReading): Promise<SensorReading> {
    const r = { ...reading, id: `reading-${Date.now()}`, timestamp: reading.timestamp || new Date() };
    this.readings.push(r);
    this.checkReadingAlerts(r);
    return r;
  }

  /** Update device status */
  async updateDeviceStatus(deviceId: string, status: IoTDevice['status']): Promise<IoTDevice | null> {
    const device = this.devices.get(deviceId);
    if (!device) return null;
    device.status = status;
    device.lastSeen = new Date();
    this.devices.set(deviceId, device);
    return device;
  }

  /** Live telemetry snapshot */
  getLiveTelemetry(deviceId: string) {
    const device = this.devices.get(deviceId);
    const latest = this.readings
      .filter((r) => r.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    return { device: device || null, readings: latest, asOf: new Date().toISOString() };
  }

  private checkReadingAlerts(reading: SensorReading): void {
    if (reading.type === 'TEMPERATURE' && reading.value > 35) {
      const alert: DeviceAlert = {
        id: `alert-${Date.now()}`,
        deviceId: reading.deviceId,
        alertType: 'TEMPERATURE_EXCEEDED',
        severity: reading.value > 45 ? 'CRITICAL' : 'HIGH',
        message: `Temperature ${reading.value}${reading.unit} exceeds safe threshold`,
        resolved: false,
        createdAt: new Date(),
      };
      this.alerts.set(alert.id!, alert);
      this.logger.warn(`🚨 Alert: ${alert.message}`);
    }
  }

  /**
   * Cleanup and disconnect MQTT
   */
  async onModuleDestroy(): Promise<void> {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.log('🔌 MQTT disconnected');
    }
  }
}
