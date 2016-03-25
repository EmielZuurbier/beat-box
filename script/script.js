// WEB AUDIO API - V2 - EMIEL ZUURBIER

(function () {
    'use strict';
    var buttons = document.querySelectorAll('.button-audio'),
        audios = document.querySelectorAll('audio');
    
    // CHECK IF AUDIOCONTEXT IS AVAILABLE
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        
        // CACHE VARIABLES
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext(),
            gainNode = context.createGain(),
            highFilter = context.createBiquadFilter(),
            lowFilter = context.createBiquadFilter(),
            notchFilter = context.createBiquadFilter(),
            panFilter = context.createStereoPanner(),
            bufferList = [],
            paths = [],
            playing = [],
            controls = document.querySelectorAll('input[type="range"]'),
            stop = document.getElementById('stop'),
            reset = document.getElementById('reset'),
            tempoLight = document.getElementById('tempo'),
            tempoInd = document.getElementById('tempo-indicator'),
            handler;
        
        // SET FILTER TYPES
        highFilter.type = 'highpass';
        lowFilter.type = 'lowpass';
        notchFilter.type = 'notch';

        // SET FILTER VALUES
        gainNode.gain.value = controls[0].value / 500;
        highFilter.frequency.value = controls[1].value;
        lowFilter.frequency.value = controls[2].value;
        notchFilter.frequency.value = controls[3].value;
        
        // CONNECT VOLUME AND FILTERS
        gainNode.connect(highFilter);
        highFilter.connect(lowFilter);
        lowFilter.connect(notchFilter);
        notchFilter.connect(panFilter);
        panFilter.connect(context.destination);
        
        // GET LINKS FROM HREF ATTRIBUTES AND PUSH TO PATHS ARRAY
        for (var i = 0; i < buttons.length; i += 1) {
            paths.push(buttons[i].getAttribute('href'));
        }
        
        // PUSH THE PATHS TO THE LOADBUFFER FOR BUFFERING
        (function pushBuffer(input) {
            for (var i = 0; i < input.length; i += 1) {
                loadBuffer(input[i], i);
            }
        }(paths));
        
        function test() {
            alert("Something");
        }
        
        // BUFFER- AND HTTPREQUESTS WHICH CREATES AUDIONODES AND PUSHES THEM TO BUFFERLIST
        function loadBuffer(url, index) {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";
            
            request.onload = function () {
                context.decodeAudioData(request.response, function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    bufferList[index] = buffer; 
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                });
            };
            request.send();
        }
        
        // AUDIO CONSTRUCTOR
        function AudioPlayer(bufferLocation, id, name, pathToConnect, loop, onendedFunction) {
            this.source = context.createBufferSource();
            this.source.buffer = bufferLocation;
            this.source.id = id;
            this.source.name = name;
            this.source.connect(pathToConnect);
            this.source.loop = loop;
            this.source.playing = false;
            this.source.onended = onendedFunction;
        }

        AudioPlayer.prototype.start = function () {
            this.source.start(context.currentTime);
        };

        AudioPlayer.prototype.stop = function () {
            this.source.stop(0);
        };
        
        AudioPlayer.prototype.setSpeed = function (bpm) {
            var rate = bpm / 2.133333333333333 / 60;
            var value = rate / 2.13333333333333;
            tempoInd.innerHTML = bpm;
            controls[5].value = value;
            tempoLight.style.animation='blinker ' + (controls[5].getAttribute('max') - value) + 's infinite normal running';
            this.source.playbackRate.value = rate;
        };
        
        // STOP PLAYING
        function stopSound(event) {
            for (var i = 0; i < playing.length; i += 1) {
                playing[i].stop();
            }
            playing = [];
            tempoLight.removeAttribute('style');
            event.preventDefault();
        }
        
        // PLAY THE SOUND FROM BEAT BUTTONS
        function createSound(event) {
            
            // CONSTRUCT SOURCE
            var source = new AudioPlayer(
                bufferList[event.target.id],
                event.target.id,
                event.target.innerText,
                gainNode,
                false,
                function() {
                    this.playing = false;
                }
            );
            
            // START SOUND
            source.start();
            event.preventDefault();
        }
        
        // PLAY THE MELODY
        function createMelody(event) {
            
            // FIRST STOP ALL MELODIES FROM PLAYING
            stopSound(event);
            
            // CONSTRUCT SOURCE
            var melody = new AudioPlayer(
                bufferList[event.target.id],
                event.target.id,
                'melody',
                gainNode,
                true,
                function() {
                    this.playing = false;
                }
            );
            
            // SET BPM
            melody.setSpeed(128);
            
            // PUSH AUDIOPLAYER TO THE CURRENTLY PLAYING ARRAY
            playing.push(melody);
            
            // START MELODY
            melody.start();
            event.preventDefault();
        }
        
        // EFFECT CONTROLS
        function effectControls() {
            gainNode.gain.value = controls[0].value / 500;
            highFilter.frequency.value = controls[1].value;
            lowFilter.frequency.value = controls[2].value;
            notchFilter.frequency.value = controls[3].value;
            panFilter.pan.value = controls[4].value;
            playing[0].source.playbackRate.value = controls[5].value * 2.1333333333;
            tempoLight.style.animation='blinker ' + (controls[5].getAttribute('max') - controls[5].value) + 's infinite normal running';
            tempoInd.innerHTML = Math.round((controls[5].value * 2.13333333333 * 60 * 2.13333333333));
        }
        
        // RESET CONTROLS
        function resetControls(event) {
            controls[0].value = 500;
            controls[1].value = 0;
            controls[2].value = 10000;
            controls[3].value = 0;
            controls[4].value = 0;
            controls[5].value = 0.46875;
            
            gainNode.gain.value = controls[0].value / 500;
            highFilter.frequency.value = controls[1].value;
            lowFilter.frequency.value = controls[2].value;
            notchFilter.frequency.value = controls[3].value;
            panFilter.pan.value = controls[4].value;
            event.preventDefault();
        }
        
        function toggle(event) {
            buttons[event.target.id].classList.toggle('active');
        }
        
        // ADD KEYBOARD CONTROLS
        function keypress(event) {
            var keyCode = event.keyCode;
            switch(keyCode) {
                case 65:
                    event.target.id = 0;
                    toggle(event);
                    createSound(event);
                    break;
                case 83:
                    event.target.id = 1;
                    toggle(event);
                    createSound(event);
                    break;
                case 68:
                    event.target.id = 2;
                    toggle(event);
                    createSound(event);
                    break;
                case 70:
                    event.target.id = 3;
                    toggle(event);
                    createSound(event);
                    break;
                case 71:
                    event.target.id = 4;
                    toggle(event);
                    createSound(event);
                    break;
                case 72:
                    event.target.id = 5;
                    toggle(event);
                    createSound(event);
                    break;
                case 74:
                    event.target.id = 6;
                    toggle(event);
                    createSound(event);
                    break;
                case 75:
                    event.target.id = 7;
                    toggle(event);
                    createSound(event);
                    break;
                case 76:
                    event.target.id = 8;
                    toggle(event);
                    createSound(event);
                    break;
                case 32:
                    event.target.id = 9;
                    toggle(event);
                    createMelody(event);
                    break;
            }
        }
        
        // KEYBOARD UP FUNCTION TO SIMULATE BUTTON PRESS ANIMATION
        function keypressUp(event) {
            var keyCode = event.keyCode;
            switch(keyCode) {
                case 65:
                    event.target.id = 0;
                    toggle(event);
                    break;
                case 83:
                    event.target.id = 1;
                    toggle(event);
                    break;
                case 68:
                    event.target.id = 2;
                    toggle(event);
                    break;
                case 70:
                    event.target.id = 3;
                    toggle(event);
                    break;
                case 71:
                    event.target.id = 4;
                    toggle(event);
                    break;
                case 72:
                    event.target.id = 5;
                    toggle(event);
                    break;
                case 74:
                    event.target.id = 6;
                    toggle(event);
                    break;
                case 75:
                    event.target.id = 7;
                    toggle(event);
                    break;
                case 76:
                    event.target.id = 8;
                    toggle(event);
                    break;
                case 32:
                    event.target.id = 9;
                    toggle(event);
                    break;
            }
        }
        
        // SEE IF TOUCHEVENTS ARE SUPPORTED
        if ('ontouchstart' in document.documentElement) {
            handler = 'touchstart';
        } else {
            handler = 'click';
        }
        
        // ADD EVENTLISTENERS TO BUTTONS EXCEPT THE LAST BUTTON
        for (var i = 0; i < buttons.length -1; i += 1) {
            buttons[i].addEventListener(handler, createSound, false);
        }
        
        // ADD EVENTLISTENER FOR MELODY BUTTON
        buttons[buttons.length -1].addEventListener(handler, createMelody, false);
        
        // ADD EVENTLISTENERS TO CONTROLS
        for (var i = 0; i < controls.length; i += 1) {
            controls[i].addEventListener('input', effectControls, false);
        }
        
        // ADD EVENTLISTENERS TO ADDITIONAL CONTROLS
        stop.addEventListener('click', stopSound, false);
        reset.addEventListener('click', resetControls, false);
        document.addEventListener('keydown', keypress, false);
        document.addEventListener('keyup', keypressUp, false);
        
    } else if ('addEventListener' in window) {

        // AUDIOTAG FUNCTIONS
        // THIS IS ACTIVATED WHEN THE AUDIOCONTEXT IS NOT SUPPORTED
        document.getElementById('form').className = 'form hidden';
        
        // PLAY WITH AUDIOTAG
        function playAudioTag(event) {
            var audioPlayer = audios[event.target.id];
            if (audioPlayer.playing) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            event.preventDefault();
            event.returnValue = false;
        }

        // ADD EVENTLISTENERS FOR AUDIO TAGS
        for (var i = 0; i < buttons.length; i += 1) {
            buttons[i].addEventListener('click', playAudioTag, false);
        }
        
    } else {
        
        // IF AUDIOCONTEXT AND AUDIO TAGS ARE NOT SUPPORTED FALLBACK TO BASIC USAGE
        document.getElementById('form').className = 'form hidden';
        
    }
    
}());