import STATE from '../state.js'

function hologramController() {
  if (STATE.hologramActive) return

  let els = [
    document.getElementById("land-model"),
    document.getElementById("lizard-model")
  ]

  for( var i = 0; i < els.length; i++) {
    els[i].setAttribute("hologram", '')
  }

  var audio = new Audio('audio/ping.mp3')
  audio.play()
  STATE.hologramActive = true


  setTimeout(() => {
    STATE.hologramActive = false
    for( var i = 0; i < els.length; i++) {
      els[i].removeAttribute("hologram")
    }
  }, 7000)
}

export default hologramController
