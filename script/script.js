// WEB AUDIO API - V2 - EMIEL ZUURBIER

(function () {
    'use strict';
    var buttons = document.querySelectorAll('.button-audio'),
        audios = document.querySelectorAll('audio');
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: './' })
            .then(function (reg) {
                console.log('registered sw (see console)');
                console.info('registered sw', reg);
            })
            .catch(function (err) {
                console.log('error registering sw (see console)');
                console.error('error registering sw', err);
            });
    } else {
        console.error('ServiceWorker is not supported');
    }
    
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
            analyser = context.createAnalyser(),
            drawVisual,
            canvas = document.querySelector('canvas'),
            canvasCtx = canvas.getContext('2d'),
            bufferList = [],
            paths = [],
            playing = [],
            controls = document.querySelectorAll('input[type="range"]'),
            stop = document.getElementById('stop'),
            reset = document.getElementById('reset'),
            tempoLight = document.getElementById('tempo'),
            tempoInd = document.getElementById('tempo-indicator'),
            osc = document.getElementById('osc'),
            oscGainNode = context.createGain(),
            oscMarkerX = document.getElementById('osc-marker-x'),
            oscMarkerY = document.getElementById('osc-marker-y'),
            oscArray = [],
            handlerClick,
            handlerMove;
        
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
        panFilter.connect(analyser);
        analyser.connect(context.destination);
        
        // CONFIGUR ANALYSER
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        console.log(analyser.frequencyBinCount);
                
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
        
        // OSCILLATOR CONSTRUCTOR
        function Oscillator(type, frequency, detune, connect) {
            this.source = context.createOscillator();
            this.source.type = type;
            this.source.frequency.value = frequency;
            this.source.detune.value = detune;
            this.source.connect(connect);
        }
        
        Oscillator.prototype.start = function () {
            this.source.start();
        }
        
        Oscillator.prototype.stop = function () {
            this.source.stop();
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
        
        // VISUALIZE WAVES
        // CODE FROM voice-change-o-matic BY mdn ON 
        // https://github.com/mdn/voice-change-o-matic/
        function visualize() {
            var WIDTH = canvas.width,
                HEIGHT = canvas.height;
            
            analyser.fftSize = 2048;
            var bufferLength = analyser.fftSize;
            var dataArray = new Uint8Array(bufferLength);

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            function draw() {
                
                var grd = canvasCtx.createLinearGradient(0,0,0,170);
                grd.addColorStop(0,"#194A19");
                grd.addColorStop(1,"#282B27");

                drawVisual = requestAnimationFrame(draw);

                analyser.getByteTimeDomainData(dataArray);

                canvasCtx.fillStyle = grd;
                canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = '#427b42';

                canvasCtx.beginPath();

                var sliceWidth = WIDTH * 1.0 / bufferLength;
                var x = 0;

                for(var i = 0; i < bufferLength; i++) {

                    var v = dataArray[i] / 128.0;
                    var y = v * HEIGHT/2;

                    if(i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                    canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                canvasCtx.lineTo(canvas.width, canvas.height/2);
                canvasCtx.stroke();
            }

            draw();
        }
        
        // START THE VIUSALIZER
        visualize();
        
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
            var values = [500, 0, 10000, 0, 0, 0.46875];
            for (var i = 0; i < controls.length; i += 1) {
                controls[i].value = values[i];
            }
            
            gainNode.gain.value = controls[0].value / 500;
            highFilter.frequency.value = controls[1].value;
            lowFilter.frequency.value = controls[2].value;
            notchFilter.frequency.value = controls[3].value;
            panFilter.pan.value = controls[4].value;
            event.preventDefault();
        }
        
        // START OSCILLATOR
        function oscPlayer(event) {
            if (oscArray.length === 0) {
                                
                // SHOW DIAGRAM
                oscMarkerX.classList.toggle('hidden');
                oscMarkerY.classList.toggle('hidden');
                
                // GET SELECTED OSCILLATOR TYPE
                var oscType = document.getElementById('oscillator-type'),
                    oscTypeSelected = oscType.options[oscType.selectedIndex].value;
            
                // CREATE NEW OSCILLATORS
                var toneC = new Oscillator(
                    oscTypeSelected, 
                    261.63, 
                    100, 
                    analyser
                );

                var toneE = new Oscillator(
                    oscTypeSelected,
                    329.63,
                    100,
                    analyser
                );

                var toneG = new Oscillator(
                    oscTypeSelected,
                    392.00,
                    100,
                    analyser
                );
                
                oscArray.push(toneC, toneE, toneG);
                
                // PLAY THE OSCILLATOR
                for (var i = 0; i < oscArray.length; i += 1) {
                    oscArray[i].start();
                }
                
            } else {
                
                // HIDE DIAGRAM
                oscMarkerX.classList.toggle('hidden');
                oscMarkerY.classList.toggle('hidden');
                
                // STOP ALL OSCILLATORS
                for (var i = 0; i < oscArray.length; i += 1) {
                    oscArray[i].stop();
                }
                
                oscArray = [];
                
            }
        }
        
        // OSCILLATOR CONTROL
        function oscControl(event) {
            var oscFreqValue = [261.63, 329.63, 392.00];
            
            oscMarkerX.style.transform = 'translate(' + event.layerX + 'px, ' + 0 + 'px)';
            oscMarkerY.style.transform = 'translate(' + 0 + 'px, ' + event.layerY + 'px)';
            
            for (var i = 0; i < oscArray.length; i += 1) {
                
                // X AXIS FREQUENCY CHANGE
                oscArray[i].source.frequency.value = oscFreqValue[i] + event.layerX;
                
                // Y AXIS DETUNE CHANGE
                oscArray[i].source.detune.value = -100 + event.layerY;
            }
        }
                
        // TOGGLE KEYPRESS ANIMATION
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
            handlerClick = 'touchstart';
            handlerMove = 'touchmove';
        } else {
            handlerClick = 'click';
            handlerMove = 'mousemove'
        }
        
        // ADD EVENTLISTENERS TO BUTTONS EXCEPT THE LAST BUTTON
        for (var i = 0; i < buttons.length -1; i += 1) {
            buttons[i].addEventListener(handlerClick, createSound, false);
        }
        
        // ADD EVENTLISTENER FOR MELODY BUTTON
        buttons[buttons.length -1].addEventListener(handlerClick, createMelody, false);
        
        // ADD EVENTLISTENERS TO CONTROLS
        for (var i = 0; i < controls.length; i += 1) {
            controls[i].addEventListener('input', effectControls, false);
        }
        
        // ADD EVENTLISTENERS TO ADDITIONAL CONTROLS
        stop.addEventListener('click', stopSound, false);
        reset.addEventListener('click', resetControls, false);
        osc.addEventListener('click', oscPlayer, false);
        document.addEventListener('keydown', keypress, false);
        document.addEventListener('keyup', keypressUp, false);
        osc.addEventListener(handlerMove, oscControl, false);
        
    } else if ('addEventListener' in window) {

        // AUDIOTAG FUNCTIONS
        // THIS IS ACTIVATED WHEN THE AUDIOCONTEXT IS NOT SUPPORTED
        document.getElementById('form').className = 'form hidden';
        
        function playAudioTagBeat(event) {
            var audioPlayer = audios[event.target.id];
            audioPlayer.currentTime = 0;
            audioPlayer.play();
            
            event.preventDefault();
            event.returnValue = false;
        }
        
        // PLAY WITH AUDIOTAG
        function playAudioTagMelody(event) {
            var audioPlayer = audios[event.target.id];
            if (!audioPlayer.paused) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            event.preventDefault();
            event.returnValue = false;
        }

        // ADD EVENTLISTENERS FOR AUDIO TAGS
        for (var i = 0; i < buttons.length - 1; i += 1) {
            buttons[i].addEventListener('click', playAudioTagBeat, false);
        }
    
        buttons[buttons.length - 1].addEventListener('click', playAudioTagMelody, false);
        
    } else {
        
        // IF AUDIOCONTEXT AND AUDIO TAGS ARE NOT SUPPORTED FALLBACK TO BASIC USAGE
        document.getElementById('form').className = 'form hidden';
        
    }
    
}());