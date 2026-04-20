import { auth } from "@clerk/nextjs/server"
const adminIds = [
    'user_2iBIN3cZPnPAEV0AMR5zgJ9AYec',
    'user_2gPztlGNKoq3wKjOYg1N9rBQasC',
]

export const isAdmin = () => {
    const {userId} = auth()

    // const userId = await getVKUserId()


    if (!userId) {
        return false
    }

    return adminIds.indexOf(userId) != -1
}