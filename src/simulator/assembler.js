import {
  section,
  MEM_DATA_START,
  MEM_TEXT_START,
  symbolT,
  BYTES_PER_WORD,
  SYMBOL_TABLE,
  DEBUG,
  instList,
} from '../utils/constants.js';
import {
  symbolTableAddEntry,
  toHexAndPad,
  numToBits,
} from '../utils/functions.js';
import {
  dataSeg,
  increaseDataSectionSize,
  increaseTextSectionSize,
  resetDataSeg,
  resetTextSeg,
  textSeg,
} from '../utils/state.js';

export const makeSymbolTable = inputs => {
  /*
   * make symbol table from assembly file
   * using SYMBOL_TABLE in constants.js
   * 
   * 'dataSeg'에 data 저장
   * 'textSeg'에 text 저장
   * 
   * .text 
   * - indicates that following items are stored in the user text segment, typically instructions 
   * - It always starts from 0x400000 (MEM_TEXT_START)

   * .data 
   * - indicates that following data items are stored in the data segment 
   * - It always starts from 0x10000000 (MEM_DATA_START)
​   */
  let address = 0;
  let curSection = section.MAX_SIZE;

  resetDataSeg();
  resetTextSeg();

  inputs.forEach(input => {
    const splited = input.split('\t').filter(s => s !== ''); // ex. ['array:', '.word', '3']
    const symbol = new symbolT();

    if (splited[0] == '.data') {
      curSection = section.DATA;
      address = MEM_DATA_START;
      return;
    } else if (splited[0] == '.text') {
      curSection = section.TEXT;
      address = MEM_TEXT_START;
      return;
    } else if (curSection === section.DATA) {
      if (splited.length === 2) {
        // ex. ['.word','123']
        dataSeg.push(splited[1]);
      } else {
        // ex. ['array:', '.word', '3']
        symbol.address = address;
        symbol.name = splited[0].replace(':', '');
        symbolTableAddEntry(symbol);
        dataSeg.push(splited[2]);
      }
      increaseDataSectionSize();
    } else if (curSection === section.TEXT) {
      if (splited.length === 1) {
        // ex. ['main:']
        symbol.name = splited[0].replace(':', '');
        symbol.address = address;
        symbolTableAddEntry(symbol);
        return;
      } else {
        // ex. ['and', '$17, $17, $0']
        const name = splited[0];
        textSeg.push(input); // ex. 'and	$17, $17, $0'
        if (name === 'la') {
          const targetSymbol = splited[1].split(' ')[1]; // ex. 'data1'
          const targetAddress = toHexAndPad(SYMBOL_TABLE[targetSymbol]);
          if (targetAddress.slice(4) !== '0000') {
            increaseTextSectionSize();
            address += BYTES_PER_WORD;
          }
        }
      }
      increaseTextSectionSize();
    }

    address += BYTES_PER_WORD;
  });
};

export const recordTextSection = fout => {
  /**
   * textSeg에 있는 text들 한 줄 씩 체크해서 fout에 바이너리 문장으로 추가
   * 명령어 타입별(R, I, J)로 명령어 이름별로 묶어서 번역
   * 
   * parameter로 받는 fout은 list
   *  - fout이라는 list에 명령어를 번역한 binary 문장을 한 줄씩 추가
   *  - return 값은 별도로 없고 함수의 side effect 이용
   *  - ex) fout: ['00000000000000000000000001011000', '00000000000000000000000000001100']
​   */
  let instruct;
  let rs, rt, rd, imm, shamt;
  for (const text of textSeg) {
    instruct = text.slice(1).replace(/ /g, '').split(/,|\t/);
    const opName = instruct[0];

    if (opName === 'la') {
    } else if (opName === 'move') {
    } else {
      const opInfo = instList[opName];

      if (opInfo.type === 'R') {
        if (opInfo.name === 'sll' || opInfo.name === 'srl') {
          rs = '00000';
          rt = numToBits(Number(instruct[2].replace('$', '')), 5);
          rd = numToBits(Number(instruct[1].replace('$', '')), 5);
          shamt = numToBits(Number(instruct[3].replace('$', '')), 5);
        } else if (opInfo.name === 'jr') {
          rs = numToBits(Number(instruct[1].replace('$', '')), 5);
          rt = '00000';
          rd = '00000';
          shamt = '00000';
        } else {
          rs = numToBits(Number(instruct[2].replace('$', '')), 5);
          rt = numToBits(Number(instruct[3].replace('$', '')), 5);
          rd = numToBits(Number(instruct[1].replace('$', '')), 5);
          shamt = '00000';
        }
      } else if (opInfo.type === 'I') {
      } else if (opInfo.type === 'J') {
      }
    }
  }
};

export const recordDataSection = fout => {
  /**
   * dataSeg에 있는 data들 한 줄 씩 체크해서 fout에 바이너리 문장으로 추가
   * data값을 그대로 binary 문자로 번역
   * 
   * parameter로 받는 fout은 list
   *  - fout이라는 list에 명령어를 번역한 binary 문장을 한 줄씩 추가
   *  - return 값은 별도로 없고 함수의 side effect 이용
   *  - ex) fout: ['00000010001000001000100000100100', '00000010010000001001000000100100']
  ​   */
  let curAddress = MEM_DATA_START;
  let dataNum;
  for (const data of dataSeg) {
    if (data.slice(0, 2) === '0x') {
      dataNum = parseInt(data.slice(2), 16);
    } else {
      dataNum = Number(data);
    }
    //console.log(numToBits(dataNum));
    curAddress += BYTES_PER_WORD;
  }
};

export const makeBinaryFile = fout => {
  /**
   * fout에 text 문장 개수를 binary로 번역해서 추가
   * fout에 data 개수를 binary로 번역해서 추가
   */

  recordTextSection(fout);
  recordDataSection(fout);
};
