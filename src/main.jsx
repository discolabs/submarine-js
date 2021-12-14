import React from 'react'
import ReactDOM from 'react-dom'
import App from './portal/App';
import { Submarine } from '../lib/submarine';
import { generateDevConfig } from './helpers/helpers';

const devConfig = generateDevConfig();

const submarine = new Submarine(devConfig);

window.submarine = submarine;

ReactDOM.render(
  <App submarine={submarine} />,
  document.getElementById('app')
);
