// BEATBOX BY EMIEL ZUURBIER
(function () {
    "use strict";
    
    var context,
        audioBuffer = null,
        bufferLoader,
        hihat = document.getElementById('hihat'),
        hihatOpen = document.getElementById('hihatO'),
        clap = document.getElementById('clap'),
        kick = document.getElementById('kick'),
        snare = document.getElementById('snare'),
        tom = document.getElementById('tom'),
        perc = document.getElementById('perc'),
        crash = document.getElementById('crash'),
        ride = document.getElementById('ride'),
        melody = document.getElementById('melody'),
        volume = document.getElementById('volume'),
        highPassFilter = document.getElementById('high-pass-filter'),
        lowPassFilter = document.getElementById('low-pass-filter'),
        notchPassFilter = document.getElementById('notch-filter'),
        stop = document.getElementById('stop'),
        reset = document.getElementById('reset'),
        audio = document.getElementById('audio'),
        inputs = [volume, highPassFilter, lowPassFilter, stop];
    
    
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        
        // WEB AUDIO API ENHANCEMENT
        var beatBox = {
            init: function () {
                
                // CREATE NEW AUDIOCONTEXT
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                context = new AudioContext();

                beatBox.loadSounds();
            },

            gainNode: {

            },

            highFilter: {

            },

            lowFilter: {

            },
            
            notchFilter: {
                
            },

            playing: [

            ],

            loadSounds: function () {
                
                // BUFFER ALL THE SELECTED TRACKS
                bufferLoader = new BufferLoader(
                    context,
                    [
                        'sounds/hihat-808.mp3',
                        'sounds/openhat-808.mp3',
                        'sounds/kick-808.mp3',
                        'sounds/snare-808.mp3',
                        'sounds/tom-808.mp3',
                        'sounds/clap-808.mp3',
                        'sounds/perc-808.mp3',
                        'sounds/crash-808.mp3',
                        'sounds/ride-acoustic02.mp3',
                        'sounds/dirty.mp3'
                    ]
                );

                bufferLoader.load();
                beatBox.addEvent();
            },

            play: function (sound) {

                // CREATE FILTERS & SOURCES AND START PLAYING
                this.highFilter = context.createBiquadFilter();
                this.lowFilter = context.createBiquadFilter();
                this.notchFilter = context.createBiquadFilter();

                if (!context.createGain) {
                    context.createGain = context.createGainNode;
                }
                this.gainNode = context.createGain();
                var source = context.createBufferSource(); // creates a sound source
                source.buffer = sound;                    // tell the source which sound to play

                this.playing.push(source);

                source.connect(this.gainNode);              // Connect gain node to destination
                this.gainNode.connect(this.highFilter);
                this.highFilter.connect(this.lowFilter);
                this.lowFilter.connect(this.notchFilter);
                this.notchFilter.connect(context.destination);

                this.highFilter.type = 'highpass';
                this.lowFilter.type = 'lowpass';
                this.notchFilter.type= 'notch';

                this.gainNode.gain.value = volume.value / 500;
                this.highFilter.frequency.value = highPassFilter.value;
                this.lowFilter.frequency.value = lowPassFilter.value;
                this.notchFilter.frequency.value = notchPassFilter.value;

                if (source.buffer.duration > 10) {
                    source.loop = true;
                }

                source.start(0);
            },

            stop: function (event) {
                // STOP ALL PLAYING TRAKCS
                var i = 0;
                for (i; i < beatBox.playing.length; i += 1) {
                    beatBox.playing[i].stop(0);
                }
                beatBox.playing = [];
                event.preventDefault();
            },

            addEvent: function () {
                var handler;
                // TOUCHEVENT LISTENERS
                if ('ontouchstart' in document.documentElement) {
                    handler = 'touchstart';
                } else {
                    handler = 'click';
                }
                
                hihat.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[0]);
                    event.preventDefault();
                }, false);

                hihatOpen.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[1]);
                    event.preventDefault();
                }, false);

                kick.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[2]);
                    event.preventDefault();
                }, false);

                snare.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[3]);
                    event.preventDefault();
                }, false);

                tom.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[4]);
                    event.preventDefault();
                }, false);

                clap.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[5]);
                    event.preventDefault();
                }, false);

                perc.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[6]);
                    event.preventDefault();
                }, false);

                crash.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[7]);
                    event.preventDefault();
                }, false);

                ride.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[8]);
                    event.preventDefault();
                }, false);

                melody.addEventListener(handler, function (event) {
                    beatBox.play(bufferLoader.bufferList[9]);
                    event.preventDefault();
                }, false);

            },

            volumeControl: function () {
                beatBox.gainNode.gain.value = volume.value / 500;
            },

            highPassControl: function () {
                beatBox.highFilter.frequency.value = highPassFilter.value;
            },

            lowPassControl: function () {
                beatBox.lowFilter.frequency.value = lowPassFilter.value;
            },
            
            notchPassControl: function () {
                beatBox.notchFilter.frequency.value = notchPassFilter.value;
            },
            
            resetControls: function () {
                volume.value = 500;
                highPassFilter.value = 0;
                lowPassFilter.value = 10000;
                notchPassFilter.value = 0;
                
                beatBox.gainNode.gain.value = volume.value / 500;
                beatBox.highFilter.frequency.value = highPassFilter.value;
                beatBox.lowFilter.frequency.value = lowPassFilter.value;
                beatBox.notchFilter.frequency.value = notchPassFilter.value;
            }
        };

        volume.addEventListener('input', beatBox.volumeControl, false);
        highPassFilter.addEventListener('input', beatBox.highPassControl, false);
        lowPassFilter.addEventListener('input', beatBox.lowPassControl, false);
        notchPassFilter.addEventListener('input', beatBox.notchPassControl, false);
        stop.addEventListener('click', beatBox.stop, false);
        reset.addEventListener('click', beatBox.resetControls, false);
        document.addEventListener('keydown', keypress, false);
        window.addEventListener('load', beatBox.init, false);
        
    } else {
            
        // FALLBACK WHICH USES THE AUDIO TAG
        document.getElementById('form').className = 'form hidden';
        
        for (var i = 0; i < inputs.length; i += 1) {
            inputs[i].setAttribute('disabled', true);
        }
        
        var audioPlayer = function (event) {
            audio.src = this.getAttribute('href');
            audio.load();
            audio.play();
            
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        };
        
        if ('addEventListener' in window) {
            document.getElementById('ie-error').className = 'error';
            console.log("IE9+ Fallback active");
            
            hihat.addEventListener('click', audioPlayer, false);
            hihatOpen.addEventListener('click', audioPlayer, false);
            kick.addEventListener('click', audioPlayer, false);
            snare.addEventListener('click', audioPlayer, false);
            tom.addEventListener('click', audioPlayer, false);
            clap.addEventListener('click', audioPlayer, false);
            perc.addEventListener('click', audioPlayer, false);
            crash.addEventListener('click', audioPlayer, false);
            ride.addEventListener('click', audioPlayer, false);
            melody.addEventListener('click', audioPlayer, false);
        } else {
            console.log("No Audio support at all. IE8- Fallback active");
            document.getElementById('form').className = 'form hidden';
        }
        
    }
    
    // KEYBOARD CONTROLS FOR BEATBOX
    function keypress(event) {
        var keyCode = event.keyCode;
        switch(keyCode) {
            case 65:
                beatBox.play(bufferLoader.bufferList[0]);
                break;
            case 83:
                beatBox.play(bufferLoader.bufferList[1]);
                break;
            case 68:
                beatBox.play(bufferLoader.bufferList[2]);
                break;
            case 70:
                beatBox.play(bufferLoader.bufferList[3]);
                break;
            case 71:
                beatBox.play(bufferLoader.bufferList[4]);
                break;
            case 72:
                beatBox.play(bufferLoader.bufferList[5]);
                break;
            case 74:
                beatBox.play(bufferLoader.bufferList[6]);
                break;
            case 75:
                beatBox.play(bufferLoader.bufferList[7]);
                break;
            case 76:
                beatBox.play(bufferLoader.bufferList[8]);
                break;
        }
    }
    
}());