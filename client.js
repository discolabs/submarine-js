import { Submarine } from './src/submarine';

const initialise = () => {

  // check we are in a browser context
  if(!window || !document) { return; }

  // create a submarine object
  window.submarine = new Submarine();

};

initialise();