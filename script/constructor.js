/*global context, AudioContext*/
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

// SOURCE CONSTRUCTOR
function AudioPlayer(bufferLocation, id, name, pathToConnect, loop, onendedFunction) {
    this.source = context.createBufferSource();
    this.source.buffer = bufferLocation;
    this.source.id = id;
    this.source.name = name;
    this.source.connect(pathToConnect);
    this.source.playing = false;
    this.source.loop = loop;
    this.source.onended = onendedFunction;
}

AudioPlayer.prototype.play = function () {
    this.source.play(0);
};

AudioPlayer.prototype.stop = function () {
    this.source.stop(0);
};