
import STATE from '../state.js'

function radarDeviceController() {

  console.log("pressed Q")
  STATE.radarDeviceActive = (STATE.radarDeviceActive) ? false : true
  console.log(STATE.radarDeviceActive)
  if (STATE.radarDeviceActive) {
    document.querySelector('#radar-device').setAttribute('radar-device', '')
  } else {
    document.querySelector('#radar-device').removeAttribute('radar-device')
  }
}

export default radarDeviceController
