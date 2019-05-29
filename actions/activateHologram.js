import STATE from '../state.js'

function hologramController() {
  console.log("pressed E")
  if (STATE.hologramActive) return

  document.getElementById("land-model").setAttribute("hologram", '')
/*
  let els = [
    document.getElementById("land-model")
    //document.getElementById("lizard-model")
  ]

  console.log("setting ohlogram start", els)
  for( var i = 0; i < els.length; i++) {
    els[i].setAttribute("hologram", '')

  }
  console.log("setting ohlogram done")
  console.log(STATE.hologramActive)
  //var audio = new Audio('../audio/ping.mp3')
  //console.log(audio)
  //audio.play()
  STATE.hologramActive = true


  setTimeout(() => {
    STATE.hologramActive = false
    for( var i = 0; i < els.length; i++) {
      els[i].removeAttribute("hologram")
    }
  }, 7000)
  */
}

export default hologramController
