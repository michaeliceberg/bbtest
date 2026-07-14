export const quests = [ 
    {
        title: 'Выполни ДЗ',
        value: [6,2],

    },
]









export const triangleGdeProtivKatet = [
    {
      'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
      'xCoord': [0.7, 0.2],
      'answer': ['прил. к', 'гипотенуза', 'прот. к'],
    },
    {
      'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
      'xCoord': [0.15, 0.5],
      'answer': ['прот. к', 'гипотенуза', 'прил. к'],
    },

    {
      'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
      'xCoord': [0.7, 0.5],
      'answer': ['прот. к', 'прил. к', 'гипотенуза'],
    },
    {
      'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
      'xCoord': [0.25, 0.2],
      'answer': ['прил. к', 'прот. к', 'гипотенуза'],
    },

    {
      'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
      'xCoord': [0.25, 0.6],
      'answer': ['прил. к', 'прот. к', 'гипотенуза'],
    },
    {
      'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
      'xCoord': [0.7, 0.3],
      'answer': ['против. к', 'прил. к', 'гипотенуза'],
    },

    {
      'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
      'xCoord': [0.17, 0.3],
      'answer': ['прот. к', 'гипотенуза', 'прил. к'],
    },
    {
      'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
      'xCoord': [0.7, 0.6],
      'answer': ['прил. к', 'гипотенуза', 'прот. к'],
    },
]



export const triangleGdeKatet = [
{
'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
'xCoord': [0.7, 0.2],
'answer': ['катет', 'гипотенуза', 'катет'],
},
{
'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
'xCoord': [0.15, 0.5],
'answer': ['катет', 'гипотенуза', 'катет'],
},

{
'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
'xCoord': [0.7, 0.5],
'answer': ['катет', 'катет', 'гипотенуза'],
},
{
'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
'xCoord': [0.25, 0.2],
'answer': ['катет', 'катет', 'гипотенуза'],
},

{
'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
'xCoord': [0.25, 0.6],
'answer': ['катет', 'катет', 'гипотенуза'],
},
{
'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
'xCoord': [0.7, 0.3],
'answer': ['катет', 'катет', 'гипотенуза'],
},

{
'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
'xCoord': [0.17, 0.3],
'answer': ['катет', 'гипотенуза', 'катет'],
},
{
'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
'xCoord': [0.7, 0.6],
'answer': ['катет', 'гипотенуза', 'катет'],
},
]


// Надо сделать Свойство Биссектрисы (пропорция кусочков)
export const triangleBissektr = [
{
'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
'xCoord': [0.7, 0.2],
'answer': ['катет', 'гипотенуза', 'катет'],
},
]




export const triangleGdeSinCosTg = [
{
'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
'xCoord': [0.7, 0.2],
'answer': 
[{variant: 'sin',answer: ['c', 'b'],},
{variant: 'cos',answer: ['a', 'b'],},
{variant: 'tg',answer: ['c', 'a'],},]
// 'answer': ['прил. к', 'гипотенуза', 'прот. к'],
},
{
'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
'xCoord': [0.15, 0.5],
'answer': 
[{variant: 'sin',answer: ['a', 'b'],},
{variant: 'cos',answer: ['c', 'b'],},
{variant: 'tg',answer: ['a', 'c'],},]

// 'answer': ['прот. к', 'гипотенуза', 'прил. к'],
},

{
'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
'xCoord': [0.7, 0.5],
'answer': 
[{variant: 'sin',answer: ['a', 'c'],},
{variant: 'cos',answer: ['b', 'c'],},
{variant: 'tg',answer: ['a', 'b'],},]

// 'answer': ['прот. к', 'прил. к', 'гипотенуза'],
},
{
'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
'xCoord': [0.25, 0.2],
'answer': 
[{variant: 'sin',answer: ['b', 'c'],},
{variant: 'cos',answer: ['a', 'c'],},
{variant: 'tg',answer: ['b', 'a'],},]

// 'answer': ['прил. к', 'прот. к', 'гипотенуза'],
},

{
'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
'xCoord': [0.25, 0.6],
'answer': 
[{variant: 'sin',answer: ['b', 'c'],},
{variant: 'cos',answer: ['a', 'c'],},
{variant: 'tg',answer: ['b', 'a'],},]

// 'answer': ['прил. к', 'прот. к', 'гипотенуза'],
},
{
'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
'xCoord': [0.7, 0.3],
'answer': 
[{variant: 'sin',answer: ['a', 'c'],},
{variant: 'cos',answer: ['b', 'c'],},
{variant: 'tg',answer: ['a', 'c'],},]

// 'answer': ['против. к', 'прил. к', 'гипотенуза'],
},

{
'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
'xCoord': [0.17, 0.3],
'answer': 
[{variant: 'sin',answer: ['a', 'b'],},
{variant: 'cos',answer: ['c', 'b'],},
{variant: 'tg',answer: ['a', 'c'],},]

// 'answer': ['прот. к', 'гипотенуза', 'прил. к'],
},
{
'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
'xCoord': [0.7, 0.6],
'answer': 
[{variant: 'sin',answer: ['c', 'b'],},
{variant: 'cos',answer: ['a', 'b'],},
{variant: 'tg',answer: ['c', 'a'],},]

// 'answer': ['прил. к', 'гипотенуза', 'прот. к'],
},
]




// для страницы TQUIZ


export const FINISH_AUDIO_SRC_LIST = [
  '/MemesAudio/meme-right-chetko.WAV',
  '/MemesAudio/meme-right-chinazes.WAV',
  '/MemesAudio/meme-right-umeetemogete.WAV',
  '/MemesAudio/meme-right-clapping.WAV',
  '/MemesAudio/meme-right-gtapassed.WAV',
  '/MemesAudio/meme-right-nice.WAV',
  '/MemesAudio/meme-right-papichlegkaya.WAV',
] as const;