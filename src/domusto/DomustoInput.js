let DomustoDevice = require('./DomustoDevice');

class DomustoInput extends DomustoDevice {

    constructor(input) {

        super(input);

        switch (input.type) {
            case 'temperature': {

                this._data = {
                    deviceTypeString: null,
                    temperature: null,
                    humidity: null,
                    humidityStatus: null,
                    barometer: null,
                    batteryLevel: null,
                    rssi: null,
                }
                input.lastUpdated = new Date()
                break;
            }
            case 'power': {

                input.data = {
                    electricity: {
                        received: {
                            tariff1: {
                                value: null,
                                unit: 'kW'
                            },
                            tariff2: {
                                value: null,
                                unit: 'kWh'
                            },
                            actual: {
                                value: null,
                                unit: 'kWh'
                            }
                        }
                    }
                }
                input.lastUpdated = new Date()
                break;
            }
        }
    }

}

module.exports = DomustoInput;