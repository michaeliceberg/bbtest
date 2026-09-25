// Звуки-мемы окон правильного/неправильного ответа задачника
// (components/modals/rightanswer-modal.tsx / wronganswer-modal.tsx).
// Отдельный файл без Lottie — чтобы app/lesson/quiz.tsx мог их предзагрузить,
// не подтягивая сами окна (их статический импорт lottie-react роняет SSR).

export const rightAudioList = [
    '/MemesAudio/meme-right-chinazes.m4a',
    '/MemesAudio/meme-right-clapping.m4a', 
    '/MemesAudio/meme-right-estestvenno.m4a',
    '/MemesAudio/meme-right-gtapassed.m4a',
    '/MemesAudio/meme-right-nice.m4a', 
    '/MemesAudio/meme-right-umeetemogete.m4a', 
    '/MemesAudio/meme-right-chetko.m4a',
]

export const wrongAudioList = [
    '/MemesAudio/meme-wrong-kid.m4a', 
    '/MemesAudio/meme-wrong-sharish.m4a',
    '/MemesAudio/meme-wrong-polnomochia.m4a',
    '/MemesAudio/meme-wrong-ponovoy.m4a', 
    '/MemesAudio/meme-wrong-shirokuiu.m4a', 
    '/MemesAudio/meme-wrong-tivtiraesh.m4a', 
    '/MemesAudio/meme-wrong-tipereputal.m4a',
    '/MemesAudio/meme-wrong-pacankuspehy.m4a',
    '/MemesAudio/meme-wrong-shokoladnevinovat.m4a',
    '/MemesAudio/meme-wrong-etofiaskobratan.m4a',
    '/MemesAudio/meme-wrong-skolko.m4a',
]
