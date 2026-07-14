// src/types/declarations.d.ts
declare module '*.json' {
    const value: any
    export default value
  }
  
  // Для конкретных Lottie файлов
  declare module '@/public/Lottie/trainer/*.json' {
    const value: any
    export default value
  }