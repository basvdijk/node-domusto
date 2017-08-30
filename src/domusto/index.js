let util = require('../util');
let core = require('../core.js');
let config = require('../config');

let domustoEmitter = require('./DomustoEmitter');
let domustoTriggers = require('./DomustoTriggers');
let DomustoTimer = require('./DomustoTimer');
let DomustoDevicesManager = require('./DomustoDevicesManager');
let DomustoPluginsManager = require('./DomustoPluginsManager');
let DomustoSocketIO = require('./DomustoSocketIO');

class Domusto {

    constructor(io) {

        // this.io = io;

        DomustoSocketIO.setIO(io);

        // We need to bind the this of the current class otherwise this referrs to DomustoPluginsManager
        DomustoPluginsManager.onNewInputData = this._onNewInputData.bind(this);

        // io.on('connection', function (socket) {

        //     util.debug('DOMUSTO client connected from:', socket.handshake.headers.referer);

        //     // Update the client with the latest known states / data
        //     socket.emit('inputDeviceUpdate', DomustoDevicesManager.getDevicesByRole('input'));
        //     socket.emit('outputDeviceUpdate', DomustoDevicesManager.getDevicesByRole('output'));


        //     // // send data to client
        //     // setInterval(function () {
        //     //     console.log('emit');
        //     //     Domusto.io.emit('deviceUpdate', { 'id': 'input-2', 'number': Math.random() });
        //     // }, 10000);

        // });

    }

    /**
     * Fired when a plugin broadcasts new data
     * @param {object} input Input device object
     */
    _onNewInputData(inputData) {

        util.log('Received new input data:');
        util.prettyJson(inputData);

        let device = DomustoDevicesManager.getDeviceByPluginId(inputData.pluginId);

        // Check if the updated data comes from a registered device
        if (device) {

            switch (device.type) {
                case 'switch': {
                    Domusto.outputCommand(device.id, inputData.command);
                    break;
                }
                default:

                    // Update the device with the new input data
                    Object.assign(device.data, inputData.data);

                    device.lastUpdated = new Date();

                    // inputDeviceUpdate channel only takes arrays
                    let devices = [];
                    devices.push(device);
                    DomustoSocketIO.emit('inputDeviceUpdate', devices);

                    break;
            }

        }

    }

}

module.exports = Domusto;

// let Domusto = {};

// Domusto.io = null;

// Domusto.outputDevices = [];
// Domusto.inputDevices = [];

// Domusto.devices = {};

// Domusto.pluginInstances = {};

// Domusto.init = function () {

//     util.log('STARTING DOMUSTO HOME AUTOMATION SYSTEM');

//     if (!config.debug) {
//         util.debug = function () { };
//     } else {
//         util.log('Debug messages enabled')
//     }

//     Domusto.initHardware();

//     Domusto.initDevices();

//     domustoTriggers.initDeviceTriggers(Domusto.devices, this.outputCommand);

// }

// /**
//  * Initialises configured hardware
//  */
// Domusto.initHardware = function () {

//     util.debug('Initialising hardware');

//     let plugins = config.plugins;
//     let pluginNodeModule = null;

//     // Loading hardware plugins
//     for (let i = 0; i < plugins.length; i++) {

//         let plugin = plugins[i];

//         if (plugin.enabled) {
//             try {
//                 pluginNodeModule = require('../plugins/domusto-' + plugin.type.toLowerCase());

//                 domustoPluginInstance = new pluginNodeModule(plugin);
//                 Domusto.pluginInstances[plugin.type] = domustoPluginInstance;
//                 // Subscribe to the new input data function
//                 domustoPluginInstance.onNewInputData = Domusto.onNewInputData;

//                 if (plugin.triggers) {
//                     domustoTriggers.initPluginTriggers(domustoPluginInstance, plugin);
//                 }

//             } catch (error) {
//                 util.error('Error loading plugin ', plugin.type, error);
//             }
//         }

//     }

// }



// /**
//  * Initialises configured devices
//  */
// Domusto.initDevices = function () {

//     for (let i = 0; i < config.devices.length; i++) {

//         let device = config.devices[i];

//         if (device.enabled) {

//             switch (device.role) {
//                 case 'input': {
//                     let input = Domusto.initInput(Object.assign({}, device));
//                     Domusto.devices[input.id] = input;

//                     let pluginId = input.protocol.pluginId;
//                     let pluginInstance = Domusto.pluginInstanceByPluginId(pluginId);

//                     if (pluginInstance) {
//                         pluginInstance.addRegisteredDevice(input);
//                     } else {
//                         util.debug('No plugin found for hardware id', input.protocol.pluginId);
//                     }
//                     break;
//                 }
//                 case 'output': {
//                     let output = Domusto.initOutput(Object.assign({}, device));
//                     Domusto.devices[output.id] = output;

//                     // Initialise timers when specified
//                     if (output.timers) {

//                         output.timers.forEach((timer) => {

//                             new DomustoTimer(output, timer, (device, timer) => {
//                                 Domusto.outputCommand(device, timer);
//                             });

//                             output.hasTimers = true;

//                         });

//                     }

//                     let pluginId = output.protocol.pluginId;
//                     let pluginInstance = Domusto.pluginInstanceByPluginId(pluginId);

