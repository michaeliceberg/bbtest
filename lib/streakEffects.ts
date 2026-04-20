export type StreakEffect = {
    streak: number
    title: string
    image: string
    audio: string
  }
  



  
  export const memeEffects = [
    {
        image: "/Avatars/cat1.jpg",
        audio: "/MemesAudio/meme-right-nice.WAV"
    },
    {
        image: "/MemesImage/meme-right-chinazes.jpg",
        audio: "/MemesAudio/meme-right-chinazes.WAV"
    },
    {
        image: "/MemesImage/meme-wrong-pacankuspehy.jpeg",
        audio: "/MemesAudio/meme-wrong-pacankuspehy.WAV"
    }
  ]

  export function randomMeme(){
    return memeEffects[
      Math.floor(Math.random()*memeEffects.length)
    ]
  }


  export function createEffect(streak:number): StreakEffect {

    const meme = randomMeme()
  
    return {
      streak,
      title: "ЧЕТКО 😎",
      image: meme.image,
      audio: meme.audio
    }
  }