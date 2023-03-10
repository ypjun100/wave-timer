import React, { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';
import { useDispatch, useSelector } from 'react-redux';

import { WaveManager } from '../../utils/wave/wave-manager';
import { TimerUIContainer } from '../../utils/timer-ui/timer-ui';
import { WaveAnimate, WaveAnimateQueue } from '../../utils/wave-animate/wave-animate';

import { setInitialSeconds } from '../../slices/initialSecondsSlice';
import { setBreakSeconds } from '../../slices/breakSecondsSilce';
import { setNumberOfTimes } from '../../slices/numberOfTimesSlice';

export default function WaveTimer() {
  const theme = useSelector((state) => state.theme);
  var initialSeconds = useSelector((state) => state.initialSeconds);
  var breakSeconds = useSelector((state) => state.breakSeconds);
  var numberOfTimes = useSelector((state) => state.numberOfTimes);
  const dispatch = useDispatch();
  const _ui = useRef(null);
  const _wave = useRef(null);

  // didMount
  useEffect(() => {
    const canvas = document.getElementById("wave-timer-canvas");
    const app = new Application({
      antialias: true,
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      autoDensity: true,
      backgroundAlpha: 0,
      resolution: 2,
      resizeTo: window});
    const graphics = new Graphics();
    app.stage.addChild(graphics);

    // get saved initialseconds
    if(window.localStorage.getItem('initialSeconds')) {
      dispatch(setInitialSeconds(parseInt(window.localStorage.getItem('initialSeconds'))));
    }

    // get saved break seconds
    if(window.localStorage.getItem('breakSeconds')) {
      dispatch(setBreakSeconds(parseInt(window.localStorage.getItem('breakSeconds'))));
    }

    // get saved number of times
    if(window.localStorage.getItem('numberOfTimes')) {
      dispatch(setNumberOfTimes(parseInt(window.localStorage.getItem('numberOfTimes'))));
    }

    // create ui
    const ui = new TimerUIContainer(window.innerWidth, window.innerHeight, initialSeconds, breakSeconds);
    _ui.current = ui;
    ui.onTimerStarted = () => {
      wave.startWave();
      WaveAnimateQueue.enQueue(new WaveAnimate(wave, ui.currentSeconds / ui.currentInitialSeconds, 0.15));
    }
    ui.onTimerPaused = () => { wave.stopWave(); }
    ui.onTimerEachSecond = (currentSeconds, currentInitialSeconds) => { WaveAnimateQueue.enQueue(new WaveAnimate(wave, currentSeconds / currentInitialSeconds, 0.7)); };
    ui.onTimerFinished = (numberOfTimes) => {
      WaveAnimateQueue.enQueue(new WaveAnimate(wave, 0.5, 0.15));
      dispatch(setNumberOfTimes(numberOfTimes));
    }
    app.stage.addChild(ui.container);
    
    // create wave graphics
    const wave = new WaveManager(theme, window.innerWidth, window.innerHeight, document, canvas, graphics, "wave-timer-canvas");
    _wave.current = wave;
    wave.registerFpsText(ui.fps);

    // render
    app.ticker.add(() => {
      wave.render();
    });

    // resize
    window.onresize = () => {
      wave.resize(window.innerWidth, window.innerHeight);
      ui.resize(window.innerWidth, window.innerHeight);
    };

    // wave user interaction
    window.onmousedown = (e) => {
      if(document.getElementsByClassName('overlay-card')[0].style.display === 'none')
        wave.mouseDown(e.clientX);
    };
    window.ontouchstart = (e) => {
      if(document.getElementsByClassName('overlay-card')[0].style.display === 'none')
        wave.mouseDown(e.touches[0].clientX);
    };
    // render is not execute functually when user focus was lost. 
    document.onvisibilitychange = () => {
      WaveAnimateQueue.userFocus = document.visibilityState === "visible" ? true : false;
    }
  }, []);

  // when initial seconds chagned
  useEffect(() => {
    _ui.current.setInitialSeconds(initialSeconds);
  }, [initialSeconds]);

  // when number of times changed
  useEffect(() => {
    _ui.current.setNumberOfTimes(numberOfTimes);
    window.localStorage.setItem('numberOfTimes', numberOfTimes);
  }, [numberOfTimes]);

  // when break seconds changed
  useEffect(() => {
    _ui.current.setBreakSeconds(breakSeconds);
  }, [breakSeconds]);

  // when theme state changed
  useEffect(() => {
    if(theme === 'light')
      _wave.current.setLightTheme();
    else
      _wave.current.setDarkTheme();
  }, [theme]);

  return (
    <canvas id="wave-timer-canvas" style={{position: 'absolute', zIndex: '-1'}}></canvas>
  );
}