//                     if (pluginInstance) {
//                         pluginInstance.addRegisteredDevice(output);
//                     } else {
//                         util.debug('No plugin found for hardware id', output.protocol.pluginId);
//                     }

//                     break;
//                 }

//             }
//         }
//     }

// }


// /**
//  * Initialises an input device with its default DOMUSTO device properties
//  * @param {object} input Input device object from configuration
//  */
// Domusto.initInput = function (input) {

//     switch (input.type) {
//         case 'temperature': {

//             input.data = {
//                 deviceTypeString: null,
//                 temperature: null,
//                 humidity: null,
//                 humidityStatus: null,
//                 barometer: null,
//                 batteryLevel: null,
//                 rssi: null,
//             }
//             input.lastUpdated = new Date()
//             break;
//         }
//         case 'power': {

//             input.data = {
//                 electricity: {
//                     received: {
//                         tariff1: {
//                             value: null,
//                             unit: 'kW'
//                         },
//                         tariff2: {
//                             value: null,
//                             unit: 'kWh'
//                         },
//                         actual: {
//                             value: null,
//                             unit: 'kWh'
//                         }
//                     }
//                 }
//             }
//             input.lastUpdated = new Date()
//             break;
//         }
//     }

//     return input;
// }

// /**
//  * Initialises an output device with its default DOMUSTO device properties
//  * @param {object} output Output device object from configuration
//  */
// Domusto.initOutput = function (output) {
//     output.state = 'off';
//     output.busy = false;
//     output.hasTimers = false;
//     output.lastUpdated = new Date();

//     switch (output.subtype) {

//         case 'on/off':
//         case 'up/down':

//             output.actions = {
//                 on: core.data.serverAddress + 'output/command/' + output.id + '/on',
//                 off: core.data.serverAddress + 'output/command/' + output.id + '/off'
//             }
//             break;

//         case 'momentary':

//             output.actions = {
//                 trigger: core.data.serverAddress + 'output/command/' + output.id + '/trigger'
//             }

//             break;
//     }

//     return output;
// }

// /**
//  * Sends an output command to the hardware of an output device
//  * @param {string} deviceId Id of the device
//  * @param {string} command Command to send
//  * @param {function} onSucces Fired when the command is successfully executed
//  */
// Domusto.outputCommand = function (deviceId, command, onSuccess) {

//     let device = Domusto.devices[deviceId];
//     let pluginInstance = Domusto.pluginInstanceByPluginId(device.protocol.pluginId);

//     if (!device.busy) {

//         device.busy = true;

//         pluginInstance.outputCommand(device, command, response => {

//             console.log('emit', device.id + command);
//             domustoEmitter.emit(device.id + command);

//             util.logSwitchToFile(device.name + ' (' + device.id + ') - ' + command);

//             device.busy = false;
//             device.state = response.state;
//             device.lastUpdated = new Date();

//             // check if a callback is provided
//             if (onSuccess) {
//                 onSuccess(device);
//             }

//             // outputDeviceUpdate channel only takes arrays
//             let devices = [];
//             devices.push(device);
//             Domusto.io.emit('outputDeviceUpdate', devices);

//         });

//     }

// }

// /**
//  * Fired when a plugin broadcasts new data
//  * @param {object} input Input device object
//  */
// Domusto.onNewInputData = function (inputData) {

//     util.log('Received new input data:');
//     util.prettyJson(inputData);

//     let device = Domusto.deviceByPluginId(inputData.pluginId);

//     // Check if the updated data comes from a registered device
//     if (device) {

//         switch (device.type) {
//             case 'switch': {
//                 Domusto.outputCommand(device.id, inputData.command);
//                 break;
//             }
//             default:

//                 // Update the device with the new input data
//                 Object.assign(device.data, inputData.data);

//                 device.lastUpdated = new Date();

//                 // inputDeviceUpdate channel only takes arrays
//                 let devices = [];
//                 devices.push(device);
//                 Domusto.io.emit('inputDeviceUpdate', devices);

//                 break;
//         }

//     }

// }

// // Get the hardware instance by device id
// Domusto.pluginInstanceByPluginId = function (pluginId) {
//     return Domusto.pluginInstances[pluginId];
// }

// Domusto.deviceByPluginId = function (pluginId) {

//     for (let i in Domusto.devices) {

//         let device = Domusto.devices[i];

//         if (device.protocol.id && (device.protocol.id === pluginId)) {
//             return device;
//         }
//     }

//     for (let i in Domusto.devices) {

//         let device = Domusto.devices[i];

//         if (device.protocol.outputId && (device.protocol.outputId === pluginId)) {
//             return device;
//         }
//     }

//     for (let i in Domusto.devices) {

//         let device = Domusto.devices[i];

//         if (device.protocol.inputIds) {

//             let device = Domusto.devices[i];

//             for (let j in device.protocol.inputIds) {

//                 if (device.protocol.inputIds[j] === pluginId) {
//                     return device;
//                 }

//             }

//         }
//     }

//     return null;
// };

// Domusto.getDevicesByRole = function (role) {

//     let devices = [];

//     for (let i in Domusto.devices) {

//         let device = Domusto.devices[i];

//         if (device.role === role) {
//             devices.push(device);
//         }
//     }

//     return devices;

// }

// module.exports = Domusto;