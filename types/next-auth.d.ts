// // types/next-auth.d.ts
// import { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//     } & DefaultSession["user"];
//   }
// }




// types/next-auth.d.ts
// import "next-auth";

// declare module "next-auth" {
//   interface User {
//     id: string;
//     firstName?: string;
//     lastName?: string;
//   }
  
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       firstName?: string;
//       lastName?: string;
//     };
//   }
// }


// // types/next-auth.d.ts
// import { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//     } & DefaultSession["user"];
//   }

//   interface Profile {
//     id: number;
//     email?: string;
//     first_name?: string;
//     last_name?: string;
//     photo_100?: string;
//   }
// }




// types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // email?: string | null;
    } & DefaultSession["user"];
  }

  interface Profile {
    id: number;
    // email?: string;
    // first_name?: string;
    // last_name?: string;
    // photo_100?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    // picture?: string;
  }
}