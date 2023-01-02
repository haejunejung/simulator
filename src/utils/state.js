import {BYTES_PER_WORD} from './constants.js';

// Temporary file stream pointers
export let dataSeg = [];
export let textSeg = [];
export let binary = [];

// Size of each section
export let dataSectionSize = 0;
export let textSectionSize = 0;

export const increaseDataSectionSize = () => {
  dataSectionSize += BYTES_PER_WORD;
};

export const increaseTextSectionSize = () => {
  textSectionSize += BYTES_PER_WORD;
};

export const resetDataSeg = () => {
  dataSeg = [];
};

export const resetTextSeg = () => {
  textSeg = [];
};
