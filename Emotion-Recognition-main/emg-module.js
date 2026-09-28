/**
 * EMG Sensor Module
 * Supports: Web Bluetooth, Web Serial, and WebSocket connections
 * Compatible with: Muse, OpenBCI, Shimmer, and generic EMG devices
 */

class EMGModule {
    constructor() {
        this.device = null;
        this.isConnected = false;
        this.channels = [];
        this.dataCallback = null;
        this.connectionType = null;
        this.port = null;
        this.reader = null;
        this.ws = null;
    }

    /**
     * Connect to EMG device via Web Bluetooth
     */
    async connectBluetooth() {
        try {
            // Request device with EMG services (UUID for common EMG devices)
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'Muse' },
                    { name: 'OpenBCI' },
                    { name: 'Shimmer' }
                ],
                optionalServices: [
                    '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service
                    '0000180d-0000-1000-8000-00805f9b34fb'  // Heart Rate Service
                ]
            });

            this.device = device;
            const server = await device.gatt.connect();
            
            // Get primary service (adjust based on device)
            const service = await server.getPrimaryService(device.uuids?.[0] || '0000180a-0000-1000-8000-00805f9b34fb');
            const characteristics = await service.getCharacteristics();

            this.connectionType = 'bluetooth';
            this.isConnected = true;
            
            // Initialize channels based on device
            this.initializeChannels(device.name);
            this.setupBluetoothListeners(characteristics);
            
            return true;
        } catch (error) {
            console.error('Bluetooth connection failed:', error);
            return false;
        }
    }

    /**
     * Connect to EMG device via Web Serial (USB)
     */
    async connectSerial() {
        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });
            
            this.connectionType = 'serial';
            this.isConnected = true;
            this.initializeChannels('Serial Device');
            this.readSerialData();
            
            return true;
        } catch (error) {
            console.error('Serial connection failed:', error);
            return false;
        }
    }

    /**
     * Connect to EMG device via WebSocket (e.g., local Python server)
     */
    async connectWebSocket(url = 'ws://localhost:8765') {
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.connectionType = 'websocket';
                this.isConnected = true;
                this.initializeChannels('WebSocket EMG');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processEMGData(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
            };

            return true;
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            return false;
        }
    }

    /**
     * Initialize EMG channels based on device type
     */
    initializeChannels(deviceName) {
        const channelMap = {
            'Muse': ['TP9', 'AF7', 'AF8', 'TP10'],
            'OpenBCI': ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8'],
            'Shimmer': ['Acc_X', 'Acc_Y', 'Acc_Z', 'Gyro_X', 'Gyro_Y', 'Gyro_Z'],
            'Serial Device': ['CH1', 'CH2', 'CH3', 'CH4'],
            'WebSocket EMG': ['CH1', 'CH2', 'CH3', 'CH4']
        };

        const channelNames = channelMap[deviceName] || channelMap['Serial Device'];
        this.channels = channelNames.map(name => ({
            name: name,
            value: 0,
            history: [],
            max: 1000
        }));
    }

    /**
     * Setup Bluetooth listeners for characteristics
     */
    setupBluetoothListeners(characteristics) {
        characteristics.forEach((char, index) => {
            if (index < this.channels.length) {
                char.startNotifications();
                char.addEventListener('characteristicvaluechanged', (event) => {
                    const value = event.target.value.getUint8(0);
                    this.channels[index].value = value;
                    if (this.dataCallback) this.dataCallback(this.channels);
                });
            }
        });
    }

    /**
     * Read data from Serial port
     */
    async readSerialData() {
        while (this.port.readable) {
            const reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    const text = new TextDecoder().decode(value);
                    const values = text.trim().split(',').map(Number);
                    
                    values.forEach((val, idx) => {
                        if (idx < this.channels.length) {
                            this.channels[idx].value = val;
                        }
                    });
                    
                    if (this.dataCallback) this.dataCallback(this.channels);
                }
            } finally {
                reader.releaseLock();
            }
        }
    }

    /**
     * Process EMG data from WebSocket or other sources
     */
    processEMGData(data) {
        if (Array.isArray(data)) {
            data.forEach((val, idx) => {
                if (idx < this.channels.length) {
                    this.channels[idx].value = val;
                }
            });
        } else {
            Object.keys(data).forEach((key, idx) => {
                if (idx < this.channels.length) {
                    this.channels[idx].value = data[key];
                }
            });
        }

        if (this.dataCallback) this.dataCallback(this.channels);
    }

    /**
     * Update channel history and compute statistics
     */
    updateHistory() {
        this.channels.forEach(channel => {
            channel.history.push(channel.value);
            if (channel.history.length > 100) {
                channel.history.shift();
            }
        });
    }

    /**
     * Get RMS (Root Mean Square) of channel data
     */
    getChannelRMS(channelIndex) {
        if (channelIndex >= this.channels.length) return 0;
        
        const history = this.channels[channelIndex].history;
        if (history.length === 0) return 0;
        
        const sum = history.reduce((acc, val) => acc + val * val, 0);
        return Math.sqrt(sum / history.length);
    }

    /**
     * Get muscle activity level (normalized 0-100)
     */
    getActivityLevel(channelIndex) {
        const rms = this.getChannelRMS(channelIndex);
        return Math.min(100, (rms / 50) * 100); // Adjust denominator based on your device
    }

    /**
     * Disconnect from EMG device
     */
    async disconnect() {
        try {
            if (this.connectionType === 'bluetooth' && this.device) {
                await this.device.gatt.disconnect();
            } else if (this.connectionType === 'serial' && this.port) {
                await this.port.close();
            } else if (this.connectionType === 'websocket' && this.ws) {
                this.ws.close();
            }
            
            this.isConnected = false;
            this.device = null;
            this.port = null;
            this.ws = null;
            this.channels = [];
            return true;
        } catch (error) {
            console.error('Disconnect failed:', error);
            return false;
        }
    }

    /**
     * Set callback for data updates
     */
    onData(callback) {
        this.dataCallback = callback;
    }

    /**
     * Get current channel data
     */
    getChannelData() {
        return this.channels;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            type: this.connectionType,
            channelCount: this.channels.length,
            channels: this.channels.map(ch => ({
                name: ch.name,
                value: ch.value
            }))
        };
    }
}

// Create global instance
const emgModule = new EMGModule();
